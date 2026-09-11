import { describe, it, expect } from 'vitest'
import {
  resistenciaMalhaSverak,
  montarMalha,
  resistenciaAparenteFv,
  avaliarQuedaPotencial,
  patamarRegistrado,
  POSICOES_PATAMAR,
  POS_62,
  LIMITE_PATAMAR_PCT,
  avaliarMalha,
  medirContinuidadeFv,
  avaliarEquipotencializacao,
  LIMITE_EQUIPOT_CONFORME,
  LIMITE_EQUIPOT_ATENCAO,
  fatorCs,
  limiteToque,
  limitePasso,
  medirToquePasso,
  emitirLaudoFv,
  RESISTIVIDADE_SOLO,
  type PontoCurvaFv,
} from './usinaFv'
import {
  AREA_MALHA_M2,
  PROFUNDIDADE_MALHA,
  comprimentoEnterradoM,
  DISTANCIAS_C_M,
  DIAGONAL_MALHA_M,
  PONTOS_CONTINUIDADE_FV,
  PONTOS_TOQUE_PASSO_FV,
  POTENCIA_DC_KWP,
  getPontoContinuidadeFv,
  getPontoToquePassoFv,
} from '../catalog/usinaFvPontos'

const malhaDe = (perfil: keyof typeof RESISTIVIDADE_SOLO) =>
  montarMalha(RESISTIVIDADE_SOLO[perfil], AREA_MALHA_M2, comprimentoEnterradoM(), PROFUNDIDADE_MALHA)

/** Registra as três posições do patamar, como o operador faria. */
const registrarPatamar = (malha: ReturnType<typeof malhaDe>, d: number): PontoCurvaFv[] =>
  POSICOES_PATAMAR.map((x) => ({ x, r: resistenciaAparenteFv(malha, d, x) }))

describe('usina FV — planta', () => {
  it('arranjo de ~100 kWp com a diagonal de referência da malha', () => {
    expect(POTENCIA_DC_KWP).toBeCloseTo(99.9, 1)
    expect(DISTANCIAS_C_M.at(-1)).toBeGreaterThanOrEqual(5 * DIAGONAL_MALHA_M - 10)
  })
})

describe('usina FV — resistência da malha (Sverak)', () => {
  it('é proporcional à resistividade do solo', () => {
    const r1 = resistenciaMalhaSverak(100, 1700, 570, 0.5)
    expect(resistenciaMalhaSverak(500, 1700, 570, 0.5)).toBeCloseTo(5 * r1, 9)
  })

  it('cai com a área e com o comprimento enterrado', () => {
    expect(resistenciaMalhaSverak(100, 3400, 570, 0.5)).toBeLessThan(resistenciaMalhaSverak(100, 1700, 570, 0.5))
    expect(resistenciaMalhaSverak(100, 1700, 900, 0.5)).toBeLessThan(resistenciaMalhaSverak(100, 1700, 570, 0.5))
  })

  it('perfis de solo levam a vereditos distintos', () => {
    expect(avaliarMalha(malhaDe('umido').rg).cor).toBe('pass')
    expect(avaliarMalha(malhaDe('arenoso').rg).cor).toBe('pass')
    expect(avaliarMalha(malhaDe('rochoso').rg).cor).toBe('marginal')
  })
})

describe('usina FV — queda de potencial com malha grande', () => {
  it('com a estaca C a 5× a diagonal, a leitura a 62 % fica perto da verdadeira', () => {
    const m = malhaDe('arenoso')
    const d = DISTANCIAS_C_M.at(-1)!
    expect(Math.abs(resistenciaAparenteFv(m, d, POS_62) - m.rg) / m.rg).toBeLessThan(0.03)
  })

  it('com a estaca C perto, a leitura a 62 % erra mais', () => {
    const m = malhaDe('arenoso')
    const erro = (d: number) => Math.abs(resistenciaAparenteFv(m, d, POS_62) - m.rg) / m.rg
    expect(erro(DISTANCIAS_C_M[0])).toBeGreaterThan(erro(DISTANCIAS_C_M.at(-1)!))
    expect(erro(DISTANCIAS_C_M[0])).toBeGreaterThan(0.1)
  })

  it('a curva sobe a partir de E e dispara junto de C', () => {
    const m = malhaDe('arenoso')
    const d = DISTANCIAS_C_M.at(-1)!
    expect(resistenciaAparenteFv(m, d, 0.05)).toBeLessThan(resistenciaAparenteFv(m, d, POS_62))
    expect(resistenciaAparenteFv(m, d, 0.99)).toBeGreaterThan(2 * resistenciaAparenteFv(m, d, POS_62))
  })

  it('só há patamar com a estaca C distante', () => {
    const m = malhaDe('arenoso')
    const longe = avaliarQuedaPotencial(m, DISTANCIAS_C_M.at(-1)!, registrarPatamar(m, DISTANCIAS_C_M.at(-1)!))!
    const perto = avaliarQuedaPotencial(m, DISTANCIAS_C_M[0], registrarPatamar(m, DISTANCIAS_C_M[0]))!
    expect(longe.patamarOk).toBe(true)
    expect(longe.variacaoPct).toBeLessThanOrEqual(LIMITE_PATAMAR_PCT)
    expect(longe.valida).toBe(true)
    expect(perto.patamarOk).toBe(false)
    expect(perto.valida).toBe(false)
    expect(perto.veredito).toMatch(/Inconclusivo/)
  })

  it('exige as três posições do patamar antes de calcular', () => {
    const m = malhaDe('umido')
    const d = DISTANCIAS_C_M.at(-1)!
    const doisPontos = registrarPatamar(m, d).slice(0, 2)
    expect(patamarRegistrado(doisPontos)).toBe(false)
    expect(avaliarQuedaPotencial(m, d, doisPontos)).toBeNull()
    expect(patamarRegistrado(registrarPatamar(m, d))).toBe(true)
  })
})

describe('usina FV — continuidade da equipotencialização', () => {
  it('instalação íntegra: todos os pontos conformes, com pontas zeradas', () => {
    for (const p of PONTOS_CONTINUIDADE_FV) {
      const l = medirContinuidadeFv(p, 'conforme', true)
      expect(l.aprovado).toBe(true)
      expect(l.r).toBeLessThan(0.1)
    }
  })

  it('com defeitos: anodização reprova, corrosão pede atenção, portão abre o circuito', () => {
    expect(medirContinuidadeFv(getPontoContinuidadeFv('m4')!, 'com-defeitos', true).cor).toBe('fail')
    expect(medirContinuidadeFv(getPontoContinuidadeFv('m6')!, 'com-defeitos', true).cor).toBe('marginal')
    const portao = medirContinuidadeFv(getPontoContinuidadeFv('portao')!, 'com-defeitos', true)
    expect(portao.r).toBe(Infinity)
    expect(portao.display).toBe('OL')
  })

  it('pontas não compensadas somam à leitura', () => {
    const p = getPontoContinuidadeFv('m1')!
    expect(medirContinuidadeFv(p, 'conforme', false).r).toBeGreaterThan(medirContinuidadeFv(p, 'conforme', true).r)
  })

  it('limites inclusivos', () => {
    expect(avaliarEquipotencializacao(LIMITE_EQUIPOT_CONFORME).cor).toBe('pass')
    expect(avaliarEquipotencializacao(LIMITE_EQUIPOT_ATENCAO).cor).toBe('marginal')
    expect(avaliarEquipotencializacao(LIMITE_EQUIPOT_ATENCAO + 0.01).cor).toBe('fail')
  })
})

describe('usina FV — toque e passo', () => {
  it('Cs = 1 sem camada e < 1 com brita mais resistiva que o solo', () => {
    expect(fatorCs(500, 500, 0.1)).toBeCloseTo(1, 9)
    expect(fatorCs(500, 3000, 0.1)).toBeLessThan(1)
  })

  it('a brita eleva os limites de toque e passo', () => {
    expect(limiteToque(500, 'brita')).toBeGreaterThan(limiteToque(500, 'grama'))
    expect(limitePasso(500, 'brita')).toBeGreaterThan(limitePasso(500, 'grama'))
  })

  it('limite de passo é maior que o de toque', () => {
    expect(limitePasso(500, 'grama')).toBeGreaterThan(limiteToque(500, 'grama'))
  })

  it('extrapola a leitura de ensaio para a corrente de falta', () => {
    const l = medirToquePasso(PONTOS_TOQUE_PASSO_FV[0], malhaDe('arenoso'), 'conforme')
    expect(l.vFalta).toBeGreaterThan(l.vTeste)
  })

  it('solo arenoso íntegro passa; portão sem cordoalha reprova', () => {
    const m = malhaDe('arenoso')
    for (const p of PONTOS_TOQUE_PASSO_FV) expect(medirToquePasso(p, m, 'conforme').aprovado).toBe(true)
    expect(medirToquePasso(getPontoToquePassoFv('t-portao')!, m, 'com-defeitos').aprovado).toBe(false)
  })

  it('solo rochoso reprova o toque junto ao trafo mesmo com brita', () => {
    expect(medirToquePasso(getPontoToquePassoFv('t-trafo')!, malhaDe('rochoso'), 'conforme').aprovado).toBe(false)
  })
})

describe('usina FV — laudo', () => {
  const completo = (perfil: keyof typeof RESISTIVIDADE_SOLO, cenario: 'conforme' | 'com-defeitos', d = DISTANCIAS_C_M.at(-1)!) => {
    const m = malhaDe(perfil)
    return emitirLaudoFv({
      pontosContinuidade: PONTOS_CONTINUIDADE_FV,
      continuidade: Object.fromEntries(PONTOS_CONTINUIDADE_FV.map((p) => [p.id, medirContinuidadeFv(p, cenario, true)])),
      malha: avaliarQuedaPotencial(m, d, registrarPatamar(m, d)),
      pontosToquePasso: PONTOS_TOQUE_PASSO_FV,
      toquePasso: Object.fromEntries(PONTOS_TOQUE_PASSO_FV.map((p) => [p.id, medirToquePasso(p, m, cenario)])),
    })
  }

  it('usina íntegra em solo úmido é conforme', () => {
    const l = completo('umido', 'conforme')
    expect(l.completo).toBe(true)
    expect(l.conforme).toBe(true)
    expect(l.achados).toHaveLength(0)
  })

  it('cenário com defeitos lista os achados de continuidade e do portão', () => {
    const l = completo('arenoso', 'com-defeitos')
    expect(l.conforme).toBe(false)
    const itens = l.achados.map((a) => a.item)
    expect(itens).toContain('Mesa M4 — estrutura')
    expect(itens).toContain('Portão da cerca')
    expect(itens).toContain('Toque — portão, lado externo')
  })

  it('curva sem patamar vira achado, não aprovação', () => {
    const l = completo('umido', 'conforme', DISTANCIAS_C_M[0])
    expect(l.conforme).toBe(false)
    expect(l.achados.some((a) => a.ensaio === 'Resistência da malha')).toBe(true)
  })

  it('laudo sem todos os ensaios é incompleto', () => {
    const l = emitirLaudoFv({
      pontosContinuidade: PONTOS_CONTINUIDADE_FV,
      continuidade: {},
      malha: null,
      pontosToquePasso: PONTOS_TOQUE_PASSO_FV,
      toquePasso: {},
    })
    expect(l.completo).toBe(false)
    expect(l.conforme).toBe(false)
  })
})

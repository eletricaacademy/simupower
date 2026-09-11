import { describe, it, expect } from 'vitest'
import {
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
  type PerfilSoloFv,
} from './usinaFv'
import {
  AREA_MALHA_M2,
  PROFUNDIDADE_MALHA,
  MALHA_FV,
  HASTES_FV,
  COMPRIMENTO_HASTE,
  DISTANCIAS_C_M,
  DIAGONAL_MALHA_M,
  PONTOS_CONTINUIDADE_FV,
  PONTOS_TOQUE_PASSO_FV,
  POTENCIA_DC_KWP,
  getPontoContinuidadeFv,
  getPontoToquePassoFv,
} from '../catalog/usinaFvPontos'
import { RESULTADOS_FV, GEOMETRIA_CALCULADA, MAPAS_FV } from '../catalog/usinaFvResultados'

type Cen = 'conforme' | 'com-defeitos'
const malhaDe = (perfil: PerfilSoloFv, cenario: Cen = 'conforme') => montarMalha(RESISTIVIDADE_SOLO[perfil], RESULTADOS_FV[cenario])

/** Registra as três posições do patamar, como o operador faria. */
const registrarPatamar = (malha: ReturnType<typeof malhaDe>, d: number): PontoCurvaFv[] =>
  POSICOES_PATAMAR.map((x) => ({ x, r: resistenciaAparenteFv(malha, d, x) }))

const LONGE = DISTANCIAS_C_M[DISTANCIAS_C_M.length - 1]
const PERTO = DISTANCIAS_C_M[0]

describe('usina FV — planta e resultados gravados', () => {
  it('arranjo de ~300 kWp com a diagonal de referência da malha', () => {
    expect(POTENCIA_DC_KWP).toBeCloseTo(299.7, 1)
    expect(LONGE).toBeGreaterThanOrEqual(5 * DIAGONAL_MALHA_M - 10)
  })

  it('os resultados foram calculados para a geometria atual (senão, recalcular)', () => {
    const comprimento = MALHA_FV.reduce((s, c) => s + Math.hypot(c.b[0] - c.a[0], c.b[2] - c.a[2]), 0)
    expect(GEOMETRIA_CALCULADA.condutores).toBe(MALHA_FV.length)
    expect(GEOMETRIA_CALCULADA.comprimentoM).toBeCloseTo(comprimento, 0)
    expect([...GEOMETRIA_CALCULADA.distanciasC]).toEqual(DISTANCIAS_C_M)
    for (const c of ['conforme', 'com-defeitos'] as const) {
      for (const d of DISTANCIAS_C_M) expect(RESULTADOS_FV[c].curvas[d]).toHaveLength(101)
      for (const p of PONTOS_TOQUE_PASSO_FV) expect(RESULTADOS_FV[c].fracoes[p.id]).toBeGreaterThan(0)
      expect(MAPAS_FV[c].b64.length).toBeGreaterThan(1000)
    }
  })

  it('Rg calculado confere com a fórmula de Sverak (IEEE 80) em ±20 %', () => {
    const lt = MALHA_FV.reduce((s, c) => s + Math.hypot(c.b[0] - c.a[0], c.b[2] - c.a[2]), 0) + HASTES_FV.length * COMPRIMENTO_HASTE
    const a = AREA_MALHA_M2
    const sverak = 1 / lt + (1 / Math.sqrt(20 * a)) * (1 + 1 / (1 + PROFUNDIDADE_MALHA * Math.sqrt(20 / a)))
    expect(Math.abs(RESULTADOS_FV.conforme.rg - sverak) / sverak).toBeLessThan(0.2)
  })

  it('perfis de solo levam a vereditos distintos', () => {
    expect(avaliarMalha(malhaDe('umido').rg).cor).toBe('pass')
    expect(avaliarMalha(malhaDe('arenoso').rg).cor).toBe('pass')
    expect(avaliarMalha(malhaDe('rochoso').rg).cor).toBe('marginal')
  })

  it('Rg escala linearmente com a resistividade', () => {
    expect(malhaDe('arenoso').rg).toBeCloseTo(5 * malhaDe('umido').rg, 9)
  })
})

describe('usina FV — queda de potencial com malha grande', () => {
  it('com a estaca C a 5× a diagonal, a leitura a 62 % fica perto da verdadeira', () => {
    const m = malhaDe('arenoso')
    expect(Math.abs(resistenciaAparenteFv(m, LONGE, POS_62) - m.rg) / m.rg).toBeLessThan(0.05)
  })

  it('com a estaca C perto, a leitura a 62 % erra mais', () => {
    const m = malhaDe('arenoso')
    const erro = (d: number) => Math.abs(resistenciaAparenteFv(m, d, POS_62) - m.rg) / m.rg
    expect(erro(PERTO)).toBeGreaterThan(erro(LONGE))
  })

  it('a curva sobe a partir de E e dispara junto de C', () => {
    const m = malhaDe('arenoso')
    expect(resistenciaAparenteFv(m, LONGE, 0.05)).toBeLessThan(resistenciaAparenteFv(m, LONGE, POS_62))
    expect(resistenciaAparenteFv(m, LONGE, 1)).toBeGreaterThan(2 * resistenciaAparenteFv(m, LONGE, POS_62))
  })

  it('só há patamar com a estaca C distante', () => {
    const m = malhaDe('arenoso')
    const longe = avaliarQuedaPotencial(m, LONGE, registrarPatamar(m, LONGE))!
    const perto = avaliarQuedaPotencial(m, PERTO, registrarPatamar(m, PERTO))!
    expect(longe.patamarOk).toBe(true)
    expect(longe.variacaoPct).toBeLessThanOrEqual(LIMITE_PATAMAR_PCT)
    expect(longe.valida).toBe(true)
    expect(perto.patamarOk).toBe(false)
    expect(perto.valida).toBe(false)
    expect(perto.veredito).toMatch(/Inconclusivo/)
  })

  it('exige as três posições do patamar antes de calcular', () => {
    const m = malhaDe('umido')
    const doisPontos = registrarPatamar(m, LONGE).slice(0, 2)
    expect(patamarRegistrado(doisPontos)).toBe(false)
    expect(avaliarQuedaPotencial(m, LONGE, doisPontos)).toBeNull()
    expect(patamarRegistrado(registrarPatamar(m, LONGE))).toBe(true)
  })

  it('distância sem curva calculada é erro, não leitura inventada', () => {
    expect(() => resistenciaAparenteFv(malhaDe('umido'), 123, 0.5)).toThrow()
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
    const l = medirToquePasso(PONTOS_TOQUE_PASSO_FV[0], malhaDe('arenoso'))
    expect(l.vFalta).toBeGreaterThan(l.vTeste)
  })

  it('anel de equalização interrompido no portão aumenta o toque ali', () => {
    const f = (c: Cen) => RESULTADOS_FV[c].fracoes['t-portao']
    expect(f('com-defeitos')).toBeGreaterThan(1.5 * f('conforme'))
  })

  it('solo arenoso íntegro passa; com o anel interrompido, o portão reprova', () => {
    const m = malhaDe('arenoso')
    for (const p of PONTOS_TOQUE_PASSO_FV) expect(medirToquePasso(p, m).aprovado).toBe(true)
    expect(medirToquePasso(getPontoToquePassoFv('t-portao')!, malhaDe('arenoso', 'com-defeitos')).aprovado).toBe(false)
  })

  it('solo rochoso: fora da cerca, sem brita, o toque no portão reprova mesmo íntegro', () => {
    expect(medirToquePasso(getPontoToquePassoFv('t-portao')!, malhaDe('rochoso')).aprovado).toBe(false)
  })
})

describe('usina FV — laudo', () => {
  const completo = (perfil: PerfilSoloFv, cenario: Cen, d = LONGE) => {
    const m = malhaDe(perfil, cenario)
    return emitirLaudoFv({
      pontosContinuidade: PONTOS_CONTINUIDADE_FV,
      continuidade: Object.fromEntries(PONTOS_CONTINUIDADE_FV.map((p) => [p.id, medirContinuidadeFv(p, cenario, true)])),
      malha: avaliarQuedaPotencial(m, d, registrarPatamar(m, d)),
      pontosToquePasso: PONTOS_TOQUE_PASSO_FV,
      toquePasso: Object.fromEntries(PONTOS_TOQUE_PASSO_FV.map((p) => [p.id, medirToquePasso(p, m)])),
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
    const l = completo('umido', 'conforme', PERTO)
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

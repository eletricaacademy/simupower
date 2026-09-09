import { describe, it, expect } from 'vitest'
import {
  RESISTIVIDADE,
  R_PONTAS,
  LIMITE_CONFORME,
  LIMITE_ATENCAO,
  resistenciaTeorica,
  avaliarContinuidade,
  formatarLeitura,
  medirContinuidade,
  emitirLaudo,
  type LeituraContinuidade,
} from './spda'
import { SPDA_PONTOS, type PontoSPDA } from '../catalog/spdaPontos'

const ponto = (over: Partial<PontoSPDA> = {}): PontoSPDA => ({
  id: 'teste',
  nome: 'Trecho de teste',
  subsistema: 'descida',
  norma: 'NBR 5419-3',
  de: 'A',
  ate: 'B',
  comprimentoM: 10,
  material: 'cobre-nu',
  secaoMm2: 35,
  conexoes: 4,
  dica: '',
  pos: [0, 0, 0],
  posOrigem: [0, 0, 0],
  ...over,
})

describe('resistenciaTeorica', () => {
  it('aplica ρ·L/S', () => {
    const r = resistenciaTeorica(10, 'cobre-nu', 35)
    expect(r).toBeCloseTo((RESISTIVIDADE['cobre-nu'] * 10) / 35, 9)
  })

  it('aço galvanizado tem resistência muito maior que cobre na mesma seção', () => {
    expect(resistenciaTeorica(10, 'aco-galvanizado', 50)).toBeGreaterThan(
      resistenciaTeorica(10, 'cobre-nu', 50) * 5,
    )
  })

  it('seção inválida não explode', () => {
    expect(resistenciaTeorica(10, 'cobre-nu', 0)).toBe(0)
  })
})

describe('avaliarContinuidade', () => {
  it('aprova abaixo do limite conforme', () => {
    const v = avaliarContinuidade(LIMITE_CONFORME - 0.1)
    expect(v.cor).toBe('pass')
    expect(v.aprovado).toBe(true)
  })

  it('marca atenção na faixa intermediária (não aprova)', () => {
    const v = avaliarContinuidade((LIMITE_CONFORME + LIMITE_ATENCAO) / 2)
    expect(v.cor).toBe('marginal')
    expect(v.aprovado).toBe(false)
  })

  it('reprova acima do limite de atenção', () => {
    expect(avaliarContinuidade(LIMITE_ATENCAO + 0.01).cor).toBe('fail')
  })

  it('circuito aberto reprova', () => {
    const v = avaliarContinuidade(Infinity)
    expect(v.aprovado).toBe(false)
    expect(v.veredito).toMatch(/aberto/i)
  })
})

describe('formatarLeitura', () => {
  it('mostra OL no circuito aberto', () => {
    expect(formatarLeitura(Infinity)).toBe('OL')
  })
  it('usa 3 casas abaixo de 1 Ω e 2 acima', () => {
    expect(formatarLeitura(0.006)).toBe('0.006')
    expect(formatarLeitura(2.5)).toBe('2.50')
  })
})

describe('medirContinuidade', () => {
  it('trecho íntegro com pontas zeradas fica em miliohms e aprova', () => {
    const l = medirContinuidade(ponto(), 'conforme', true)
    expect(l.r).toBeLessThan(0.05)
    expect(l.aprovado).toBe(true)
  })

  it('não zerar as pontas soma a resistência dos cabos', () => {
    const zerado = medirContinuidade(ponto(), 'conforme', true)
    const cru = medirContinuidade(ponto(), 'conforme', false)
    expect(cru.r - zerado.r).toBeCloseTo(R_PONTAS, 6)
  })

  it('cenário conforme ignora o defeito plantado', () => {
    const p = ponto({ defeito: 'corrosao' })
    expect(medirContinuidade(p, 'conforme', true).aprovado).toBe(true)
  })

  it('emenda frouxa cai na faixa de atenção', () => {
    const l = medirContinuidade(ponto({ defeito: 'emenda-frouxa' }), 'com-defeitos', true)
    expect(l.r).toBeGreaterThan(LIMITE_CONFORME)
    expect(l.r).toBeLessThanOrEqual(LIMITE_ATENCAO)
    expect(l.cor).toBe('marginal')
  })

  it('corrosão reprova', () => {
    const l = medirContinuidade(ponto({ defeito: 'corrosao' }), 'com-defeitos', true)
    expect(l.cor).toBe('fail')
  })

  it('condutor rompido lê OL', () => {
    const l = medirContinuidade(ponto({ defeito: 'rompido' }), 'com-defeitos', true)
    expect(l.display).toBe('OL')
    expect(Number.isFinite(l.r)).toBe(false)
  })

  it('é determinística (mesma entrada → mesma leitura)', () => {
    const a = medirContinuidade(ponto(), 'conforme', true)
    const b = medirContinuidade(ponto(), 'conforme', true)
    expect(a.r).toBe(b.r)
  })
})

function medirTodos(cenario: 'conforme' | 'com-defeitos'): Record<string, LeituraContinuidade> {
  return Object.fromEntries(
    SPDA_PONTOS.map((p) => [p.id, medirContinuidade(p, cenario, true)]),
  )
}

describe('emitirLaudo', () => {
  it('aprova o SPDA quando todos os trechos estão íntegros', () => {
    const laudo = emitirLaudo(SPDA_PONTOS, medirTodos('conforme'))
    expect(laudo.conforme).toBe(true)
    expect(laudo.aprovados).toBe(SPDA_PONTOS.length)
    expect(laudo.naoConformidades).toHaveLength(0)
  })

  it('reprova e lista as não conformidades no cenário com defeitos', () => {
    const laudo = emitirLaudo(SPDA_PONTOS, medirTodos('com-defeitos'))
    expect(laudo.conforme).toBe(false)
    expect(laudo.naoConformidades.length).toBeGreaterThan(0)
    laudo.naoConformidades.forEach((nc) => {
      expect(nc.acao).not.toBe('')
      expect(nc.causaProvavel).not.toBe('')
    })
  })

  it('inspeção incompleta nunca sai conforme', () => {
    const todas = medirTodos('conforme')
    delete todas[SPDA_PONTOS[0].id]
    const laudo = emitirLaudo(SPDA_PONTOS, todas)
    expect(laudo.conforme).toBe(false)
    expect(laudo.medidos).toBe(SPDA_PONTOS.length - 1)
    expect(laudo.parecer).toMatch(/INCOMPLETA/)
  })
})

describe('catálogo SPDA_PONTOS', () => {
  it('cobre vizinhas, cruzadas nos dois níveis e BEP interno, sem reutilizar leituras', () => {
    expect(SPDA_PONTOS).toHaveLength(13)
    for (const par of ['D1–D2', 'D2–D3', 'D3–D4', 'D4–D1', 'D1–D3', 'D2–D4']) {
      const [superior, inferior] = SPDA_PONTOS.filter(p => p.par === par)
      expect(superior.nivel).toBe('superior')
      expect(inferior.nivel).toBe('inferior')
      expect(superior.pos[1]).toBeGreaterThan(inferior.pos[1])
      expect(superior.posOrigem[1]).toBeGreaterThan(inferior.posOrigem[1])
    }
    const bep = SPDA_PONTOS.find(p => p.id === 'eq-bep')!
    expect(Math.abs(bep.pos[0])).toBeLessThan(6)
    expect(Math.abs(bep.pos[2])).toBeLessThan(4)
  })

  it('calcula o anel pelos dois ramos em paralelo, além das descidas em série', () => {
    const ponto = { ...SPDA_PONTOS[0], comprimentoM: 10, conexoes: 0,
      ramos: [{ comprimentoM: 20, conexoes: 0 }, { comprimentoM: 20, conexoes: 0 }] }
    const leitura = medirContinuidade(ponto, 'conforme', true)
    expect(leitura.rTeorica).toBeCloseTo(resistenciaTeorica(20, ponto.material, ponto.secaoMm2), 10)
    const simples = medirContinuidade({ ...ponto, comprimentoM: 20, ramos: undefined }, 'conforme', true)
    expect(leitura.r).toBeCloseTo(simples.r, 10)
  })
  it('não tem ids duplicados', () => {
    const ids = SPDA_PONTOS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('respeita as seções mínimas da NBR 5419-3 (Cu ≥ 35 mm²)', () => {
    SPDA_PONTOS.filter((p) => p.material === 'cobre-nu').forEach((p) => {
      expect(p.secaoMm2).toBeGreaterThanOrEqual(35)
    })
  })
})

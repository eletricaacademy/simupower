import { describe, it, expect } from 'vitest'
import {
  rIso,
  corrigir40,
  calcularDAR,
  calcularPI,
  avaliar,
  corDoVeredito,
  executarEnsaio,
  PERFIS,
} from './insulation'

describe('rIso — modelo de absorção dielétrica', () => {
  it('R(0) = Rinf·(1 - A - B) para cada perfil', () => {
    for (const perfil of ['bom', 'atencao', 'ruim'] as const) {
      const p = PERFIS[perfil]
      const esperado = p.rinf[500] * (1 - p.A - p.B)
      expect(rIso(perfil, 500, 0)).toBeCloseTo(esperado, 6)
    }
  })

  it('tende a Rinf quando t → ∞', () => {
    expect(rIso('bom', 500, 100000)).toBeCloseTo(PERFIS.bom.rinf[500], 3)
  })

  it('é monotonicamente crescente no tempo (absorção)', () => {
    let prev = -1
    for (let t = 0; t <= 600; t += 15) {
      const r = rIso('bom', 1000, t)
      expect(r).toBeGreaterThanOrEqual(prev)
      prev = r
    }
  })

  it('isolamento melhor (bom) > pior (ruim) na mesma tensão e tempo', () => {
    expect(rIso('bom', 500, 60)).toBeGreaterThan(rIso('ruim', 500, 60))
  })

  it('nunca retorna negativo', () => {
    expect(rIso('ruim', 2500, 0)).toBeGreaterThanOrEqual(0)
  })
})

describe('corrigir40 — IEEE 43', () => {
  it('não altera em 40 °C', () => {
    expect(corrigir40(100, 40)).toBeCloseTo(100, 6)
  })

  it('dobra a cada +10 °C', () => {
    expect(corrigir40(100, 50)).toBeCloseTo(200, 6)
    expect(corrigir40(100, 30)).toBeCloseTo(50, 6)
  })
})

describe('DAR e PI', () => {
  it('DAR = R60/R30', () => {
    expect(calcularDAR(100, 150)).toBeCloseTo(1.5, 6)
  })
  it('PI = R600/R60', () => {
    expect(calcularPI(100, 400)).toBeCloseTo(4, 6)
  })
  it('protege contra divisão por zero', () => {
    expect(calcularDAR(0, 150)).toBe(0)
    expect(calcularPI(0, 400)).toBe(0)
  })
})

describe('avaliar — limites de veredito', () => {
  it('Reprovado quando R40 < 5 MΩ', () => {
    expect(avaliar(2, 3, 4.9)).toBe('Reprovado')
  })
  it('Reprovado quando PI < 1.0', () => {
    expect(avaliar(2, 0.9, 5000)).toBe('Reprovado')
  })
  it('Questionável por PI < 2.0', () => {
    expect(avaliar(2, 1.5, 5000)).toBe('Questionável')
  })
  it('Questionável por DAR < 1.25', () => {
    expect(avaliar(1.1, 3, 5000)).toBe('Questionável')
  })
  it('Questionável por R40 < 100 MΩ', () => {
    expect(avaliar(2, 3, 90)).toBe('Questionável')
  })
  it('Aprovado quando 2.0 ≤ PI < 4.0 e demais OK', () => {
    expect(avaliar(1.5, 3, 5000)).toBe('Aprovado')
  })
  it('Excelente quando PI ≥ 4.0 e demais OK', () => {
    expect(avaliar(1.6, 5, 5000)).toBe('Excelente')
  })
})

describe('corDoVeredito', () => {
  it('mapeia veredito → cor de status', () => {
    expect(corDoVeredito('Excelente')).toBe('pass')
    expect(corDoVeredito('Aprovado')).toBe('pass')
    expect(corDoVeredito('Questionável')).toBe('marginal')
    expect(corDoVeredito('Reprovado')).toBe('fail')
  })
})

describe('executarEnsaio — as 3 condições a 500 V / 40 °C', () => {
  it('bom → Aprovado ou Excelente (pass)', () => {
    const r = executarEnsaio('bom', 500, 40)
    expect(r.cor).toBe('pass')
    expect(r.r40).toBeGreaterThan(100)
    expect(r.dar).toBeGreaterThan(1.25)
  })

  it('atenção → Questionável (marginal)', () => {
    const r = executarEnsaio('atencao', 500, 40)
    expect(r.veredito).toBe('Questionável')
    expect(r.cor).toBe('marginal')
  })

  it('ruim/úmido → Reprovado (fail)', () => {
    const r = executarEnsaio('ruim', 500, 40)
    expect(r.veredito).toBe('Reprovado')
    expect(r.cor).toBe('fail')
    expect(r.r40).toBeLessThan(5)
  })

  it('a correção de temperatura desloca o veredito (40 vs 25 °C no perfil atenção)', () => {
    const quente = executarEnsaio('atencao', 500, 55)
    const frio = executarEnsaio('atencao', 500, 40)
    expect(quente.r40).toBeGreaterThan(frio.r40)
  })
})

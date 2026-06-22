import { describe, it, expect } from 'vitest'
import { resistenciaAparente, avaliar, executarEnsaio, RTERRA, POS_62 } from './aterramento'

describe('aterramento — queda de potencial', () => {
  it('no platô (62%) a leitura ≈ resistência verdadeira', () => {
    for (const p of ['bom', 'atencao', 'ruim'] as const) {
      const r = resistenciaAparente(p, POS_62)
      expect(Math.abs(r - RTERRA[p]) / RTERRA[p]).toBeLessThan(0.06)
    }
  })

  it('curva sobe de perto de E ao platô', () => {
    expect(resistenciaAparente('bom', 0.05)).toBeLessThan(resistenciaAparente('bom', POS_62))
  })

  it('dispara perto da estaca de corrente (C)', () => {
    expect(resistenciaAparente('bom', 0.98)).toBeGreaterThan(resistenciaAparente('bom', POS_62))
  })

  it('veredito segue limites (≤10 ok, ≤25 atenção, >25 ruim)', () => {
    expect(avaliar(5).cor).toBe('pass')
    expect(avaliar(18).cor).toBe('marginal')
    expect(avaliar(40).cor).toBe('fail')
  })

  it('executarEnsaio retorna curva de 21 pontos e veredito coerente', () => {
    const res = executarEnsaio('bom')
    expect(res.curva).toHaveLength(21)
    expect(res.cor).toBe('pass')
    expect(res.r62).toBeGreaterThan(0)
  })
})

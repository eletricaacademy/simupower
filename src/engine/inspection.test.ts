import { describe, it, expect } from 'vitest'
import { avaliarInspecao } from './inspection'

describe('avaliarInspecao', () => {
  it('em andamento enquanto há pendentes', () => {
    const r = avaliarInspecao(['conforme', 'pendente', 'conforme'])
    expect(r.veredito).toBe('Em andamento')
    expect(r.cor).toBe('marginal')
  })
  it('aprovado quando tudo conforme', () => {
    const r = avaliarInspecao(['conforme', 'conforme', 'conforme'])
    expect(r.veredito).toBe('Aprovado')
    expect(r.percentual).toBe(100)
  })
  it('aprovado com pendências quando ≤25% não conforme', () => {
    const r = avaliarInspecao(['conforme', 'conforme', 'conforme', 'nao-conforme'])
    expect(r.veredito).toBe('Aprovado com pendências')
    expect(r.cor).toBe('marginal')
  })
  it('reprovado quando >25% não conforme', () => {
    const r = avaliarInspecao(['nao-conforme', 'nao-conforme', 'conforme', 'conforme'])
    expect(r.veredito).toBe('Reprovado')
    expect(r.cor).toBe('fail')
  })
  it('conta conformes/não conformes/pendentes', () => {
    const r = avaliarInspecao(['conforme', 'nao-conforme', 'pendente'])
    expect(r.conformes).toBe(1)
    expect(r.naoConformes).toBe(1)
    expect(r.pendentes).toBe(1)
    expect(r.total).toBe(3)
  })
})

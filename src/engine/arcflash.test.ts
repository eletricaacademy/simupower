import { describe, it, expect } from 'vitest'
import {
  correnteArco,
  energiaNormalizada,
  energiaIncidente,
  fronteiraArco,
  categoriaEPI,
  calcularArco,
  CLASSES,
} from './arcflash'

describe('correnteArco — IEEE 1584', () => {
  it('BT (0,48 kV) em caixa: Ia menor que o curto presumido', () => {
    const ia = correnteArco(0.48, 20, 32, 'caixa')
    expect(ia).toBeGreaterThan(8)
    expect(ia).toBeLessThan(20)
  })
  it('MT (≥1 kV) usa a equação simplificada (Ia ≈ Ibf)', () => {
    const ia = correnteArco(13.8, 20, 153, 'caixa')
    expect(ia).toBeGreaterThan(17)
    expect(ia).toBeLessThan(21)
  })
})

describe('energia incidente e categoria', () => {
  it('cresce com o tempo de arco', () => {
    const en = energiaNormalizada(12, 32, 'caixa', 'aterrado')
    const e1 = energiaIncidente(en, 0.48, 0.1, 455, 1.473)
    const e2 = energiaIncidente(en, 0.48, 0.2, 455, 1.473)
    expect(e2).toBeGreaterThan(e1)
    expect(e2 / e1).toBeCloseTo(2, 1)
  })
  it('cai com o aumento da distância de trabalho', () => {
    const en = energiaNormalizada(12, 32, 'caixa', 'aterrado')
    const perto = energiaIncidente(en, 0.48, 0.2, 300, 1.473)
    const longe = energiaIncidente(en, 0.48, 0.2, 600, 1.473)
    expect(longe).toBeLessThan(perto)
  })
})

describe('categoriaEPI — limites NFPA 70E', () => {
  it('< 1,2 → risco mínimo (nível 0)', () => {
    expect(categoriaEPI(0.8).nivel).toBe(0)
  })
  it('1,2–4 → Cat 1', () => expect(categoriaEPI(3).nivel).toBe(1))
  it('4–8 → Cat 2', () => expect(categoriaEPI(6).nivel).toBe(2))
  it('8–25 → Cat 3', () => expect(categoriaEPI(20).nivel).toBe(3))
  it('25–40 → Cat 4', () => expect(categoriaEPI(35).nivel).toBe(4))
  it('> 40 → perigo extremo (nível 5)', () => expect(categoriaEPI(60).nivel).toBe(5))
})

describe('fronteiraArco', () => {
  it('é a distância onde E = 1,2 cal/cm²', () => {
    const en = energiaNormalizada(12, 32, 'caixa', 'aterrado')
    const afb = fronteiraArco(en, 0.48, 0.2, 1.473)
    const E = energiaIncidente(en, 0.48, 0.2, afb, 1.473)
    expect(E).toBeCloseTo(1.2, 1)
  })
})

describe('calcularArco — casos coerentes', () => {
  it('painel MT 13,8 kV / 20 kA / 0,2 s → energia alta (Cat 3+)', () => {
    const c = CLASSES['painel-mt']
    const r = calcularArco({
      voc: 13.8,
      ibf: 20,
      t: 0.2,
      gap: c.gap,
      distancia: c.distancia,
      x: c.x,
      config: c.config,
      aterramento: 'aterrado',
    })
    expect(r.energia).toBeGreaterThan(8)
    expect(r.categoria.nivel).toBeGreaterThanOrEqual(3)
    expect(r.cor).toBe('fail')
    expect(r.afb).toBeGreaterThan(r.energia) // AFB em mm, valor grande
  })

  it('proteção rápida (0,05 s) reduz a categoria', () => {
    const c = CLASSES['painel-mt']
    const base = { voc: 13.8, ibf: 20, gap: c.gap, distancia: c.distancia, x: c.x, config: c.config, aterramento: 'aterrado' as const }
    const lento = calcularArco({ ...base, t: 0.2 })
    const rapido = calcularArco({ ...base, t: 0.05 })
    expect(rapido.energia).toBeLessThan(lento.energia)
  })
})

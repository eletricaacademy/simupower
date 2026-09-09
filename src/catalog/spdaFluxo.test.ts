import { expect, it } from 'vitest'
import { SPDA_PONTOS } from './spdaPontos'
import { percursosCorrenteSPDA } from './spdaFluxo'

it('liga as garras pelos dois ramos completos do anel, no nível selecionado', () => {
  for (const ponto of SPDA_PONTOS.filter(p => p.nivel !== 'bep')) {
    const [entrada, ida, volta, retorno] = percursosCorrenteSPDA(ponto)
    expect(entrada[0]).toEqual(ponto.posOrigem)
    expect(retorno.at(-1)).toEqual(ponto.pos)
    expect(ida[0]).toEqual(entrada.at(-1))
    expect(volta[0]).toEqual(ida[0])
    expect(ida.at(-1)).toEqual(retorno[0])
    expect(volta.at(-1)).toEqual(retorno[0])
    const comprimentos = [ida, volta].map(ramo => ramo.slice(1).reduce((s, p, i) => s + Math.hypot(...p.map((v, k) => v - ramo[i][k])), 0))
    expect(comprimentos.sort((a,b) => a-b)).toEqual(ponto.ramos!.map(r => r.comprimentoM).sort((a,b) => a-b))
    expect([...ida, ...volta].every(p => p[1] === (ponto.nivel === 'superior' ? 9.35 : -0.35))).toBe(true)
  }
})

it('percorre a ligação de D1 ao BEP interno sem passar pelo QGBT', () => {
  const ponto = SPDA_PONTOS.find(p => p.id === 'eq-bep')!
  const [percurso] = percursosCorrenteSPDA(ponto)
  expect(percurso[0]).toEqual(ponto.posOrigem)
  expect(percurso.at(-1)).toEqual(ponto.pos)
  expect(percurso.every(p => p[0] < -4)).toBe(true)
})

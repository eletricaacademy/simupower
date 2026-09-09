import { describe, it, expect } from 'vitest'
import { avaliarEstrutural, resolverEstrutura } from './estrutural'
import { PARES_ESTRUTURAIS, PILARES, redeEstrutural } from '../catalog/estruturalPontos'

describe('rede estrutural e limites 2026', () => {
  it('resolve série e paralelo conservando a corrente', () => {
    const r = resolverEstrutura([{id:'entrada',a:'a',b:'b',r:1},{id:'x',a:'b',b:'c',r:2},{id:'y',a:'b',b:'c',r:2}], 'a','c',1)
    expect(r.r).toBeCloseTo(2)
    expect(r.correntes.entrada).toBeCloseTo(1)
    expect(r.correntes.x).toBeCloseTo(0.5)
    expect(r.correntes.y).toBeCloseTo(0.5)
  })
  it('não cria caminhos através de componentes desconectados', () => {
    expect(resolverEstrutura([{id:'x',a:'a',b:'b',r:1}], 'a','c',1).r).toBe(Infinity)
  })
  it('mantém resistência com inversão das pontas e respeita corrente de 1 a 5 A', () => {
    const rede=[{id:'x',a:'a',b:'b',r:0.5}]
    expect(resolverEstrutura(rede,'b','a',5)).toEqual({r:0.5,correntes:{x:-5}})
    expect(() => resolverEstrutura(rede,'a','b',0.2)).toThrow()
    expect(() => resolverEstrutura(rede,'a','b',6)).toThrow()
  })
  it('inclui os limites exatos de F.1 e F.4 sem faixa intermediária inventada', () => {
    expect(avaliarEstrutural(1,'primeira').aprovado).toBe(true)
    expect(avaliarEstrutural(1.00001,'primeira').aprovado).toBe(false)
    expect(avaliarEstrutural(0.2,'comprobatoria').aprovado).toBe(true)
    expect(avaliarEstrutural(0.20001,'comprobatoria').aprovado).toBe(false)
    expect(avaliarEstrutural(Infinity,'primeira').aprovado).toBe(false)
    expect(avaliarEstrutural(NaN,'primeira').aprovado).toBe(false)
    expect(avaliarEstrutural(-1,'primeira').aprovado).toBe(false)
  })
  it('cobre todos os topos com cruzadas e quatro bases equidistantes, incluindo o BEP', () => {
    const cruzadas=PARES_ESTRUTURAIS.filter(p => p.tipo === 'primeira')
    expect(new Set(cruzadas.map(p => p.a)).size).toBe(PILARES.length)
    expect(cruzadas.every(p => p.a !== p.b)).toBe(true)
    expect(new Set(cruzadas.map(p => p.b))).toEqual(new Set(['P1','P4','P5','P8']))
    const bases=['P1','P5','P8','P4'].map(id => PILARES.find(p => p.id===id)!)
    bases.forEach((p,i) => { const q=bases[(i+1)%4]; expect(Math.abs(q.x-p.x)+Math.abs(q.z-p.z)).toBe(20) })
    expect(redeEstrutural('pronto','primeira','integro').find(r => r.id==='ligacao-bep')?.a).toBe('P4-base')
  })
  it('conserva corrente em todos os nós da rede do galpão', () => {
    const rede=redeEstrutural('pronto','primeira','integro')
    const sol=resolverEstrutura(rede,'P1-topo','P5-base',1)
    const saldo:Record<string,number>={}
    for(const r of rede){saldo[r.a]=(saldo[r.a]??0)+sol.correntes[r.id];saldo[r.b]=(saldo[r.b]??0)-sol.correntes[r.id]}
    for(const [no,i] of Object.entries(saldo)) expect(i).toBeCloseTo(no==='P1-topo'?1:no==='P5-base'?-1:0,8)
  })
  it('falha de BEP reprova a comprobatória sem alterar as primeiras verificações', () => {
    for(const p of PARES_ESTRUTURAIS){
      const sol=resolverEstrutura(redeEstrutural('pronto',p.tipo,'bep'),p.tipo==='comprobatoria'?'P1-cap':`${p.a}-topo`,p.b==='BEP'?'BEP':`${p.b}-base`,1)
      expect(avaliarEstrutural(sol.r,p.tipo).aprovado).toBe(p.tipo==='primeira')
    }
  })
  it('contato superior deteriorado reprova a primeira leitura de P1', () => {
    const r=resolverEstrutura(redeEstrutural('pronto','primeira','pilar'),'P1-topo','P5-base',1).r
    expect(r).toBeGreaterThan(1)
  })
})

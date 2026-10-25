/**
 * Testes da engine dos ensaios da NBR 5410 §7. Foco: todo resultado sai com
 * `codigo` estável (a UI traduz por ele) e o código acompanha o veredito.
 */
import { describe, it, expect } from 'vitest'
import { ENSAIOS_VERIFICACAO, FLUKE_FUNCOES } from '../catalog/verificacaoTestes'
import { RECURSOS } from '../i18n/recursos'
import { medirEnsaio } from './verificacao'

describe('verificação NBR 5410 §7 — códigos de veredito', () => {
  it('cada ensaio devolve código distinto para conforme e com defeito', () => {
    const vistos = new Set<string>()
    for (const e of ENSAIOS_VERIFICACAO) {
      const ok = medirEnsaio(e, 'ok')
      const falha = medirEnsaio(e, 'falha')
      expect(ok.aprovado, e.id).toBe(true)
      expect(falha.aprovado, e.id).toBe(false)
      expect(ok.codigo).not.toBe(falha.codigo)
      for (const c of [ok.codigo, falha.codigo]) {
        expect(c).not.toBe('indefinido')
        expect(vistos.has(c), `código repetido: ${c}`).toBe(false)
        vistos.add(c)
      }
    }
  })

  it('o texto extra tem código e a PEFC leva o número como dado', () => {
    for (const e of ENSAIOS_VERIFICACAO) {
      for (const cond of ['ok', 'falha'] as const) {
        const r = medirEnsaio(e, cond)
        if (r.extra) expect(r.extraCodigo, `${e.id}/${cond}`).toBeTruthy()
      }
    }
    const zs = medirEnsaio(ENSAIOS_VERIFICACAO.find((e) => e.id === 'loop-zs')!, 'ok')
    expect(zs.extraCodigo).toBe('pefc')
    expect(zs.extra).toBe(`PEFC ${zs.dados!.ipf} A`)
  })

  it('o português do namespace `verificacao` é idêntico ao da engine e dos dados', () => {
    const pt = RECURSOS.pt.verificacao as {
      veredito: Record<string, string>
      extra: Record<string, string>
      funcoes: Record<string, string>
      ensaios: Record<string, Record<string, string>>
    }
    for (const e of ENSAIOS_VERIFICACAO) {
      for (const campo of ['nome', 'norma', 'descricao', 'parametro', 'criterio'] as const)
        expect(pt.ensaios[e.id]?.[campo], `${e.id}.${campo}`).toBe(e[campo])
      for (const cond of ['ok', 'falha'] as const) {
        const r = medirEnsaio(e, cond)
        expect(pt.veredito[r.codigo], r.codigo).toBe(r.veredito)
        if (r.extraCodigo) {
          const txt = pt.extra[r.extraCodigo].replace(/\{\{(\w+)\}\}/g, (_, k) => String(r.dados?.[k]))
          expect(txt, r.extraCodigo).toBe(r.extra)
        }
      }
    }
    for (const f of FLUKE_FUNCOES) expect(pt.funcoes[f.id], f.id).toBe(f.nome)
  })

  it('mantém as frases em português e os valores de antes', () => {
    const dr = medirEnsaio(ENSAIOS_VERIFICACAO.find((e) => e.id === 'rcd-tempo')!, 'falha')
    expect(dr.codigo).toBe('dr-nao-disparou')
    expect(dr.veredito).toBe('DR não disparou no tempo — substituir.')
    const iso = medirEnsaio(ENSAIOS_VERIFICACAO.find((e) => e.id === 'isolamento')!, 'ok')
    expect(iso.valor).toBe(52.4)
    expect(iso.display).toBe('52.4')
  })
})

/**
 * Guardas da tradução. Tradução quebrada não dá erro: o i18next imprime a chave
 * crua ou cai no português sem avisar (foi assim que o memorial do GroundPRO
 * chegou a sair com chave crua). Estes testes pegam o furo antes da tela.
 */
import { describe, it, expect } from 'vitest'
import { RECURSOS, NAMESPACES } from './recursos'
import { ENSAIOS, EQUIPAMENTOS } from '../catalog'
import { CATALOGOS, localizarEnsaio, localizarEquipamento } from '../catalog/i18n/localizar'
import { normalizarIdioma } from './idiomas'
import { fmtNum } from './numero'
import { useSim } from '../sim/store'

type Arvore = { [k: string]: string | Arvore }

/** Achata {a:{b:'x'}} em {'a.b':'x'}. */
function folhas(o: Arvore, pre = ''): Record<string, string> {
  const r: Record<string, string> = {}
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') r[pre + k] = v
    else Object.assign(r, folhas(v, `${pre}${k}.`))
  }
  return r
}

/** Variáveis {{x}} e tags <b>/<m>/<a> — têm que bater entre idiomas. */
function marcas(s: string): string[] {
  return [...(s.match(/\{\{\s*\w+[^}]*\}\}|<\/?\w+>/g) ?? [])].map((m) => m.replace(/\s/g, '')).sort()
}


describe('interface: mesmas chaves e mesmas marcas nos três idiomas', () => {
  for (const ns of NAMESPACES) {
    const pt = folhas(RECURSOS.pt[ns] as Arvore)
    for (const lng of ['es', 'en'] as const) {
      it(`${ns} · ${lng}`, () => {
        expect(RECURSOS[lng][ns], `${lng}/${ns}.json não existe`).toBeTruthy()
        const outro = folhas(RECURSOS[lng][ns] as Arvore)
        expect(Object.keys(outro).sort()).toEqual(Object.keys(pt).sort())
        for (const [k, v] of Object.entries(pt)) {
          expect(outro[k].trim(), `${lng}:${ns}.${k} vazio`).not.toBe('')
          expect(marcas(outro[k]), `${lng}:${ns}.${k}`).toEqual(marcas(v))
        }
      })
    }
  }
})

describe('catálogo traduzido aponta para ids que existem', () => {
  for (const [lng, cat] of Object.entries(CATALOGOS)) {
    it(`${lng}: ensaios, passos e listas`, () => {
      for (const [id, tr] of Object.entries(cat.ensaios)) {
        const base = ENSAIOS[id]
        expect(base, `${lng}: ensaio "${id}" não existe`).toBeTruthy()
        for (const [stepId, ps] of Object.entries(tr.steps ?? {})) {
          const st = base.steps.find((s) => s.id === stepId)
          expect(st, `${lng}: passo "${id}/${stepId}" não existe`).toBeTruthy()
          // lista traduzida com outro tamanho = item esquecido ou inventado
          for (const campo of ['detalhes', 'cuidados', 'erros'] as const) {
            if (ps[campo]) expect(ps[campo]!.length, `${lng}: ${stepId}.${campo}`).toBe(st![campo]?.length)
          }
        }
      }
    })
    it(`${lng}: equipamentos`, () => {
      for (const id of Object.keys(cat.equipamentos)) {
        expect(EQUIPAMENTOS[id], `${lng}: equipamento "${id}" não existe`).toBeTruthy()
      }
    })
  }

  it('todo ensaio e todo equipamento tem pelo menos o nome em es e en', () => {
    for (const cat of Object.values(CATALOGOS)) {
      for (const id of Object.keys(ENSAIOS)) expect(cat.ensaios[id]?.nome, id).toBeTruthy()
      for (const id of Object.keys(EQUIPAMENTOS)) expect(cat.equipamentos[id]?.nome, id).toBeTruthy()
    }
  })

  it('traduzir não mexe em ids, vistas nem travas', () => {
    for (const base of Object.values(ENSAIOS)) {
      const es = localizarEnsaio(base, 'es')
      expect(es.id).toBe(base.id)
      expect(es.steps.map((s) => [s.id, s.requer, s.vista, s.control, s.acaoTipo])).toEqual(
        base.steps.map((s) => [s.id, s.requer, s.vista, s.control, s.acaoTipo]),
      )
    }
    for (const base of Object.values(EQUIPAMENTOS)) {
      const en = localizarEquipamento(base, 'en')
      expect(en.anchors.map((a) => [a.id, a.pos, a.papel])).toEqual(base.anchors.map((a) => [a.id, a.pos, a.papel]))
    }
  })

  it('português devolve o próprio catálogo', () => {
    const base = ENSAIOS['resistencia-aterramento']
    expect(localizarEnsaio(base, 'pt')).toBe(base)
  })
})

describe('idioma e números', () => {
  it('normaliza etiquetas do navegador', () => {
    expect(normalizarIdioma('es-AR')).toBe('es')
    expect(normalizarIdioma('en-US')).toBe('en')
    expect(normalizarIdioma('fr')).toBe('pt')
    expect(normalizarIdioma(undefined)).toBe('pt')
  })

  it('vírgula em pt/es, ponto em en, casas fixas', () => {
    expect(fmtNum(5.4, 1, { idioma: 'pt' })).toBe('5,4')
    expect(fmtNum(5.4, 1, { idioma: 'es' })).toBe('5,4')
    expect(fmtNum(5.4, 1, { idioma: 'en' })).toBe('5.4')
    expect(fmtNum(0.6, 2, { idioma: 'es' })).toBe('0,60')
    expect(fmtNum(1500, 0, { idioma: 'pt', milhar: true })).toBe('1.500')
    expect(fmtNum(1500, 0, { idioma: 'pt' })).toBe('1500')
  })
})

describe('trocar o idioma no meio do ensaio', () => {
  it('re-traduz o par ativo sem perder o andamento', () => {
    const s = useSim.getState()
    s.setIdioma('pt')
    s.carregarPar('aterramento-subestacao', 'resistencia-aterramento')
    s.marcarPasso('at-seguranca')
    s.irParaPasso(2)
    useSim.getState().setIdioma('es')
    const st = useSim.getState()
    expect(st.ensaio.steps[0].titulo).toBe('Seguridad y preparación')
    expect(st.equipamento.nome).toBe('Malla de puesta a tierra')
    expect(st.passoIndex).toBe(2)
    expect(st.cumpridos['at-seguranca']).toBe(true)
    st.setIdioma('pt')
    expect(useSim.getState().ensaio.steps[0].titulo).toBe('Segurança e preparação')
  })
})

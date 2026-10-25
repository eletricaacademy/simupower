/**
 * localizar.ts — Tradução do catálogo como DADO, por id.
 *
 * O catálogo em português continua sendo a fonte (é ele que tem as vistas, as
 * travas `requer` e os ids que a engine e o store usam). Cada idioma é uma
 * camada por cima, chaveada pelos ids de ensaio, passo e equipamento: o que a
 * camada não traz cai no português, como o fallback do i18next. Assim um texto
 * novo no catálogo nunca quebra a tela em espanhol — só aparece em português até
 * ser traduzido, e o teste de cobertura aponta o que falta.
 */
import type { Equipment, Step, TestProcedure } from '../types'
import type { Idioma } from '../../i18n/idiomas'
import { CATALOGO_ES } from './es'
import { CATALOGO_EN } from './en'

/** Campos de texto de um passo; listas substituem a lista inteira. */
export type TraducaoPasso = Partial<
  Pick<Step, 'titulo' | 'descricao' | 'detalhes' | 'cuidados' | 'erros' | 'feito' | 'acao' | 'norma'>
>

export interface TraducaoEnsaio {
  nome?: string
  norma?: string
  steps?: Record<string, TraducaoPasso>
}

export interface TraducaoEquipamento {
  nome?: string
  /** Rótulo das âncoras, por id. */
  anchors?: Record<string, string>
}

export interface TraducaoCatalogo {
  ensaios: Record<string, TraducaoEnsaio>
  equipamentos: Record<string, TraducaoEquipamento>
}

export const CATALOGOS: Record<Exclude<Idioma, 'pt'>, TraducaoCatalogo> = {
  es: CATALOGO_ES,
  en: CATALOGO_EN,
}

export function localizarEnsaio(ensaio: TestProcedure, idioma: Idioma): TestProcedure {
  if (idioma === 'pt') return ensaio
  const tr = CATALOGOS[idioma].ensaios[ensaio.id]
  if (!tr) return ensaio
  return {
    ...ensaio,
    nome: tr.nome ?? ensaio.nome,
    norma: tr.norma ?? ensaio.norma,
    steps: ensaio.steps.map((s) => ({ ...s, ...tr.steps?.[s.id] })),
  }
}

export function localizarEquipamento(eq: Equipment, idioma: Idioma): Equipment {
  if (idioma === 'pt') return eq
  const tr = CATALOGOS[idioma].equipamentos[eq.id]
  if (!tr) return eq
  return {
    ...eq,
    nome: tr.nome ?? eq.nome,
    anchors: eq.anchors.map((a) => ({ ...a, label: tr.anchors?.[a.id] ?? a.label })),
  }
}

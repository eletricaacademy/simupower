/**
 * idiomas.ts — Idiomas do SimuPower, sem dependência de React nem do i18next.
 *
 * Fica separado da configuração para que o store, o catálogo e os testes
 * possam conhecer o idioma sem carregar o i18next nem tocar no navegador.
 * A ordem é a prioridade do Pablo: português (original), espanhol, inglês.
 */

export const IDIOMAS = ['pt', 'es', 'en'] as const
export type Idioma = (typeof IDIOMAS)[number]

export interface MetaIdioma {
  /** Sigla curta exibida no botão do canto. */
  sigla: string
  /** Nome no PRÓPRIO idioma: quem caiu no idioma errado ainda reconhece o seu. */
  nome: string
  /** Etiqueta BCP 47 do `<html lang>` (leitores de tela, hifenização). */
  lang: string
  /**
   * Locale do Intl para números. Público do espanhol = América do Sul
   * (confirmado pelo Pablo em 24/10/2026): `es`, vírgula decimal. Não usar
   * `es-419` aqui — no Intl ele formata com PONTO, como o México.
   */
  locale: string
}

export const IDIOMA_META: Record<Idioma, MetaIdioma> = {
  pt: { sigla: 'PT', nome: 'Português', lang: 'pt-BR', locale: 'pt-BR' },
  es: { sigla: 'ES', nome: 'Español', lang: 'es-419', locale: 'es' },
  en: { sigla: 'EN', nome: 'English', lang: 'en', locale: 'en-US' },
}

export const IDIOMA_PADRAO: Idioma = 'pt'

/** Chave do localStorage com a escolha do usuário (mesmo papel do `gp_language` do GroundPRO). */
export const LS_IDIOMA = 'sp_idioma'

export function ehIdioma(x: unknown): x is Idioma {
  return typeof x === 'string' && (IDIOMAS as readonly string[]).includes(x)
}

/** 'es-AR' → 'es', 'pt-BR' → 'pt'; desconhecido → português. */
export function normalizarIdioma(x: string | null | undefined): Idioma {
  const base = (x ?? '').toLowerCase().split(/[-_]/)[0]
  return ehIdioma(base) ? base : IDIOMA_PADRAO
}

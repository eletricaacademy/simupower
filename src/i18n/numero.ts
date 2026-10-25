/**
 * numero.ts — Números no formato do idioma ativo (vírgula em PT/ES, ponto em EN).
 *
 * Substitui o `toFixed(n).replace('.', ',')` espalhado pela UI. Leituras de
 * instrumento não levam separador de milhar (o display real não mostra).
 */
import { useSim } from '../sim/store'
import { IDIOMA_META, type Idioma } from './idiomas'

const cache = new Map<string, Intl.NumberFormat>()

function formatador(idioma: Idioma, casas: number, milhar: boolean): Intl.NumberFormat {
  const k = `${idioma}|${casas}|${milhar}`
  let f = cache.get(k)
  if (!f) {
    f = new Intl.NumberFormat(IDIOMA_META[idioma].locale, {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
      useGrouping: milhar,
    })
    cache.set(k, f)
  }
  return f
}

/** `fmtNum(5.4, 1)` → "5,4" (pt/es) ou "5.4" (en). */
export function fmtNum(
  v: number,
  casas: number,
  { milhar = false, idioma = useSim.getState().idioma }: { milhar?: boolean; idioma?: Idioma } = {},
): string {
  return formatador(idioma, casas, milhar).format(v)
}

/** Data curta no formato do idioma ativo. */
export function fmtData(d: Date | string | number, idioma: Idioma = useSim.getState().idioma): string {
  return new Date(d).toLocaleDateString(IDIOMA_META[idioma].locale)
}

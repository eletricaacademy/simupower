/**
 * format.ts — Formatação de leituras de instrumento (mono), no separador
 * decimal do idioma ativo. Toda exibição numérica passa por aqui para manter
 * a "assinatura mono".
 */
import { fmtNum } from '../i18n/numero'

/** Formata MΩ com faixa adaptativa (G/M) e casas adequadas. */
export function formatarLeitura(mohm: number): string {
  if (!isFinite(mohm)) return '∞'
  if (mohm >= 1000) return fmtNum(mohm / 1000, 2) + ' G'
  if (mohm >= 100) return fmtNum(mohm, 0)
  if (mohm >= 10) return fmtNum(mohm, 1)
  return fmtNum(mohm, 2)
}

/** Razão (DAR/PI) com 2 casas. */
export function formatarRazao(v: number): string {
  if (!isFinite(v)) return '—'
  return fmtNum(v, 2)
}

/** Tempo em mm:ss. */
export function formatarTempo(s: number): string {
  const m = Math.floor(s / 60)
  const seg = Math.floor(s % 60)
  return `${m}:${seg.toString().padStart(2, '0')}`
}

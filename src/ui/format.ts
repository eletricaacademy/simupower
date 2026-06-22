/**
 * format.ts — Formatação de leituras de instrumento (PT-BR, mono).
 * Toda exibição numérica passa por aqui para manter a "assinatura mono".
 */

/** Formata MΩ com faixa adaptativa (G/M) e casas adequadas. */
export function formatarLeitura(mohm: number): string {
  if (!isFinite(mohm)) return '∞'
  if (mohm >= 1000) return (mohm / 1000).toFixed(2).replace('.', ',') + ' G'
  if (mohm >= 100) return mohm.toFixed(0)
  if (mohm >= 10) return mohm.toFixed(1).replace('.', ',')
  return mohm.toFixed(2).replace('.', ',')
}

/** Razão (DAR/PI) com 2 casas. */
export function formatarRazao(v: number): string {
  if (!isFinite(v)) return '—'
  return v.toFixed(2).replace('.', ',')
}

/** Tempo em mm:ss. */
export function formatarTempo(s: number): string {
  const m = Math.floor(s / 60)
  const seg = Math.floor(s % 60)
  return `${m}:${seg.toString().padStart(2, '0')}`
}

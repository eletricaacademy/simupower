/**
 * aterramento.ts — Ensaio de RESISTÊNCIA DE ATERRAMENTO pelo método da
 * QUEDA DE POTENCIAL (fall-of-potential / método dos 62%).
 *
 * Injeta-se corrente entre o eletrodo sob ensaio (E) e a estaca de corrente (C)
 * a uma distância D. Mede-se a tensão movendo a estaca de potencial (P) entre E
 * e C. A curva R(x) sobe perto de E, forma um PLATÔ no meio e dispara perto de
 * C. O valor verdadeiro é lido com P a ~61,8% da distância E–C.
 *
 * Função pura, sem dependências — testável isoladamente.
 */
export type PerfilSolo = 'bom' | 'atencao' | 'ruim'

/** Resistência verdadeira do aterramento por perfil de solo (Ω). */
export const RTERRA: Record<PerfilSolo, number> = {
  bom: 4.6,
  atencao: 17.5,
  ruim: 41,
}

/** Posição ótima da estaca de potencial (fração da distância E–C). */
export const POS_62 = 0.618

/**
 * Resistência aparente medida com a estaca de potencial na fração x ∈ [0,1]
 * (0 = no eletrodo E, 1 = na estaca de corrente C).
 */
export function resistenciaAparente(perfil: PerfilSolo, x: number): number {
  const R = RTERRA[perfil]
  const xc = Math.max(0, Math.min(1, x))
  const subida = 0.55 + 0.45 * Math.tanh((xc - 0.18) / 0.12) // sobe de ~0,1·R ao platô ~R
  const spikeC = 1.25 * Math.pow(Math.max(0, (xc - 0.8) / 0.2), 2) // dispara perto de C
  return R * (subida + spikeC)
}

export interface VerdaTerra {
  veredito: string
  cor: 'pass' | 'marginal' | 'fail'
}

/** Veredito: ≤ 10 Ω = recomendação usual da concessionária (medição NBR 15749). */
export function avaliar(r: number): VerdaTerra {
  if (r <= 10) return { veredito: 'Adequado', cor: 'pass' }
  if (r <= 25) return { veredito: 'Atenção', cor: 'marginal' }
  return { veredito: 'Inadequado', cor: 'fail' }
}

export interface PontoCurva {
  x: number
  r: number
}

export interface ResultadoTerra {
  perfil: PerfilSolo
  r62: number
  curva: PontoCurva[]
  veredito: string
  cor: 'pass' | 'marginal' | 'fail'
}

/** Executa o ensaio: leitura a 62%, curva completa e veredito. */
export function executarEnsaio(perfil: PerfilSolo): ResultadoTerra {
  const r62 = resistenciaAparente(perfil, POS_62)
  const curva: PontoCurva[] = []
  for (let i = 0; i <= 20; i++) {
    const x = i / 20
    curva.push({ x, r: resistenciaAparente(perfil, x) })
  }
  const { veredito, cor } = avaliar(r62)
  return { perfil, r62, curva, veredito, cor }
}

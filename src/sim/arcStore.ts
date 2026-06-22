/**
 * arcStore.ts — Estado do estudo de ARCO ELÉTRICO (parâmetros + resultado).
 * Separado de useSim para não misturar com o fluxo do megômetro. Usa a engine
 * pura engine/arcflash; nenhuma regra de cálculo aqui.
 */
import { create } from 'zustand'
import { calcularArco, CLASSES, type ArcResult, type ConfigEletrodo, type Aterramento } from '../engine/arcflash'

interface ArcState {
  /** tensão (kV) */
  voc: number
  /** corrente de curto presumida (kA) */
  ibf: number
  /** tempo de eliminação (s) */
  t: number
  classeId: string
  distancia: number
  gap: number
  config: ConfigEletrodo
  aterramento: Aterramento
  resultado: ArcResult | null

  setVoc: (v: number) => void
  setIbf: (v: number) => void
  setT: (v: number) => void
  setClasse: (id: string) => void
  setDistancia: (v: number) => void
  setGap: (v: number) => void
  setConfig: (c: ConfigEletrodo) => void
  setAterramento: (a: Aterramento) => void
  calcular: () => void
  reset: () => void
}

const CLASSE_INI = CLASSES['painel-mt']

const inicial = {
  voc: 13.8,
  ibf: 20,
  t: 0.2,
  classeId: CLASSE_INI.id,
  distancia: CLASSE_INI.distancia,
  gap: CLASSE_INI.gap,
  config: CLASSE_INI.config,
  aterramento: 'aterrado' as Aterramento,
  resultado: null as ArcResult | null,
}

export const useArc = create<ArcState>((set, get) => ({
  ...inicial,

  setVoc: (v) => set({ voc: v, resultado: null }),
  setIbf: (v) => set({ ibf: v, resultado: null }),
  setT: (v) => set({ t: v, resultado: null }),
  setClasse: (id) => {
    const c = CLASSES[id]
    if (!c) return
    set({ classeId: id, distancia: c.distancia, gap: c.gap, config: c.config, resultado: null })
  },
  setDistancia: (v) => set({ distancia: v, resultado: null }),
  setGap: (v) => set({ gap: v, resultado: null }),
  setConfig: (c) => set({ config: c, resultado: null }),
  setAterramento: (a) => set({ aterramento: a, resultado: null }),

  calcular: () => {
    const s = get()
    const c = CLASSES[s.classeId]
    const resultado = calcularArco({
      voc: s.voc,
      ibf: s.ibf,
      t: s.t,
      gap: s.gap,
      distancia: s.distancia,
      x: c?.x ?? 1.473,
      config: s.config,
      aterramento: s.aterramento,
    })
    set({ resultado })
  },

  reset: () => set({ ...inicial }),
}))

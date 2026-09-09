import { create } from 'zustand'
import { PARES_ESTRUTURAIS, type FaseEstrutural } from '../catalog/estruturalPontos'

const inicial = { fase: 'obra' as FaseEstrutural, revelar: true, par: PARES_ESTRUTURAIS[0].id, garras: false }
export const useEstrutural = create<typeof inicial & {
  setFase: (fase: FaseEstrutural) => void
  setRevelar: (revelar: boolean) => void
  setPar: (par: string) => void
  conectar: () => void
  reset: () => void
}>(set => ({
  ...inicial,
  setFase: fase => set({ fase, revelar: fase === 'obra', garras: false }),
  setRevelar: revelar => set({ revelar }),
  setPar: par => { if (PARES_ESTRUTURAIS.some(p => p.id === par)) set({ par, garras: false }) },
  conectar: () => set({ garras: true }),
  reset: () => set({ ...inicial }),
}))

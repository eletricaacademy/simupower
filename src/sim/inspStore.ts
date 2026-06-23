/**
 * inspStore.ts — Estado da INSPEÇÃO: status (conforme / não conforme) de cada
 * item, por id de passo. Separado do useSim. A avaliação usa engine/inspection.
 */
import { create } from 'zustand'
import type { StatusItem } from '../engine/inspection'

interface InspState {
  status: Record<string, StatusItem>
  /** mostrar a grade/alambrado de proteção (começa oculta p/ ver os equipamentos) */
  mostrarGrade: boolean
  /** mostrar as paredes da subestação (pode ocultar p/ visualizar melhor) */
  mostrarParedes: boolean
  /** mostrar o pórtico/estrutura metálica (aterramento — pode ocultar) */
  mostrarPortico: boolean
  setStatus: (id: string, s: StatusItem) => void
  setMostrarGrade: (on: boolean) => void
  setMostrarParedes: (on: boolean) => void
  setMostrarPortico: (on: boolean) => void
  reset: () => void
}

export const useInsp = create<InspState>((set) => ({
  status: {},
  mostrarGrade: false,
  mostrarParedes: true,
  mostrarPortico: true,
  setStatus: (id, s) => set((st) => ({ status: { ...st.status, [id]: s } })),
  setMostrarGrade: (on) => set({ mostrarGrade: on }),
  setMostrarParedes: (on) => set({ mostrarParedes: on }),
  setMostrarPortico: (on) => set({ mostrarPortico: on }),
  reset: () => set({ status: {}, mostrarGrade: false, mostrarParedes: true, mostrarPortico: true }),
}))

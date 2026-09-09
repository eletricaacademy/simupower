import { create } from 'zustand'

interface SpdaDiagnosticoState {
  ativo: string | null
  setAtivo: (id: string | null) => void
}

export const useSpdaDiagnostico = create<SpdaDiagnosticoState>((set) => ({
  ativo: null,
  setAtivo: (ativo) => set({ ativo }),
}))

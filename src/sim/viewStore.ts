/**
 * viewStore.ts — Comandos de vista de câmera (compartilhado por todas as
 * simulações). A UI (DOM) pede uma vista; um componente dentro do Canvas
 * executa movendo a câmera. O `nonce` garante re-disparo do mesmo comando.
 */
import { create } from 'zustand'

export type Vista = 'reset' | 'topo' | 'frontal' | 'lateral'

interface ViewState {
  comando: Vista | null
  nonce: number
  pedir: (v: Vista) => void
  limpar: () => void
}

export const useView = create<ViewState>((set, get) => ({
  comando: null,
  nonce: 0,
  pedir: (v) => set({ comando: v, nonce: get().nonce + 1 }),
  limpar: () => set({ comando: null }),
}))

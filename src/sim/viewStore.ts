/**
 * viewStore.ts — Comandos de vista de câmera (compartilhado por todas as
 * simulações). A UI (DOM) pede uma vista; um componente dentro do Canvas
 * executa movendo a câmera. O `nonce` garante re-disparo do mesmo comando.
 */
import { create } from 'zustand'

export type Vista = 'reset' | 'topo' | 'frontal' | 'lateral' | 'quadro' | 'foco' | 'origem' | 'fluxo'
export interface PoseVista {
  pos: [number, number, number]
  target: [number, number, number]
}

interface ViewState {
  comando: Vista | null
  pose: PoseVista | null
  nonce: number
  pedir: (v: Vista) => void
  pedirPose: (pose: PoseVista) => void
  limpar: () => void
}

export const useView = create<ViewState>((set, get) => ({
  comando: null,
  pose: null,
  nonce: 0,
  pedir: (v) => set({ comando: v, pose: null, nonce: get().nonce + 1 }),
  pedirPose: (pose) => set({ comando: null, pose, nonce: get().nonce + 1 }),
  limpar: () => set({ comando: null, pose: null }),
}))

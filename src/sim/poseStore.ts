/**
 * poseStore.ts — Vistas de câmera capturadas (autoria). Permite definir com
 * precisão a abertura da simulação e cada parada do tour: o usuário posiciona a
 * câmera e captura; a vista (posição + alvo) é persistida em localStorage e
 * usada pelo CameraRig. Chave: `${equipamentoId}:${stepId|inicial}`.
 */
import { create } from 'zustand'

export interface Pose {
  pos: [number, number, number]
  target: [number, number, number]
}

const KEY = 'calibra:poses'

function carregar(): Record<string, Pose> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

interface PoseState {
  poses: Record<string, Pose>
  /** pedido de captura pendente (resolvido pelo PoseCapturer dentro do Canvas) */
  capturar: { key: string; nonce: number } | null
  salvar: (key: string, p: Pose) => void
  pedirCaptura: (key: string) => void
  apagar: (key: string) => void
}

export const usePose = create<PoseState>((set, get) => ({
  poses: carregar(),
  capturar: null,
  salvar: (key, p) => {
    const poses = { ...get().poses, [key]: p }
    try {
      localStorage.setItem(KEY, JSON.stringify(poses))
    } catch {
      /* ignore */
    }
    set({ poses, capturar: null })
  },
  pedirCaptura: (key) => set({ capturar: { key, nonce: (get().capturar?.nonce ?? 0) + 1 } }),
  apagar: (key) => {
    const poses = { ...get().poses }
    delete poses[key]
    try {
      localStorage.setItem(KEY, JSON.stringify(poses))
    } catch {
      /* ignore */
    }
    set({ poses })
  },
}))

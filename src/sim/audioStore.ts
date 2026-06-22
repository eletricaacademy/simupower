/**
 * audioStore.ts — controle global de som (volume mestre + mudo).
 * Reflete na engine de áudio (ui/sons.ts) via setMaster.
 */
import { create } from 'zustand'
import { setMaster } from '../ui/sons'

interface AudioState {
  volume: number
  mudo: boolean
  setVolume: (v: number) => void
  toggleMudo: () => void
  setMudo: (b: boolean) => void
}

export const useAudio = create<AudioState>((set, get) => ({
  volume: 0.7,
  mudo: false,
  setVolume: (v) => {
    const volume = Math.max(0, Math.min(1, v))
    const mudo = volume === 0 ? true : false
    set({ volume, mudo })
    setMaster(volume, mudo)
  },
  toggleMudo: () => {
    const mudo = !get().mudo
    set({ mudo })
    setMaster(get().volume, mudo)
  },
  setMudo: (b) => {
    if (get().mudo === b) return
    set({ mudo: b })
    setMaster(get().volume, b)
  },
}))

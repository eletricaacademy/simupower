/**
 * orientStore.ts — preferência de orientação da simulação.
 *
 * Padrão: 'horizontal'. No celular em retrato, o LandscapeFrame rotaciona a
 * cena 90° para dar largura ao palco 3D. O usuário pode alternar p/ 'vertical'.
 */
import { create } from 'zustand'

export type Orientacao = 'horizontal' | 'vertical'

const KEY = 'simupower:orientacao'

function carregar(): Orientacao {
  try {
    return localStorage.getItem(KEY) === 'vertical' ? 'vertical' : 'horizontal'
  } catch {
    return 'horizontal'
  }
}

interface OrientState {
  orientacao: Orientacao
  alternar: () => void
}

export const useOrientacao = create<OrientState>((set, get) => ({
  orientacao: carregar(),
  alternar: () => {
    const nova: Orientacao = get().orientacao === 'horizontal' ? 'vertical' : 'horizontal'
    try {
      localStorage.setItem(KEY, nova)
    } catch {
      /* ignore */
    }
    set({ orientacao: nova })
  },
}))

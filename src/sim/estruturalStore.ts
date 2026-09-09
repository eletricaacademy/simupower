import { create } from 'zustand'
import { PARES_ESTRUTURAIS, redeEstrutural, type DefeitoEstrutural, type FaseEstrutural } from '../catalog/estruturalPontos'
import { avaliarEstrutural, resolverEstrutura, type SolucaoEstrutural } from '../engine/estrutural'

export interface LeituraEstrutural extends SolucaoEstrutural { aprovado: boolean; limite: number; norma: string; data: string }
const inicial = { fase: 'obra' as FaseEstrutural, revelar: true, par: PARES_ESTRUTURAIS[0].id, garras: false,
  preparado: false, fluxo: false, defeito: 'integro' as DefeitoEstrutural, leituras: {} as Record<string, LeituraEstrutural>, laudo: false }
export const useEstrutural = create<typeof inicial & {
  setFase: (fase: FaseEstrutural) => void
  setRevelar: (revelar: boolean) => void
  setPar: (par: string) => void
  conectar: () => void
  preparar: () => void
  medir: () => void
  setFluxo: (fluxo: boolean) => void
  setDefeito: (defeito: DefeitoEstrutural) => void
  emitir: () => void
  fecharLaudo: () => void
  reset: () => void
}>((set, get) => ({
  ...inicial,
  setFase: fase => set({ fase, revelar: fase === 'obra', garras: false, fluxo: false, leituras: {}, laudo: false }),
  setRevelar: revelar => set({ revelar }),
  setPar: par => { if (PARES_ESTRUTURAIS.some(p => p.id === par)) set({ par, garras: false, fluxo: false }) },
  conectar: () => set({ garras: true }),
  preparar: () => set({ preparado: true }),
  medir: () => {
    const s = get(), p = PARES_ESTRUTURAIS.find(p => p.id === s.par)!
    if (!s.preparado || !s.garras) return
    const rede = redeEstrutural(s.fase, p.tipo, s.defeito)
    const leitura = resolverEstrutura(rede, p.tipo === 'comprobatoria' ? 'P1-cap' : `${p.a}-topo`, p.b === 'BEP' ? 'BEP' : `${p.b}-base`, 1)
    set({ leituras: { ...s.leituras, [p.id]: { ...leitura, ...avaliarEstrutural(leitura.r, p.tipo), data: new Date().toISOString() } }, fluxo: Number.isFinite(leitura.r), laudo: false })
  },
  setFluxo: fluxo => set({ fluxo: fluxo && get().garras && !!get().leituras[get().par] }),
  setDefeito: defeito => set({ defeito, leituras: {}, fluxo: false, laudo: false }),
  emitir: () => { if (PARES_ESTRUTURAIS.every(p => get().leituras[p.id])) set({ laudo: true, fluxo: false }) },
  fecharLaudo: () => set({ laudo: false }),
  reset: () => set({ ...inicial }),
}))

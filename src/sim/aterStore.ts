/**
 * aterStore.ts — estado do ensaio de resistência de aterramento (queda de
 * potencial): perfil do solo, posição da estaca de potencial, pontos medidos e
 * resultado.
 */
import { create } from 'zustand'
import {
  resistenciaAparente,
  executarEnsaio,
  POS_62,
  type PerfilSolo,
  type PontoCurva,
  type ResultadoTerra,
} from '../engine/aterramento'

interface AterState {
  perfil: PerfilSolo
  posP: number // fração da distância E–C (0..1)
  distanciaM: number // distância E–C em metros (só visual)
  medicoes: PontoCurva[]
  resultado: ResultadoTerra | null
  setPerfil: (p: PerfilSolo) => void
  setPosP: (x: number) => void
  setDistancia: (m: number) => void
  registrar: () => void
  calcular: () => void
  reset: () => void
}

const inicial = {
  perfil: 'atencao' as PerfilSolo,
  posP: POS_62,
  distanciaM: 40,
  medicoes: [] as PontoCurva[],
  resultado: null as ResultadoTerra | null,
}

export const useAter = create<AterState>((set, get) => ({
  ...inicial,
  setPerfil: (perfil) => set({ perfil, medicoes: [], resultado: null }),
  setPosP: (x) => set({ posP: Math.max(0, Math.min(1, x)) }),
  setDistancia: (m) => set({ distanciaM: m }),
  registrar: () => {
    const { perfil, posP, medicoes } = get()
    const r = resistenciaAparente(perfil, posP)
    // substitui ponto na mesma posição (arredondada) p/ não duplicar
    const semDup = medicoes.filter((p) => Math.abs(p.x - posP) > 0.02)
    set({ medicoes: [...semDup, { x: posP, r }].sort((a, b) => a.x - b.x) })
  },
  calcular: () => set({ resultado: executarEnsaio(get().perfil) }),
  reset: () => set({ ...inicial }),
}))

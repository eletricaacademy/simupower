/**
 * usinaFvStore.ts — estado do ensaio de ATERRAMENTO EM USINA FOTOVOLTAICA:
 * condições do cenário (solo, defeitos), continuidade ponto a ponto, curva da
 * queda de potencial, toque/passo e laudo.
 *
 * A cena 3D lê daqui o ponto ativo de cada ensaio, as leituras (para colorir
 * os marcadores), a posição das estacas e se a malha enterrada está visível —
 * é a única interface que o Codex precisa ler.
 */
import { create } from 'zustand'
import {
  montarMalha,
  medirContinuidadeFv,
  resistenciaAparenteFv,
  avaliarQuedaPotencial,
  medirToquePasso,
  emitirLaudoFv,
  POS_62,
  RESISTIVIDADE_SOLO,
  TOLERANCIA_POSICAO,
  type CenarioFv,
  type PerfilSoloFv,
  type MalhaFv,
  type LeituraContinuidadeFv,
  type LeituraToquePasso,
  type PontoCurvaFv,
  type ResultadoMalhaFv,
  type LaudoFv,
} from '../engine/usinaFv'
import {
  AREA_MALHA_M2,
  PROFUNDIDADE_MALHA,
  comprimentoEnterradoM,
  DISTANCIAS_C_M,
  PONTOS_CONTINUIDADE_FV,
  PONTOS_TOQUE_PASSO_FV,
  getPontoContinuidadeFv,
  getPontoToquePassoFv,
} from '../catalog/usinaFvPontos'

/** Malha da usina para o solo escolhido (resistência verdadeira por Sverak). */
export function malhaDoSolo(solo: PerfilSoloFv): MalhaFv {
  return montarMalha(RESISTIVIDADE_SOLO[solo], AREA_MALHA_M2, comprimentoEnterradoM(), PROFUNDIDADE_MALHA)
}

interface UsinaFvState {
  solo: PerfilSoloFv
  cenario: CenarioFv
  /** Malha enterrada visível através do solo (cena). */
  mostrarMalha: boolean

  // continuidade
  pontasZeradas: boolean
  pontoCont: string
  continuidade: Record<string, LeituraContinuidadeFv>

  // queda de potencial
  distanciaC: number
  estacasCravadas: boolean
  posP: number
  curva: PontoCurvaFv[]
  malha: ResultadoMalhaFv | null

  // toque e passo
  pontoTP: string
  toquePasso: Record<string, LeituraToquePasso>

  laudo: LaudoFv | null

  setSolo: (s: PerfilSoloFv) => void
  setCenario: (c: CenarioFv) => void
  setMostrarMalha: (v: boolean) => void
  zerarPontas: () => void
  setPontoCont: (id: string) => void
  medirContinuidade: () => void
  limparContinuidade: (id: string) => void
  setDistanciaC: (m: number) => void
  cravarEstacas: () => void
  setPosP: (x: number) => void
  registrarP: () => void
  limparCurva: () => void
  calcularMalha: () => void
  setPontoTP: (id: string) => void
  medirTP: () => void
  emitir: () => void
  reset: () => void
}

const inicial = {
  solo: 'arenoso' as PerfilSoloFv,
  cenario: 'com-defeitos' as CenarioFv,
  mostrarMalha: false,
  pontasZeradas: false,
  pontoCont: PONTOS_CONTINUIDADE_FV[0].id,
  continuidade: {} as Record<string, LeituraContinuidadeFv>,
  // começa perto de propósito: o aluno descobre que a malha grande pede estaca longe
  distanciaC: DISTANCIAS_C_M[1],
  estacasCravadas: false,
  posP: POS_62,
  curva: [] as PontoCurvaFv[],
  malha: null as ResultadoMalhaFv | null,
  pontoTP: PONTOS_TOQUE_PASSO_FV[0].id,
  toquePasso: {} as Record<string, LeituraToquePasso>,
  laudo: null as LaudoFv | null,
}

export const useUsinaFv = create<UsinaFvState>((set, get) => ({
  ...inicial,

  // o solo muda a malha: invalida a curva e o toque/passo (a continuidade não depende dele)
  setSolo: (solo) => set({ solo, curva: [], malha: null, toquePasso: {}, laudo: null }),
  // trocar o cenário invalida tudo que já foi medido
  setCenario: (cenario) => set({ cenario, continuidade: {}, curva: [], malha: null, toquePasso: {}, laudo: null }),
  setMostrarMalha: (mostrarMalha) => set({ mostrarMalha }),

  zerarPontas: () => set({ pontasZeradas: true }),
  setPontoCont: (id) => {
    if (getPontoContinuidadeFv(id)) set({ pontoCont: id })
  },
  medirContinuidade: () => {
    const { pontoCont, cenario, pontasZeradas, continuidade } = get()
    const ponto = getPontoContinuidadeFv(pontoCont)
    if (!ponto || !pontasZeradas) return
    set({ continuidade: { ...continuidade, [ponto.id]: medirContinuidadeFv(ponto, cenario, pontasZeradas) }, laudo: null })
  },
  limparContinuidade: (id) => {
    const continuidade = { ...get().continuidade }
    delete continuidade[id]
    set({ continuidade, laudo: null })
  },

  // mover a estaca C obriga a recravar e levantar a curva de novo
  setDistanciaC: (distanciaC) => set({ distanciaC, estacasCravadas: false, curva: [], malha: null, laudo: null }),
  cravarEstacas: () => set({ estacasCravadas: true }),
  setPosP: (x) => set({ posP: Math.max(0, Math.min(1, x)) }),
  registrarP: () => {
    const { estacasCravadas, solo, distanciaC, posP, curva } = get()
    if (!estacasCravadas) return
    const r = resistenciaAparenteFv(malhaDoSolo(solo), distanciaC, posP)
    // substitui o ponto na mesma posição para não duplicar
    const semDup = curva.filter((p) => Math.abs(p.x - posP) > TOLERANCIA_POSICAO / 2)
    set({ curva: [...semDup, { x: posP, r }].sort((a, b) => a.x - b.x), malha: null, laudo: null })
  },
  limparCurva: () => set({ curva: [], malha: null, laudo: null }),
  calcularMalha: () => {
    const { solo, distanciaC, curva } = get()
    set({ malha: avaliarQuedaPotencial(malhaDoSolo(solo), distanciaC, curva), laudo: null })
  },

  setPontoTP: (id) => {
    if (getPontoToquePassoFv(id)) set({ pontoTP: id })
  },
  medirTP: () => {
    const { pontoTP, solo, cenario, toquePasso } = get()
    const ponto = getPontoToquePassoFv(pontoTP)
    if (!ponto) return
    set({ toquePasso: { ...toquePasso, [ponto.id]: medirToquePasso(ponto, malhaDoSolo(solo), cenario) }, laudo: null })
  },

  emitir: () => {
    const s = get()
    set({
      laudo: emitirLaudoFv({
        pontosContinuidade: PONTOS_CONTINUIDADE_FV,
        continuidade: s.continuidade,
        malha: s.malha,
        pontosToquePasso: PONTOS_TOQUE_PASSO_FV,
        toquePasso: s.toquePasso,
      }),
    })
  },

  reset: () => set({ ...inicial }),
}))

/** Todos os pontos de continuidade medidos? (trava da etapa) */
export function continuidadeCompleta(c: Record<string, LeituraContinuidadeFv>): boolean {
  return PONTOS_CONTINUIDADE_FV.every((p) => !!c[p.id])
}

/** Todos os pontos de toque/passo medidos? (trava da etapa) */
export function toquePassoCompleto(t: Record<string, LeituraToquePasso>): boolean {
  return PONTOS_TOQUE_PASSO_FV.every((p) => !!t[p.id])
}

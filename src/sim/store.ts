/**
 * store.ts — Estado da simulação (zustand).
 *
 * Mantém o par ativo (equipamento × ensaio), progresso dos passos, conexões,
 * o estado energizado e as amostras ao vivo para o readout/osciloscópio.
 * Nenhuma regra de cálculo aqui: a engine é consultada via registry.
 */
import { create } from 'zustand'
import { getEngine } from '../engine/registry'
import type { Perfil, TensaoEnsaio, ResultadoEnsaio } from '../engine/insulation'
import { getEquipamento, getEnsaio, PAR_PADRAO } from '../catalog'
import type { Equipment, TestProcedure } from '../catalog/types'
import { carregarPref, salvarPref, type QualidadePref } from '../scene/quality'

export interface Amostra {
  t: number
  r: number
}

export type FaseTeste = 'idle' | 'rodando' | 'concluido'

interface SimState {
  // par ativo
  equipamento: Equipment
  ensaio: TestProcedure

  // progresso
  passoIndex: number
  cumpridos: Record<string, boolean>

  // parâmetros do ensaio
  tensao: TensaoEnsaio

  // conexões físicas
  earthConectado: boolean
  lineConectado: boolean

  // energização / leitura ao vivo
  fase: FaseTeste
  energizado: boolean
  tempo: number
  amostras: Amostra[]
  leituraAtual: number
  resultado: ResultadoEnsaio | null

  // modo instrutor
  modoInstrutor: boolean
  perfil: Perfil
  tempC: number
  velocidade: number

  // navegação
  view: 'menu' | 'sim'
  /** visita guiada ativa (câmera é conduzida pelos passos) */
  tourAtivo: boolean
  /** modo "identificar/calibrar ponto" (clique reporta coord no frame da âncora) */
  pickMode: boolean
  /** última coord identificada (texto pronto p/ colar) */
  peca: string
  /** id do passo aguardando confirmação "Preparado? Sim/Não" (manobras) */
  confirmando: string | null

  // cena
  interagiu: boolean
  reducedMotion: boolean
  qualidadePref: QualidadePref

  // ações
  carregarPar: (equipamentoId: string, ensaioId: string) => void
  cumprirPasso: (id: string) => void
  /** marca o passo como cumprido SEM avançar (navegação manual via Próximo) */
  marcarPasso: (id: string) => void
  irParaPasso: (index: number) => void
  proximoPasso: () => void
  setTensao: (v: TensaoEnsaio) => void
  conectar: (papel: 'earth' | 'line') => void
  iniciarTeste: () => void
  tickTeste: (deltaS: number) => void
  cancelarTeste: () => void
  setPerfil: (p: Perfil) => void
  setTempC: (t: number) => void
  setVelocidade: (v: number) => void
  setModoInstrutor: (on: boolean) => void
  marcarInteragiu: () => void
  setReducedMotion: (on: boolean) => void
  setQualidadePref: (p: QualidadePref) => void
  setView: (v: 'menu' | 'sim') => void
  setTour: (on: boolean) => void
  setPickMode: (on: boolean) => void
  setPeca: (s: string) => void
  setConfirmando: (id: string | null) => void
  reset: () => void
}

const equipamentoInicial = getEquipamento(PAR_PADRAO.equipamentoId)
const ensaioInicial = getEnsaio(PAR_PADRAO.ensaioId)

const SAMPLE_EVERY_S = 0.2

export const useSim = create<SimState>((set, get) => ({
  equipamento: equipamentoInicial,
  ensaio: ensaioInicial,

  passoIndex: 0,
  cumpridos: {},

  tensao: ensaioInicial.tensaoPadrao as TensaoEnsaio,

  earthConectado: false,
  lineConectado: false,

  fase: 'idle',
  energizado: false,
  tempo: 0,
  amostras: [],
  leituraAtual: 0,
  resultado: null,

  modoInstrutor: false,
  perfil: 'bom',
  tempC: 25,
  velocidade: 1,

  view: 'menu',
  tourAtivo: false,
  pickMode: false,
  peca: '',
  confirmando: null,

  interagiu: false,
  reducedMotion: false,
  qualidadePref: carregarPref(),

  carregarPar: (equipamentoId, ensaioId) => {
    const equipamento = getEquipamento(equipamentoId)
    const ensaio = getEnsaio(ensaioId)
    set({
      equipamento,
      ensaio,
      passoIndex: 0,
      cumpridos: {},
      tensao: ensaio.tensaoPadrao as TensaoEnsaio,
      earthConectado: false,
      lineConectado: false,
      fase: 'idle',
      energizado: false,
      tempo: 0,
      amostras: [],
      leituraAtual: 0,
      resultado: null,
      tourAtivo: false,
      interagiu: false,
      pickMode: false,
      peca: '',
      confirmando: null,
    })
  },

  cumprirPasso: (id) => {
    set((s) => ({ cumpridos: { ...s.cumpridos, [id]: true } }))
    // avança para o próximo passo não cumprido, se houver
    const { ensaio, cumpridos } = get()
    const idx = ensaio.steps.findIndex((st) => !cumpridos[st.id] && st.id !== id)
    if (idx >= 0) set({ passoIndex: idx })
  },

  marcarPasso: (id) => set((s) => ({ cumpridos: { ...s.cumpridos, [id]: true } })),

  irParaPasso: (index) => {
    const { ensaio } = get()
    const clamped = Math.max(0, Math.min(index, ensaio.steps.length - 1))
    set({ passoIndex: clamped })
  },

  proximoPasso: () => {
    const { passoIndex, ensaio } = get()
    set({ passoIndex: Math.min(passoIndex + 1, ensaio.steps.length - 1) })
  },

  setTensao: (v) => set({ tensao: v }),

  conectar: (papel) => {
    if (papel === 'earth') set({ earthConectado: true })
    else set({ lineConectado: true })
  },

  iniciarTeste: () => {
    const s = get()
    if (s.fase === 'rodando') return
    const engine = getEngine(s.ensaio.engineRef)
    const r0 = engine.amostra(s.perfil, s.tensao, 0)
    set({
      fase: 'rodando',
      energizado: true,
      tempo: 0,
      amostras: [{ t: 0, r: r0 }],
      leituraAtual: r0,
      resultado: null,
      interagiu: true,
    })
  },

  tickTeste: (deltaS) => {
    const s = get()
    if (s.fase !== 'rodando') return
    const engine = getEngine(s.ensaio.engineRef)
    const dur = s.ensaio.duracaoS
    const tempo = Math.min(s.tempo + deltaS * s.velocidade, dur)
    const r = engine.amostra(s.perfil, s.tensao, tempo)

    const amostras = s.amostras
    const last = amostras[amostras.length - 1]
    const next =
      !last || tempo - last.t >= SAMPLE_EVERY_S || tempo >= dur
        ? [...amostras, { t: tempo, r }]
        : amostras

    if (tempo >= dur) {
      const resultado = engine.executar(s.perfil, s.tensao, s.tempC)
      set({
        tempo: dur,
        leituraAtual: resultado.r60,
        amostras: next,
        fase: 'concluido',
        energizado: false,
        resultado,
        cumpridos: { ...s.cumpridos, 's6-test': true },
        passoIndex: Math.min(s.passoIndex + 1, s.ensaio.steps.length - 1),
      })
    } else {
      set({ tempo, leituraAtual: r, amostras: next })
    }
  },

  cancelarTeste: () =>
    set({ fase: 'idle', energizado: false, tempo: 0, amostras: [], leituraAtual: 0 }),

  setPerfil: (p) => set({ perfil: p }),
  setTempC: (t) => set({ tempC: Math.round(t) }),
  setVelocidade: (v) => set({ velocidade: v }),
  setModoInstrutor: (on) => set({ modoInstrutor: on }),
  marcarInteragiu: () => set({ interagiu: true }),
  setReducedMotion: (on) => set({ reducedMotion: on }),
  setView: (v) => set({ view: v }),
  setTour: (on) => set({ tourAtivo: on }),
  setPickMode: (on) => set({ pickMode: on }),
  setPeca: (s) => set({ peca: s }),
  setConfirmando: (id) => set({ confirmando: id }),
  setQualidadePref: (p) => {
    salvarPref(p)
    set({ qualidadePref: p })
  },

  reset: () => {
    const { equipamento, ensaio } = get()
    get().carregarPar(equipamento.id, ensaio.id)
  },
}))

/** Seletores derivados — fora do store para não recriar a cada render. */
export function passoHabilitado(state: SimState, stepId: string): boolean {
  const step = state.ensaio.steps.find((s) => s.id === stepId)
  if (!step?.requer) return true
  return step.requer.every((r) => state.cumpridos[r])
}

export function progresso(state: SimState): number {
  const total = state.ensaio.steps.length
  const feitos = state.ensaio.steps.filter((s) => state.cumpridos[s.id]).length
  return total === 0 ? 0 : feitos / total
}

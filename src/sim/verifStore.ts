/**
 * verifStore.ts — Estado do fluxo de ENSAIOS da NBR 5410 §7 (Fluke 1662).
 * A engine (`engine/verificacao.ts`) faz o cálculo; aqui fica o progresso, o
 * alvo selecionado e a fase da medição (para a animação do visor + pontas).
 */
import { create } from 'zustand'
import { ENSAIOS_VERIFICACAO } from '../catalog/verificacaoTestes'
import { medirEnsaio, type CondicaoInstalacao, type LeituraEnsaio } from '../engine/verificacao'

export type FaseMedicao = 'idle' | 'medindo' | 'concluido'

interface VerifState {
  /** Índice do ensaio atual (0..6). */
  ensaioIndex: number
  /** Alvo do ensaio (id de tomada, 'quadro' ou 'instalacao'). */
  alvo: string
  fase: FaseMedicao
  /** Valor mostrado no visor durante a animação ('medindo'). */
  display: string
  resultado: LeituraEnsaio | null
  /** Condição da instalação (instrutor): conforme ou com defeito. */
  condicao: CondicaoInstalacao
  /** Resultados por ensaio+alvo já concluídos (p/ o checklist/laudo). */
  registros: Record<string, LeituraEnsaio>

  setEnsaio: (i: number) => void
  setAlvo: (a: string) => void
  setCondicao: (c: CondicaoInstalacao) => void
  iniciarMedicao: () => void
  setDisplay: (s: string) => void
  concluir: () => void
  proximoEnsaio: () => void
  anteriorEnsaio: () => void
  reset: () => void
}

const chave = (ensaioId: string, alvo: string) => `${ensaioId}@${alvo}`

export const useVerif = create<VerifState>((set, get) => ({
  ensaioIndex: 0,
  alvo: 'tomada-br-1',
  fase: 'idle',
  display: '--',
  resultado: null,
  condicao: 'ok',
  registros: {},

  setEnsaio: (i) => {
    const idx = Math.max(0, Math.min(i, ENSAIOS_VERIFICACAO.length - 1))
    const ensaio = ENSAIOS_VERIFICACAO[idx]
    const reg = get().registros[chave(ensaio.id, get().alvo)] ?? null
    set({ ensaioIndex: idx, fase: reg ? 'concluido' : 'idle', resultado: reg, display: reg?.display ?? '--' })
  },
  setAlvo: (a) => {
    const ensaio = ENSAIOS_VERIFICACAO[get().ensaioIndex]
    const reg = get().registros[chave(ensaio.id, a)] ?? null
    set({ alvo: a, fase: reg ? 'concluido' : 'idle', resultado: reg, display: reg?.display ?? '--' })
  },
  setCondicao: (c) => set({ condicao: c }),

  iniciarMedicao: () => {
    if (get().fase === 'medindo') return
    set({ fase: 'medindo', resultado: null, display: '----' })
  },
  setDisplay: (s) => set({ display: s }),

  concluir: () => {
    const { ensaioIndex, alvo, condicao, registros } = get()
    const ensaio = ENSAIOS_VERIFICACAO[ensaioIndex]
    const r = medirEnsaio(ensaio, condicao)
    set({
      fase: 'concluido',
      resultado: r,
      display: r.display,
      registros: { ...registros, [chave(ensaio.id, alvo)]: r },
    })
  },

  proximoEnsaio: () => get().setEnsaio(get().ensaioIndex + 1),
  anteriorEnsaio: () => get().setEnsaio(get().ensaioIndex - 1),

  reset: () => set({ ensaioIndex: 0, alvo: 'tomada-br-1', fase: 'idle', display: '--', resultado: null, registros: {} }),
}))

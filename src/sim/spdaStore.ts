/**
 * spdaStore.ts — estado do ensaio de CONTINUIDADE DO SPDA (NBR 5419-3):
 * trecho selecionado, compensação das pontas, leituras registradas e laudo.
 *
 * A cena 3D lê `pontoAtivo` e `medicoes` para destacar o trecho em ensaio e
 * pintar o resultado de cada descida — é a única interface que o Codex precisa.
 */
import { create } from 'zustand'
import {
  medirContinuidade,
  emitirLaudo,
  type CenarioSPDA,
  type LeituraContinuidade,
  type LaudoSPDA,
} from '../engine/spda'
import { SPDA_PONTOS, getPontoSPDA } from '../catalog/spdaPontos'

interface SpdaState {
  /** Cenário didático: instalação íntegra ou com defeitos plantados. */
  cenario: CenarioSPDA
  /** Pontas de prova compensadas (passo "zerar pontas"). */
  pontasZeradas: boolean
  /** Trecho selecionado no instrumento (id de SPDA_PONTOS). */
  pontoAtivo: string
  /** Leituras registradas, por id de trecho. */
  medicoes: Record<string, LeituraContinuidade>
  /** Leitura em andamento (visor "ao vivo" antes de registrar). */
  lendo: boolean
  laudo: LaudoSPDA | null

  setCenario: (c: CenarioSPDA) => void
  zerarPontas: () => void
  setPontoAtivo: (id: string) => void
  /** Mede o trecho ativo e guarda a leitura. */
  medir: () => void
  /** Descarta a leitura do trecho ativo (para remedir). */
  limparMedicao: (id: string) => void
  emitir: () => void
  reset: () => void
}

const inicial = {
  cenario: 'com-defeitos' as CenarioSPDA,
  pontasZeradas: false,
  pontoAtivo: SPDA_PONTOS[0].id,
  medicoes: {} as Record<string, LeituraContinuidade>,
  lendo: false,
  laudo: null as LaudoSPDA | null,
}

export const useSpda = create<SpdaState>((set, get) => ({
  ...inicial,

  // trocar de cenário invalida tudo que já foi medido
  setCenario: (cenario) => set({ cenario, medicoes: {}, laudo: null }),

  zerarPontas: () => set({ pontasZeradas: true }),

  setPontoAtivo: (pontoAtivo) => set({ pontoAtivo }),

  medir: () => {
    const { pontoAtivo, cenario, pontasZeradas, medicoes } = get()
    const ponto = getPontoSPDA(pontoAtivo)
    if (!ponto) return
    const leitura = medirContinuidade(ponto, cenario, pontasZeradas)
    set({ medicoes: { ...medicoes, [ponto.id]: leitura }, laudo: null })
  },

  limparMedicao: (id) => {
    const medicoes = { ...get().medicoes }
    delete medicoes[id]
    set({ medicoes, laudo: null })
  },

  emitir: () => set({ laudo: emitirLaudo(SPDA_PONTOS, get().medicoes) }),

  reset: () => set({ ...inicial }),
}))

/** Todos os trechos previstos foram medidos? (trava do passo "medir") */
export function todosMedidos(medicoes: Record<string, LeituraContinuidade>): boolean {
  return SPDA_PONTOS.every((p) => !!medicoes[p.id])
}

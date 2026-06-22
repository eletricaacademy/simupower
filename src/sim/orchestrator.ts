/**
 * orchestrator.ts — Traduz a ação do passo atual em transições de estado.
 *
 * É a cola entre o HUD (botão "executar ação") e o store: avança passos,
 * dispara conexões e energização, sem espalhar regras pela UI.
 */
import { useSim, passoHabilitado } from './store'
import type { Step } from '../catalog/types'

/** Hook que expõe a ação do passo atual e se ela está liberada. */
export function useOrchestrator() {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const fase = useSim((s) => s.fase)

  const passo = ensaio.steps[passoIndex] as Step | undefined

  const habilitado = useSim((s) => (passo ? passoHabilitado(s, passo.id) : false))
  const jaCumprido = useSim((s) => (passo ? !!s.cumpridos[passo.id] : false))

  /** Executa a ação do passo atual conforme seu `control`. */
  function executarAcao() {
    const s = useSim.getState()
    if (!passo) return
    if (!passoHabilitado(s, passo.id)) return

    switch (passo.control) {
      case 'connect-earth':
        s.conectar('earth')
        s.cumprirPasso(passo.id)
        break
      case 'connect-line':
        s.conectar('line')
        s.cumprirPasso(passo.id)
        break
      case 'run-test':
        // não marca cumprido aqui — o tick finaliza e marca ao completar 60 s
        s.iniciarTeste()
        break
      case 'voltage':
      default:
        s.cumprirPasso(passo.id)
        break
    }
  }

  const rodando = fase === 'rodando'
  const isTeste = passo?.control === 'run-test'

  return {
    passo,
    habilitado: habilitado && !rodando,
    jaCumprido,
    rodando,
    isTeste,
    executarAcao,
  }
}

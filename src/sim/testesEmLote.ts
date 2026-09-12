import { useSim, passoHabilitado } from './store'
import { useSpda, todosMedidos } from './spdaStore'
import { useEstrutural } from './estruturalStore'
import { useUsinaFv, continuidadeCompleta, toquePassoCompleto } from './usinaFvStore'
import { SPDA_PONTOS } from '../catalog/spdaPontos'
import { PARES_ESTRUTURAIS } from '../catalog/estruturalPontos'
import { PONTOS_CONTINUIDADE_FV, PONTOS_TOQUE_PASSO_FV } from '../catalog/usinaFvPontos'
import { POSICOES_PATAMAR } from '../engine/usinaFv'

/** Atalho de aula: usa as mesmas ações manuais e conserva o cenário escolhido. */
export function executarEtapaEmLote(): boolean {
  const sim = useSim.getState()
  const id = sim.ensaio.steps[sim.passoIndex]?.id
  if (!id || !passoHabilitado(sim, id)) return false
  let completo = false
  if (id === 'spda-medir') {
    const s = useSpda.getState()
    if (!s.pontasZeradas) return false
    for (const p of SPDA_PONTOS) { s.setPontoAtivo(p.id); s.medir() }
    completo = todosMedidos(useSpda.getState().medicoes)
  } else if (id === 'fv-continuidade') {
    const s = useUsinaFv.getState()
    s.zerarPontas()
    for (const p of PONTOS_CONTINUIDADE_FV) { s.setPontoCont(p.id); s.medirContinuidade() }
    completo = continuidadeCompleta(useUsinaFv.getState().continuidade)
  } else if (id === 'fv-resistencia') {
    const s = useUsinaFv.getState()
    // Não afastar C automaticamente: a ausência de patamar também é resultado da aula.
    s.cravarEstacas()
    for (const x of POSICOES_PATAMAR) { s.setPosP(x); s.registrarP() }
    s.calcularMalha()
    completo = !!useUsinaFv.getState().malha
  } else if (id === 'fv-toque-passo') {
    const s = useUsinaFv.getState()
    for (const p of PONTOS_TOQUE_PASSO_FV) { s.setPontoTP(p.id); s.medirTP() }
    completo = toquePassoCompleto(useUsinaFv.getState().toquePasso)
  }
  // Concluir significa que foi medido; reprovações permanecem nos resultados.
  if (completo) sim.marcarPasso(id)
  return completo
}

export function executarEstruturalEmLote(): boolean {
  const s = useEstrutural.getState()
  if (!s.preparado) return false
  for (const p of PARES_ESTRUTURAIS) { s.setPar(p.id); s.conectar(); s.medir() }
  s.emitir()
  return useEstrutural.getState().laudo
}

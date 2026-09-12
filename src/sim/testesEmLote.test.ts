import { beforeEach, expect, it } from 'vitest'
import { executarEtapaEmLote, executarEstruturalEmLote } from './testesEmLote'
import { useSim } from './store'
import { useSpda } from './spdaStore'
import { useEstrutural } from './estruturalStore'
import { useUsinaFv } from './usinaFvStore'
import { PAR_SPDA, PAR_USINA_FV } from '../catalog'
import { SPDA_PONTOS } from '../catalog/spdaPontos'
import { PARES_ESTRUTURAIS } from '../catalog/estruturalPontos'
import { DISTANCIAS_C_M, PONTOS_CONTINUIDADE_FV, PONTOS_TOQUE_PASSO_FV } from '../catalog/usinaFvPontos'
import { POSICOES_PATAMAR } from '../engine/usinaFv'

beforeEach(() => { useSpda.getState().reset(); useEstrutural.getState().reset(); useUsinaFv.getState().reset() })

function etapa(id: string, preparar = true) {
  const par = id.startsWith('spda') ? PAR_SPDA : PAR_USINA_FV
  useSim.getState().carregarPar(par.equipamentoId, par.ensaioId)
  const s = useSim.getState(), i = s.ensaio.steps.findIndex(p => p.id === id)
  if (preparar) for (const p of s.ensaio.steps.slice(0, i)) s.marcarPasso(p.id)
  s.irParaPasso(i)
}

it('não pula preparação nem executa etapas sem medições', () => {
  etapa('fv-continuidade', false)
  expect(executarEtapaEmLote()).toBe(false)
  expect(useUsinaFv.getState().continuidade).toEqual({})
  expect(executarEstruturalEmLote()).toBe(false)
  etapa('spda-medir')
  expect(executarEtapaEmLote()).toBe(false)
})

it('SPDA mede todos os pares com os mesmos resultados manuais e conclui só a etapa', () => {
  etapa('spda-medir')
  const s = useSpda.getState(); s.zerarPontas()
  for (const p of SPDA_PONTOS) { s.setPontoAtivo(p.id); s.medir() }
  const esperado = Object.values(useSpda.getState().medicoes).map(l => l.r)
  s.reset(); s.zerarPontas()
  expect(executarEtapaEmLote()).toBe(true)
  expect(Object.values(useSpda.getState().medicoes).map(l => l.r)).toEqual(esperado)
  expect(useSim.getState().cumpridos['spda-medir']).toBe(true)
  expect(useSpda.getState().laudo).toBeNull()
})

it('FV continuidade conserva os defeitos e não mede toque/passo', () => {
  etapa('fv-continuidade')
  const s = useUsinaFv.getState(); s.zerarPontas()
  for (const p of PONTOS_CONTINUIDADE_FV) { s.setPontoCont(p.id); s.medirContinuidade() }
  const esperado = Object.values(useUsinaFv.getState().continuidade).map(l => l.display)
  s.reset()
  expect(executarEtapaEmLote()).toBe(true)
  expect(Object.values(useUsinaFv.getState().continuidade).map(l => l.display)).toEqual(esperado)
  expect(useUsinaFv.getState().toquePasso).toEqual({})
})

it.each([DISTANCIAS_C_M[1], DISTANCIAS_C_M.at(-1)!])('FV resistência mantém C a %s m e o resultado manual do patamar', distancia => {
  etapa('fv-resistencia')
  const s = useUsinaFv.getState(); s.setDistanciaC(distancia); s.cravarEstacas()
  for (const x of POSICOES_PATAMAR) { s.setPosP(x); s.registrarP() }
  s.calcularMalha()
  const esperado = useUsinaFv.getState().malha
  s.setDistanciaC(distancia)
  expect(executarEtapaEmLote()).toBe(true)
  expect(useUsinaFv.getState().malha).toEqual(esperado)
  expect(useUsinaFv.getState().distanciaC).toBe(distancia)
  expect(useUsinaFv.getState().curva).toHaveLength(3)
})

it('FV toque/passo mede os seis pontos sem alterar solo e cenário', () => {
  etapa('fv-toque-passo')
  const s = useUsinaFv.getState(); s.setSolo('umido'); s.setCenario('conforme')
  for (const p of PONTOS_TOQUE_PASSO_FV) { s.setPontoTP(p.id); s.medirTP() }
  const esperado = useUsinaFv.getState().toquePasso
  s.setCenario('conforme')
  expect(executarEtapaEmLote()).toBe(true)
  expect(useUsinaFv.getState().toquePasso).toEqual(esperado)
  expect(useUsinaFv.getState().solo).toBe('umido')
})

it('estrutural mede cruzadas e comprobatória e abre relatório com defeito preservado', () => {
  const s = useEstrutural.getState(); s.preparar(); s.setDefeito('bep')
  for (const p of PARES_ESTRUTURAIS) { s.setPar(p.id); s.conectar(); s.medir() }
  const esperado = Object.values(useEstrutural.getState().leituras).map(l => [l.r, l.aprovado])
  s.setDefeito('bep')
  expect(executarEstruturalEmLote()).toBe(true)
  expect(Object.values(useEstrutural.getState().leituras).map(l => [l.r, l.aprovado])).toEqual(esperado)
  expect(useEstrutural.getState().defeito).toBe('bep')
})

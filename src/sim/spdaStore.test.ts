import { expect, it } from 'vitest'
import { useSpda, todosMedidos } from './spdaStore'
import { SPDA_PONTOS } from '../catalog/spdaPontos'

it('mostra o fluxo após medir e interrompe ao trocar trecho, limpar ou reiniciar', () => {
  const estado = () => useSpda.getState()
  estado().reset()
  estado().setFluxoAtivo(true)
  expect(estado().fluxoAtivo).toBe(false)
  estado().medir()
  expect(estado().fluxoAtivo).toBe(true)
  estado().setFluxoAtivo(false)
  expect(estado().fluxoAtivo).toBe(false)
  estado().setFluxoAtivo(true)
  expect(estado().fluxoAtivo).toBe(true)
  estado().limparMedicao(estado().pontoAtivo)
  expect(estado().fluxoAtivo).toBe(false)
  estado().medir()
  estado().setPontoAtivo(SPDA_PONTOS[1].id)
  expect(estado().fluxoAtivo).toBe(false)
  estado().medir()
  estado().reset()
  expect(estado().fluxoAtivo).toBe(false)
})

it('registra superior e inferior separadamente e exige os 13 ensaios para completar', () => {
  useSpda.getState().reset()
  useSpda.getState().setCenario('conforme')
  useSpda.getState().zerarPontas()
  for (const ponto of SPDA_PONTOS.slice(0, -1)) {
    useSpda.getState().setPontoAtivo(ponto.id)
    useSpda.getState().medir()
  }
  expect(todosMedidos(useSpda.getState().medicoes)).toBe(false)
  expect(Object.keys(useSpda.getState().medicoes)).toHaveLength(12)
  useSpda.getState().setPontoAtivo('eq-bep')
  useSpda.getState().medir()
  expect(todosMedidos(useSpda.getState().medicoes)).toBe(true)
  useSpda.getState().emitir()
  expect(useSpda.getState().laudo?.conforme).toBe(true)
  useSpda.getState().reset()
})

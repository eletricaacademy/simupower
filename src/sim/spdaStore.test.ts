import { expect, it } from 'vitest'
import { useSpda, todosMedidos } from './spdaStore'
import { SPDA_PONTOS } from '../catalog/spdaPontos'

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

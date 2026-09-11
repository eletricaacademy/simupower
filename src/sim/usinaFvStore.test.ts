import { beforeEach, expect, it } from 'vitest'
import { useUsinaFv, continuidadeCompleta, toquePassoCompleto } from './usinaFvStore'
import { POSICOES_PATAMAR } from '../engine/usinaFv'
import { DISTANCIAS_C_M, PONTOS_CONTINUIDADE_FV, PONTOS_TOQUE_PASSO_FV } from '../catalog/usinaFvPontos'

const s = () => useUsinaFv.getState()
beforeEach(() => s().reset())

function levantarPatamar() {
  for (const x of POSICOES_PATAMAR) {
    s().setPosP(x)
    s().registrarP()
  }
}

it('só mede continuidade depois de compensar as pontas', () => {
  s().medirContinuidade()
  expect(Object.keys(s().continuidade)).toHaveLength(0)
  s().zerarPontas()
  s().medirContinuidade()
  expect(Object.keys(s().continuidade)).toHaveLength(1)
})

it('exige todos os pontos de continuidade e de toque/passo', () => {
  s().zerarPontas()
  for (const p of PONTOS_CONTINUIDADE_FV.slice(0, -1)) {
    s().setPontoCont(p.id)
    s().medirContinuidade()
  }
  expect(continuidadeCompleta(s().continuidade)).toBe(false)
  s().setPontoCont(PONTOS_CONTINUIDADE_FV.at(-1)!.id)
  s().medirContinuidade()
  expect(continuidadeCompleta(s().continuidade)).toBe(true)
  for (const p of PONTOS_TOQUE_PASSO_FV) {
    s().setPontoTP(p.id)
    s().medirTP()
  }
  expect(toquePassoCompleto(s().toquePasso)).toBe(true)
})

it('registra a curva só com as estacas cravadas e recomeça ao mover a estaca C', () => {
  s().registrarP()
  expect(s().curva).toHaveLength(0)
  s().cravarEstacas()
  levantarPatamar()
  expect(s().curva).toHaveLength(3)
  s().calcularMalha()
  expect(s().malha).not.toBeNull()
  s().setDistanciaC(DISTANCIAS_C_M.at(-1)!)
  expect(s().estacasCravadas).toBe(false)
  expect(s().curva).toHaveLength(0)
  expect(s().malha).toBeNull()
})

it('não duplica leitura na mesma posição da estaca P', () => {
  s().cravarEstacas()
  s().setPosP(0.62)
  s().registrarP()
  s().registrarP()
  expect(s().curva).toHaveLength(1)
})

it('fluxo completo em solo úmido e instalação íntegra emite laudo conforme', () => {
  s().setSolo('umido')
  s().setCenario('conforme')
  s().zerarPontas()
  for (const p of PONTOS_CONTINUIDADE_FV) {
    s().setPontoCont(p.id)
    s().medirContinuidade()
  }
  s().setDistanciaC(DISTANCIAS_C_M.at(-1)!)
  s().cravarEstacas()
  levantarPatamar()
  s().calcularMalha()
  for (const p of PONTOS_TOQUE_PASSO_FV) {
    s().setPontoTP(p.id)
    s().medirTP()
  }
  s().emitir()
  expect(s().laudo?.completo).toBe(true)
  expect(s().laudo?.conforme).toBe(true)
})

it('trocar o solo invalida a malha e o toque/passo, mas preserva a continuidade', () => {
  s().zerarPontas()
  s().medirContinuidade()
  s().medirTP()
  s().setSolo('rochoso')
  expect(Object.keys(s().continuidade)).toHaveLength(1)
  expect(Object.keys(s().toquePasso)).toHaveLength(0)
})

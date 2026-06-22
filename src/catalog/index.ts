/**
 * index.ts — Catálogo: registra equipamentos e ensaios disponíveis.
 *
 * A aplicação seleciona um par (equipamento × ensaio) por id. Novos itens
 * entram aqui; nada mais precisa mudar.
 */
import type { Equipment, TestProcedure } from './types'
import { motor } from './equipment/motor'
import { painelMT } from './equipment/painel'
import { subestacao } from './equipment/subestacao'
import { subestacaoLimpa } from './equipment/subestacaoLimpa'
import { aterramentoSub } from './equipment/aterramentoSub'
import { insulationProcedure } from './tests/insulation'
import { arcflashProcedure } from './tests/arcflash'
import { inspecaoProcedure } from './tests/inspecao'
import { desenergizacaoProcedure } from './tests/desenergizacao'
import { aterramentoProcedure } from './tests/aterramento'

export const EQUIPAMENTOS: Record<string, Equipment> = {
  [motor.id]: motor,
  [painelMT.id]: painelMT,
  [subestacao.id]: subestacao,
  [subestacaoLimpa.id]: subestacaoLimpa,
  [aterramentoSub.id]: aterramentoSub,
}

export const ENSAIOS: Record<string, TestProcedure> = {
  [insulationProcedure.id]: insulationProcedure,
  [arcflashProcedure.id]: arcflashProcedure,
  [inspecaoProcedure.id]: inspecaoProcedure,
  [desenergizacaoProcedure.id]: desenergizacaoProcedure,
  [aterramentoProcedure.id]: aterramentoProcedure,
}

/** Par padrão (módulo de isolamento em motor). */
export const PAR_PADRAO = {
  equipamentoId: motor.id,
  ensaioId: insulationProcedure.id,
} as const

/** Par do módulo de arco elétrico (painel MT). */
export const PAR_ARCO = {
  equipamentoId: painelMT.id,
  ensaioId: arcflashProcedure.id,
} as const

/** Par do módulo de inspeção (subestação completa). */
export const PAR_INSPECAO = {
  equipamentoId: subestacao.id,
  ensaioId: inspecaoProcedure.id,
} as const

/** Par do módulo de desenergização (subestação limpa, sem paredes/tela). */
export const PAR_DESENERG = {
  equipamentoId: subestacaoLimpa.id,
  ensaioId: desenergizacaoProcedure.id,
} as const

/** Par do módulo de resistência de aterramento (queda de potencial). */
export const PAR_ATERRAMENTO = {
  equipamentoId: aterramentoSub.id,
  ensaioId: aterramentoProcedure.id,
} as const

export function getEquipamento(id: string): Equipment {
  const e = EQUIPAMENTOS[id]
  if (!e) throw new Error(`Equipamento não encontrado: ${id}`)
  return e
}

export function getEnsaio(id: string): TestProcedure {
  const t = ENSAIOS[id]
  if (!t) throw new Error(`Ensaio não encontrado: ${id}`)
  return t
}

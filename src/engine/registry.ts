/**
 * registry.ts — Mapeia id-do-ensaio (EngineRef) → função pura da engine.
 *
 * O orquestrador resolve o cálculo do ensaio ativo por aqui, sem conhecer
 * a implementação. Novo ensaio = nova entrada apontando para sua função.
 */
import {
  executarEnsaio,
  rIso,
  type Perfil,
  type TensaoEnsaio,
  type ResultadoEnsaio,
} from './insulation'
import type { EngineRef } from '../catalog/types'

export interface EngineModule {
  /** Resultado final do ensaio (capturas + vereditos). */
  executar: (perfil: Perfil, V: TensaoEnsaio, tempC: number) => ResultadoEnsaio
  /** Valor instantâneo para o readout/curva ao vivo. */
  amostra: (perfil: Perfil, V: TensaoEnsaio, t: number) => number
  /** Unidade de leitura exibida no instrumento. */
  unidade: string
}

const insulationModule: EngineModule = {
  executar: executarEnsaio,
  amostra: rIso,
  unidade: 'MΩ',
}

// Apenas ensaios "amostrados no tempo" entram aqui (megger). O arco elétrico
// usa funções diretas (engine/arcflash), não este registry.
const REGISTRY: Partial<Record<EngineRef, EngineModule>> = {
  insulation: insulationModule,
}

export function getEngine(ref: EngineRef): EngineModule {
  const mod = REGISTRY[ref]
  if (!mod) throw new Error(`Engine não registrada: ${ref}`)
  return mod
}

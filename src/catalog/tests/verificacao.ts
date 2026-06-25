import type { TestProcedure } from '../types'

/**
 * Verificação de instalações elétricas de baixa tensão — NBR 5410, Seção 7
 * (verificação final: inspeção visual + ensaios). Ambiente: instalação
 * hospitalar.
 *
 * ESTADO ATUAL: apenas o cenário (ambiente walk-in). O fluxo de verificação
 * — inspeção visual e ensaios da Seção 7 (continuidade, isolamento, DR,
 * resistência de aterramento, etc.) — será definido em detalhe depois. Por
 * isso `steps` está vazio: o HUD apresenta só a casca/identidade por enquanto.
 */
export const verificacaoProcedure: TestProcedure = {
  id: 'verificacao-5410',
  nome: 'Verificação de Instalações (NBR 5410 — Seção 7)',
  norma: 'NBR 5410 · Seção 7',
  instrumento: 'checklist',
  engineRef: 'verificacao',
  modo: 'verificacao',
  tensoes: [],
  tensaoPadrao: 0,
  duracaoS: 0,
  steps: [],
}

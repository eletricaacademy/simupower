import type { Equipment } from '../types'

/**
 * Prédio com SPDA — estrutura ensaiada no módulo de continuidade do SPDA
 * (NBR 5419-3): anel de captação na cobertura, 4 descidas nas fachadas, caixas
 * de inspeção na base e ligação ao BEP.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ CODEX: este é o gancho do AMBIENTE 3D.                                    ║
 * ║                                                                          ║
 * ║ `modelPath` VAZIO = a cena usa o prédio PROCEDURAL provisório de          ║
 * ║ `scene/SpdaElements.tsx` (o módulo já roda assim).                        ║
 * ║ Ao entregar o modelo:                                                     ║
 * ║   1. salve em `public/models/spda-predio.glb` (bruto em assets-raw/)      ║
 * ║   2. preencha `modelPath: 'models/spda-predio.glb'` e ajuste `escalaAlvo` ║
 * ║   3. calibre `pos`/`posOrigem` em `catalog/spdaPontos.ts` e desligue o    ║
 * ║      placeholder (PREDIO_PROCEDURAL = false em SpdaElements.tsx)          ║
 * ║   4. regrave `vistaInicial` e as `vista`s dos passos com o capturador     ║
 * ║      de pose (⚙ do HUD)                                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
export const spdaPredio: Equipment = {
  id: 'spda-predio',
  nome: 'Prédio com SPDA',
  tipo: 'painel', // estrutura civil; reusa o tipo genérico (como a malha de aterramento)
  modelPath: 'models/spda-predio.glb',
  escalaAlvo: 13.511651039123535,
  cenario: 'predio-spda',
  vistaInicial: { pos: [18, 10, 18], target: [0, 4.5, 0] },
  anchors: [],
  dadosNominais: {
    isolamentoClasse: 'SPDA classe II (referência)',
    descidas: 4,
    alturaM: 9,
  },
}

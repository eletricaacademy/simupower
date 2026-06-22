import type { Equipment } from '../types'

/**
 * Malha de aterramento da subestação (pátio) — usada no ensaio de resistência
 * de aterramento por queda de potencial. Renderizada na cena walk-in (env).
 */
export const aterramentoSub: Equipment = {
  id: 'aterramento-subestacao',
  nome: 'Malha de Aterramento',
  tipo: 'painel',
  modelPath: 'models/aterramento.glb',
  escalaAlvo: 8.0,
  cenario: 'subestacao-3d',
  anchors: [],
  dadosNominais: {
    tensaoV: 13800,
    isolamentoClasse: 'Subestação',
  },
}

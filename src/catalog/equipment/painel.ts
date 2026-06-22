import type { Equipment } from '../types'

/**
 * Painel de Média Tensão (cubículo de manobra) — modelo Armadio MT.
 * Apresentado numa subestação de alvenaria (sala branca). Não usa âncoras de
 * ponteira (o estudo de arco é por cálculo), mas mantém uma âncora frontal para
 * a posição de trabalho/foco de câmera.
 */
export const painelMT: Equipment = {
  id: 'painel-mt-cabine',
  nome: 'Painel de Média Tensão',
  tipo: 'painel',
  modelPath: 'models/painel-mt.glb',
  escalaAlvo: 3.6,
  cenario: 'subestacao',
  anchors: [
    { id: 'frente', pos: [0, 1.0, 1.3], label: 'Posição de trabalho', papel: 'line' },
  ],
  dadosNominais: {
    tensaoV: 13800,
    correnteA: 630,
    isolamentoClasse: '17.5 kV',
  },
}

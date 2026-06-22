import type { Equipment } from '../types'

/**
 * Subestação completa (modelo 3D walk-in) — o próprio modelo é o AMBIENTE: o
 * operador entra e inspeciona. As âncoras são pontos de inspeção (foco de
 * câmera). Posições aproximadas no modelo normalizado/centralizado — fáceis de
 * ajustar conforme o enquadramento real.
 */
export const subestacao: Equipment = {
  id: 'subestacao-completa',
  nome: 'Subestação',
  tipo: 'painel',
  modelPath: '/models/subestacao.glb',
  escalaAlvo: 6.4, // ~1 unidade = 1 m (walk-in)
  cenario: 'subestacao-3d',
  // vista de abertura calibrada (aérea 3/4)
  vistaInicial: { pos: [3.991, 12.599, 4.579], target: [0, 1, -0.5] },
  anchors: [
    { id: 'acesso', pos: [0, 1.6, 2.0], label: 'Acesso e sinalização', papel: 'neutro' },
    { id: 'trafo', pos: [-1.8, 1.2, -1.2], label: 'Transformador', papel: 'neutro' },
    { id: 'cubiculos', pos: [1.6, 1.4, -1.2], label: 'Cubículos / disjuntores', papel: 'neutro' },
    { id: 'aterramento', pos: [0, 0.3, -2.0], label: 'Aterramento', papel: 'neutro' },
    { id: 'iluminacao', pos: [0, 3.4, 0], label: 'Iluminação e ventilação', papel: 'neutro' },
    { id: 'cabos', pos: [1.2, 2.4, -1.6], label: 'Cabos e conexões', papel: 'neutro' },
    // pontos de desenergização (placeholders — calibrar por clique)
    { id: 'disjuntor', pos: [1.6, 1.2, -1.0], label: 'Disjuntor / seccionadora', papel: 'neutro' },
    { id: 'bloqueio', pos: [1.4, 1.3, -1.0], label: 'Ponto de bloqueio', papel: 'neutro' },
    { id: 'teste', pos: [1.9, 1.5, -1.2], label: 'Ponto de teste de tensão', papel: 'neutro' },
    { id: 'aterramento', pos: [1.2, 0.4, -1.2], label: 'Ponto de aterramento', papel: 'neutro' },
    { id: 'protecao', pos: [2.1, 1.4, -1.2], label: 'Proteção de partes vivas', papel: 'neutro' },
    { id: 'sinalizacao', pos: [1.4, 1.8, -0.85], label: 'Sinalização', papel: 'neutro' },
  ],
  dadosNominais: {
    tensaoV: 13800,
    isolamentoClasse: 'Subestação abrigada',
  },
}

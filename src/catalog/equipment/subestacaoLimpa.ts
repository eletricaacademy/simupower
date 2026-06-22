import type { Equipment } from '../types'

/**
 * Subestação (modelo limpo, sem paredes/tela) — usada no módulo de
 * DESENERGIZAÇÃO. Modelo enxuto, ideal para mirar os pontos de manobra.
 * Âncoras dos pontos de desenergização são placeholders — calibrar por clique.
 */
export const subestacaoLimpa: Equipment = {
  id: 'subestacao-limpa',
  nome: 'Subestação',
  tipo: 'painel',
  modelPath: '/models/subestacao-limpa.glb',
  escalaAlvo: 6.0, // ~1 unidade = 1 m
  cenario: 'subestacao-3d',
  anchors: [
    { id: 'disjuntor', pos: [-2.39, 0.42, 1.01], label: 'Disjuntor / seccionadora', papel: 'neutro' },
    { id: 'bloqueio', pos: [-1.23, 1.1, 1.09], label: 'Ponto de bloqueio', papel: 'neutro' },
    { id: 'teste', pos: [-0.54, 2.01, 0.23], label: 'Barramento (teste de tensão)', papel: 'neutro' },
    { id: 'aterramento', pos: [-2.37, 1.53, 0.57], label: 'Aterramento (barramento central)', papel: 'neutro' },
    { id: 'protecao', pos: [0.26, 1.86, 0.21], label: 'Proteção de partes vivas', papel: 'neutro' },
    { id: 'sinalizacao', pos: [0.02, 1.84, 1.01], label: 'Sinalização', papel: 'neutro' },
  ],
  dadosNominais: {
    tensaoV: 13800,
    isolamentoClasse: 'Subestação abrigada',
  },
}

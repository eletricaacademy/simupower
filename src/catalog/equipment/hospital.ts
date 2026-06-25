import type { Equipment } from '../types'

/**
 * Instalação hospitalar (modelo 3D walk-in) — o próprio modelo É o AMBIENTE: o
 * técnico entra e percorre a instalação para a verificação final (NBR 5410,
 * Seção 7). Por enquanto só o cenário; as âncoras (pontos de verificação) e o
 * fluxo de ensaios serão construídos depois.
 *
 * O GLB bruto vem em metros (~15 × 3,3 × 19 m). `escalaAlvo` ≈ maior dimensão
 * real → mantém 1 unidade ≈ 1 m. Equipment3D centraliza no plano XZ e assenta a
 * base em y = 0.
 */
export const hospital: Equipment = {
  id: 'hospital',
  nome: 'Instalação Hospitalar',
  tipo: 'painel',
  modelPath: 'models/hospital.glb',
  escalaAlvo: 19.1, // 1 u ≈ 1 m (walk-in)
  cenario: 'hospital',
  // vista de abertura: dentro da instalação, à altura dos olhos, olhando o eixo
  // longo (corredor). Ajustável por captura / depois de calibrar.
  vistaInicial: { pos: [4.5, 2.0, 9.5], target: [0, 1.3, 0] },
  anchors: [],
  dadosNominais: {
    tensaoV: 220,
    isolamentoClasse: 'Instalação de baixa tensão — ambiente hospitalar',
  },
}

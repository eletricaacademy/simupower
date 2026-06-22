import type { Equipment } from '../types'

/**
 * Motor de indução trifásico (modelo de exemplo electric_motor.glb).
 *
 * Âncoras: heurística inicial relativa ao equipamento normalizado/assentado
 * (escalaAlvo = maior dimensão ~2 unidades, base no y=0). O GLB não traz a
 * posição real da caixa de bornes, então estes valores são fáceis de ajustar
 * aqui sem tocar na cena.
 */
export const motor: Equipment = {
  id: 'motor-inducao-bt',
  nome: 'Motor de Indução Trifásico',
  tipo: 'motor',
  modelPath: 'models/electric_motor.glb',
  // proporcional ao megômetro/bancada (antes 2 — ficava grande demais).
  escalaAlvo: 1.2,
  anchors: [
    {
      id: 'carcaca-terra',
      pos: [0.414, 0.042, 0.2],
      label: 'Carcaça (aterramento)',
      papel: 'earth',
    },
    {
      id: 'borne-u',
      pos: [0.273, 0.92, 0.174],
      label: 'Terminal U (enrolamento)',
      papel: 'line',
    },
  ],
  dadosNominais: {
    tensaoV: 380,
    potenciaCV: 10,
    rpm: 1760,
    isolamentoClasse: 'F',
  },
}

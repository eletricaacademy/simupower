import type { Equipment } from '../types'
import { USINA, POTENCIA_DC_KWP, MODULOS_TOTAL, VISTAS_FV } from '../usinaFvPontos'

/** Ambiente GLB em metros, preservado por UsinaFvModelo sem recentralizar.
 * Fonte e kit: scripts/gerar-usina-fv.ts. Contrato: docs/modulos/aterramento-usina-fv.md.
 */
export const usinaFv: Equipment = {
  id: 'usina-fv-100kw',
  nome: `Usina FV de solo · ${USINA.potenciaCaKw} kW`,
  tipo: 'painel', // instalação completa; reusa o tipo genérico (como a malha e o prédio)
  modelPath: 'models/usina-fv.glb',
  escalaAlvo: 76.07, // Modelo em metros; UsinaFvModelo preserva a origem da planta.
  cenario: 'usina-fv',
  vistaInicial: VISTAS_FV.geral,
  anchors: [],
  dadosNominais: {
    tensaoV: USINA.tensaoMtKv * 1000,
    isolamentoClasse: 'Usina FV de solo',
    potenciaCaKw: USINA.potenciaCaKw,
    potenciaDcKwp: POTENCIA_DC_KWP,
    modulos: MODULOS_TOTAL,
    trafoKva: USINA.trafoKva,
  },
}

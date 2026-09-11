import type { Equipment } from '../types'
import { USINA, POTENCIA_DC_KWP, MODULOS_TOTAL, VISTAS_FV } from '../usinaFvPontos'

/**
 * Usina fotovoltaica de solo de 100 kW — mesas fixas, skid de inversores,
 * transformador elevador, cabine de medição e proteção e cerca perimetral.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ CODEX: este é o gancho do AMBIENTE 3D.                                    ║
 * ║                                                                          ║
 * ║ `modelPath` VAZIO = a cena usa o placeholder PROCEDURAL de                ║
 * ║ `scene/UsinaFvElements.tsx` (o módulo já roda assim, com os ensaios).     ║
 * ║ Ao entregar o modelo:                                                     ║
 * ║   1. bruto em `assets-raw/models/`, otimizado em                          ║
 * ║      `public/models/usina-fv.glb` (sem Draco/meshopt; ver AGENTS.md)      ║
 * ║   2. preencher `modelPath: 'models/usina-fv.glb'` e ajustar `escalaAlvo`  ║
 * ║   3. desligar as partes procedurais substituídas (USINA_PROCEDURAL em     ║
 * ║      UsinaFvElements.tsx) — malha enterrada e marcadores continuam        ║
 * ║   4. recapturar `pos`/`vista` marcados CALIBRAR (CODEX) em                ║
 * ║      `catalog/usinaFvPontos.ts` e a `vistaInicial` abaixo                 ║
 * ║ Contrato completo: docs/modulos/aterramento-usina-fv.md                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
export const usinaFv: Equipment = {
  id: 'usina-fv-100kw',
  nome: 'Usina FV de solo · 100 kW',
  tipo: 'painel', // instalação completa; reusa o tipo genérico (como a malha e o prédio)
  modelPath: '',
  escalaAlvo: 46,
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

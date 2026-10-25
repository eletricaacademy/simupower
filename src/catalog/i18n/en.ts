/**
 * en.ts — Catálogo em inglês (EUA).
 *
 * Terminologia alinhada ao glossário do GroundPRO (grounding, grid, LPS,
 * fall-of-potential). Normas citadas continuam as do original; equivalências
 * IEC/IEEE e pendências em `docs/i18n.md`.
 */
import type { TraducaoCatalogo } from './localizar'
import { USINA } from '../usinaFvPontos'
import { EN_USINA_FV } from './en/usinaFv'
import { EN_SPDA } from './en/spda'
import { EN_ESTRUTURAL } from './en/estrutural'
import { EN_VERIFICACAO } from './en/verificacao'
import { EN_DESENERGIZACAO } from './en/desenergizacao'
import { EN_ISOLAMENTO } from './en/isolamento'
import { EN_ARCO } from './en/arco'
import { EN_INSPECAO } from './en/inspecao'

export const CATALOGO_EN: TraducaoCatalogo = {
  equipamentos: {
    'motor-inducao-bt': { nome: 'Three-phase induction motor' },
    'painel-mt-cabine': { nome: 'Medium-voltage switchgear' },
    'subestacao-completa': { nome: 'Substation' },
    'subestacao-limpa': { nome: 'Substation' },
    'aterramento-subestacao': { nome: 'Grounding grid' },
    hospital: { nome: 'Hospital installation' },
    'spda-predio': { nome: 'Building with LPS' },
    'galpao-estrutural': { nome: 'Industrial warehouse · structural LPS' },
    'usina-fv-100kw': { nome: `Ground-mounted PV plant · ${USINA.potenciaCaKw} kW` },
  },
  ensaios: {
    'resistencia-isolamento': { nome: 'Insulation resistance' },
    'arco-eletrico': { nome: 'Arc flash analysis' },
    'inspecao-subestacao': { nome: 'Substation inspection' },
    'desenergizacao-subestacao': { nome: 'De-energization procedure' },
    'verificacao-5410': {
      nome: 'Installation verification (NBR 5410 — Section 7)',
      norma: 'NBR 5410 · Section 7',
    },
    'continuidade-spda': {
      nome: 'LPS continuity',
      norma: 'NBR 5419-3 — LPS inspection and maintenance',
    },
    'spda-estrutural': {
      nome: 'Natural / structural LPS',
      norma: 'ABNT NBR 5419-3:2026 · Annex F',
    },
    'aterramento-usina-fv': { nome: 'Grounding of a photovoltaic plant' },

    // módulos completos (um arquivo por módulo em ./en/) sobrescrevem só o nome acima
    ...EN_USINA_FV,
    ...EN_SPDA,
    ...EN_ESTRUTURAL,
    ...EN_VERIFICACAO,
    ...EN_DESENERGIZACAO,
    ...EN_ISOLAMENTO,
    ...EN_ARCO,
    ...EN_INSPECAO,

    // ── piloto completo: ground resistance ──
    'resistencia-aterramento': {
      nome: 'Ground resistance',
      norma: 'NBR 15749 · IEEE 81 — Fall of potential',
      steps: {
        'at-seguranca': {
          titulo: 'Safety and preparation',
          descricao: 'Assess the risks, check the area and prepare the ground resistance test.',
          detalhes: [
            'Job safety analysis (JSA) and proper PPE',
            'Check the area around the electrode',
            'Calibrated ground tester and leads/stakes in good condition',
          ],
          cuidados: ['Watch for step and touch voltages while current is being injected.'],
          feito: 'Preparation complete.',
          acao: 'Confirm preparation',
        },
        'at-terrometro': {
          titulo: 'Position the ground tester',
          descricao:
            'Place the stake-type ground tester at the test point and connect lead E (green) to the electrode/grid under test.',
          detalhes: ['Tester on firm ground', 'Lead E (green) on the electrode under test (E)'],
          feito: 'Ground tester positioned and lead E connected.',
          acao: 'Position ground tester',
        },
        'at-estaca-c': {
          titulo: 'Drive the current stake (C)',
          descricao:
            'Drive the current stake in a straight line, away from the electrode (E), and connect lead C (red).',
          detalhes: ['Sufficient distance D (≥ 5× the grid dimension)', 'Stake firm and in undisturbed soil'],
          feito: 'Current stake (C) driven and lead C connected.',
          acao: 'Drive stake C',
        },
        'at-medir': {
          titulo: 'Measure by moving stake P',
          descricao:
            'The potential stake (P) is NOT fixed: move it between E and C and record the reading at each position. The curve forms a plateau in the middle — the reading at ~62% is the true resistance.',
          detalhes: [
            'Sweep P from ~10% to ~90% of the E–C distance, recording each position (min. 3 points)',
            'Confirm the plateau: move P ±5% and check that the reading holds (NBR 15749)',
            'The reading in the plateau zone (~62%) is the true resistance',
          ],
          cuidados: ['If there is no plateau, increase distance D (coupling between electrodes).'],
          feito: 'Curve recorded — plateau found at ~62%.',
          acao: 'Finish measurement',
        },
        'at-laudo': {
          titulo: 'Result and verdict',
          descricao:
            'Read the resistance at 62% (fall of potential, NBR 15749). Utility recommendation: ground resistance ≤ 10 Ω.',
          feito: 'Test complete.',
          acao: 'Issue result',
        },
      },
    },
  },
}

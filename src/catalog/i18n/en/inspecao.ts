import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `inspecao-subestacao` em inglês, por id de passo. */
export const EN_INSPECAO: Record<string, TraducaoEnsaio> = {
  'inspecao-subestacao': {
    nome: 'Substation inspection',
    norma: 'NR-10 · NBR 14039',
    steps: {
      'insp-acesso': {
        titulo: 'Access and signage',
        descricao: 'Check the access conditions and the safety signage of the substation.',
        detalhes: [
          'Door/locks intact and room identified',
          'Warning signs "Danger of Death / High Voltage"',
          'Single-line diagram posted and legible',
          'PPE and insulating mat/platform available',
          'Access restricted to authorized personnel (NR-10)',
        ],
        acao: 'Assess item',
        norma: 'NR-10',
      },
      'insp-trafo': {
        titulo: 'Transformer',
        descricao: 'Inspect the general condition of the transformer and its accessories.',
        detalhes: [
          'Oil leaks at the tank, radiators and gaskets',
          'Oil level in the sight glass within range',
          'Silica gel (blue = OK; pink = saturated)',
          'Temperature/thermometer and abnormal noise',
          'Bushings: cleanliness, cracks and connections',
          'Tank grounding secure',
        ],
        acao: 'Assess item',
      },
      'insp-cubiculos': {
        titulo: 'Cubicles and circuit breakers',
        descricao: 'Check the switchgear cubicles and the protective devices.',
        detalhes: [
          'Cubicle doors closed and latched',
          'Switching position indication (open/closed/grounded)',
          'Indicators and push buttons working',
          'Interlocks working',
          'No signs of flashover/carbonization',
        ],
        acao: 'Assess item',
      },
      'insp-aterramento': {
        titulo: 'Grounding',
        descricao: 'Check the grounding and bonding system.',
        detalhes: [
          'Grid connections tight and free of corrosion',
          'Ground conductors intact and identified (green-yellow)',
          'Continuity from enclosures to the grid',
          'Exothermic welds/connectors in good condition',
        ],
        acao: 'Assess item',
      },
      'insp-cabos': {
        titulo: 'Cables and connections',
        descricao: 'Look for anomalies in conductors and connections.',
        detalhes: [
          'Hot spots / discoloration (thermography)',
          'Damaged, dried-out or cracked insulation',
          'Loose or oxidized connections',
          'Cable/conduit routing and support',
          'Bending radius and phase identification',
        ],
        acao: 'Assess item',
      },
      'insp-ambiente': {
        titulo: 'Lighting, ventilation and housekeeping',
        descricao: 'Assess the environmental and fire protection conditions of the room.',
        detalhes: [
          'Adequate lighting and emergency lighting',
          'Ventilation/exhaust unobstructed',
          'General cleanliness and no foreign objects',
          'No leaks/moisture or animal entry',
          'Suitable extinguisher, charged and within its expiration date',
        ],
        acao: 'Assess item',
      },
      'insp-laudo': {
        titulo: 'Issue report',
        descricao: 'Complete the inspection and generate the substation compliance verdict.',
        acao: 'Complete inspection',
      },
    },
  },
}

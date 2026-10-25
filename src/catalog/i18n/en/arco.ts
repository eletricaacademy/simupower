import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `arco-eletrico` em inglês, por id de passo. */
export const EN_ARCO: Record<string, TraducaoEnsaio> = {
  'arco-eletrico': {
    nome: 'Arc flash analysis',
    norma: 'IEEE 1584 · NFPA 70E · NR-10',
    steps: {
      'af-seguranca': {
        titulo: 'Risk assessment (NR-10)',
        descricao:
          'Before any energized work: confirm the documentation review, the barricading of the work area and the need for an arc flash study.',
        acao: 'Confirm assessment',
        norma: 'NR-10 · NFPA 70E',
      },
      'af-tensao': {
        titulo: 'System voltage',
        descricao: 'Select the nominal voltage of the bus under study.',
        acao: 'Set voltage',
      },
      'af-corrente': {
        titulo: 'Short-circuit current',
        descricao:
          'Enter the bolted fault current available at the point, taken from the short-circuit study.',
        acao: 'Set Ibf',
      },
      'af-tempo': {
        titulo: 'Clearing time',
        descricao:
          'Total arc clearing time = protection operating time + circuit breaker opening time. The shorter it is, the lower the energy.',
        acao: 'Set time',
      },
      'af-config': {
        titulo: 'Configuration and distance',
        descricao:
          'Set the working distance, the gap between conductors and whether the arc occurs in a box (cubicle) or in open air.',
        acao: 'Set configuration',
      },
      'af-calcular': {
        titulo: 'Calculate incident energy',
        descricao:
          'Calculates the incident energy (cal/cm²), the arc flash boundary (AFB) and the PPE category per IEEE 1584 / NFPA 70E.',
        acao: 'Calculate arc flash',
      },
      'af-epi': {
        titulo: 'Select PPE and label',
        descricao:
          'Based on the category, select the appropriate PPE and apply the arc flash label to the equipment.',
        acao: 'Finish',
      },
    },
  },
}

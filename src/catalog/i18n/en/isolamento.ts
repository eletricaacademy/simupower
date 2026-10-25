import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `resistencia-isolamento` em inglês, por id de passo. */
export const EN_ISOLAMENTO: Record<string, TraducaoEnsaio> = {
  'resistencia-isolamento': {
    nome: 'Insulation resistance',
    norma: 'IEEE Std 43 · NBR / IEC 60034-27',
    steps: {
      's1-loto': {
        titulo: 'Safety (LOTO)',
        descricao: 'Confirm that the equipment is de-energized and locked/tagged out before any contact.',
        acao: 'Confirm lockout',
        norma: 'NR-10 · LOTO',
      },
      's2-descarga-inicial': {
        titulo: 'Initial discharge',
        descricao: 'Momentarily ground the terminals to drain residual charge and stored capacitance.',
        acao: 'Ground terminals',
      },
      's3-tensao': {
        titulo: 'Test voltage',
        descricao: 'Select the voltage. For a low-voltage motor, the standard value is 500 V.',
        acao: 'Set voltage',
      },
      's4-earth': {
        titulo: 'Connect EARTH (black)',
        descricao: "Connect the black test lead (E) to the motor's grounded frame.",
        acao: 'Connect EARTH',
      },
      's5-line': {
        titulo: 'Connect LINE (red)',
        descricao: 'Connect the red test lead (L) to the terminal of the winding under test.',
        acao: 'Connect LINE',
      },
      's6-test': {
        titulo: 'Apply TEST (60 s)',
        descricao:
          'Energize for 60 s. The reading rises due to dielectric absorption. We capture R(30 s) and R(60 s), calculate DAR, PI and R@40 °C and display the verdict.',
        acao: 'Start TEST',
      },
      's7-descarga-final': {
        titulo: 'Final discharge',
        descricao: 'Discharge the equipment before removing the test leads. Never touch energized terminals.',
        acao: 'Discharge',
      },
    },
  },
}

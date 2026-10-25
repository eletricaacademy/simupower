import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `spda-estrutural` em inglês, por id de passo. */
export const EN_ESTRUTURAL: Record<string, TraducaoEnsaio> = {
  'spda-estrutural': {
    nome: 'Natural / structural LPS',
    norma: 'ABNT NBR 5419-3:2026 · Annex F',
    steps: {
      'estrutural-explorar': {
        titulo: 'Explore the structure and connect the instrument',
        descricao: 'Compare the exposed rebar with access through the Aterrinsert points in the finished warehouse.',
        acao: 'Explore',
        norma: 'ABNT NBR 5419-3:2026',
      },
    },
  },
}

import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `spda-estrutural` em espanhol, por id de passo. */
export const ES_ESTRUTURAL: Record<string, TraducaoEnsaio> = {
  'spda-estrutural': {
    nome: 'SPCR natural / estructural',
    norma: 'ABNT NBR 5419-3:2026 · Anexo F',
    steps: {
      'estrutural-explorar': {
        titulo: 'Explorar la estructura y conectar el instrumento',
        descricao: 'Compare las armaduras expuestas y el acceso por los Aterrinsert en la nave terminada.',
        acao: 'Explorar',
        norma: 'ABNT NBR 5419-3:2026',
      },
    },
  },
}

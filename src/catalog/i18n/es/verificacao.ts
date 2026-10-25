import type { TraducaoEnsaio } from '../localizar'

/**
 * Catálogo do ensaio `verificacao-5410` em espanhol. O procedimento ainda não tem
 * passos (`steps: []` no PT): os ensaios do Fluke 1662 vêm de
 * `verificacaoTestes.ts` e são traduzidos no namespace `verificacao` da UI.
 */
export const ES_VERIFICACAO: Record<string, TraducaoEnsaio> = {
  'verificacao-5410': {
    nome: 'Verificación de instalaciones (NBR 5410 — Sección 7)',
    norma: 'NBR 5410 · Sección 7',
  },
}

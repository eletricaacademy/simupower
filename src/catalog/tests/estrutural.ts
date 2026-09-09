import type { TestProcedure } from '../types'
export const estruturalProcedure: TestProcedure = {
  id: 'spda-estrutural', nome: 'SPDA natural / estrutural',
  norma: 'ABNT NBR 5419-3:2026 · ambiente em desenvolvimento',
  instrumento: 'terrometro', engineRef: 'spda', modo: 'spda-estrutural',
  tensoes: [], tensaoPadrao: 0, duracaoS: 0,
  // ⚠ REVISAR COM O PABLO: validar método e limites na edição 2026 antes de liberar medições.
  steps: [{ id: 'estrutural-explorar', titulo: 'Explorar a estrutura e conectar o instrumento',
    descricao: 'Compare ferragens expostas e acesso pelos Aterrinsert no galpão pronto.',
    acao: 'Explorar', norma: 'ABNT NBR 5419-3:2026' }],
}

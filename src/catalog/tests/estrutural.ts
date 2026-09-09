import type { TestProcedure } from '../types'
export const estruturalProcedure: TestProcedure = {
  id: 'spda-estrutural', nome: 'SPDA natural / estrutural',
  norma: 'ABNT NBR 5419-3:2026 · Anexo F',
  instrumento: 'terrometro', engineRef: 'spda', modo: 'spda-estrutural',
  tensoes: [], tensaoPadrao: 0, duracaoS: 0,
  // Fonte: PDF de 2026 fornecido por Pablo, páginas impressas 77–82; F.1 e F.4.
  steps: [{ id: 'estrutural-explorar', titulo: 'Explorar a estrutura e conectar o instrumento',
    descricao: 'Compare ferragens expostas e acesso pelos Aterrinsert no galpão pronto.',
    acao: 'Explorar', norma: 'ABNT NBR 5419-3:2026' }],
}

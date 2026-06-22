import type { TestProcedure } from '../types'

/**
 * Ensaio de RESISTÊNCIA DE ISOLAMENTO com megômetro — 7 passos guiados.
 *
 * Travas: o passo 6 (TEST) só habilita com 1–5 cumpridos. O modo instrutor
 * troca condição e temperatura sem alterar esta definição.
 */
export const insulationProcedure: TestProcedure = {
  id: 'resistencia-isolamento',
  nome: 'Resistência de Isolamento',
  norma: 'IEEE Std 43 · NBR / IEC 60034-27',
  instrumento: 'megger',
  engineRef: 'insulation',
  tensoes: [250, 500, 1000, 2500],
  tensaoPadrao: 500,
  duracaoS: 60,
  steps: [
    {
      id: 's1-loto',
      titulo: 'Segurança (LOTO)',
      descricao:
        'Confirme a desenergização e o bloqueio/etiquetagem do equipamento antes de qualquer contato.',
      acao: 'Confirmar bloqueio',
      norma: 'NR-10 · LOTO',
    },
    {
      id: 's2-descarga-inicial',
      titulo: 'Descarga inicial',
      descricao:
        'Aterre momentaneamente os terminais para drenar cargas residuais e capacitância acumulada.',
      acao: 'Aterrar terminais',
      requer: ['s1-loto'],
    },
    {
      id: 's3-tensao',
      titulo: 'Tensão de ensaio',
      descricao:
        'Selecione a tensão. Para motor de baixa tensão, o padrão é 500 V.',
      acao: 'Definir tensão',
      requer: ['s2-descarga-inicial'],
      control: 'voltage',
    },
    {
      id: 's4-earth',
      titulo: 'Conectar EARTH (preta)',
      descricao: 'Conecte a ponteira preta (E) na carcaça aterrada do motor.',
      acao: 'Conectar EARTH',
      requer: ['s3-tensao'],
      control: 'connect-earth',
      focoAnchorId: 'carcaca-terra',
    },
    {
      id: 's5-line',
      titulo: 'Conectar LINE (vermelha)',
      descricao:
        'Conecte a ponteira vermelha (L) no terminal do enrolamento sob ensaio.',
      acao: 'Conectar LINE',
      requer: ['s4-earth'],
      control: 'connect-line',
      focoAnchorId: 'borne-u',
    },
    {
      id: 's6-test',
      titulo: 'Aplicar TEST (60 s)',
      descricao:
        'Energize por 60 s. A leitura sobe pela absorção dielétrica. Capturamos R(30 s) e R(60 s), calculamos DAR, PI e R@40 °C e exibimos o veredito.',
      acao: 'Iniciar TEST',
      requer: ['s1-loto', 's2-descarga-inicial', 's3-tensao', 's4-earth', 's5-line'],
      control: 'run-test',
      focoAnchorId: 'borne-u',
    },
    {
      id: 's7-descarga-final',
      titulo: 'Descarga final',
      descricao:
        'Descarregue o equipamento antes de remover as ponteiras. Nunca toque os terminais energizados.',
      acao: 'Descarregar',
      requer: ['s6-test'],
    },
  ],
}

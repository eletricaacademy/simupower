import type { TestProcedure } from '../types'

/**
 * Ensaio de RESISTÊNCIA DE ATERRAMENTO pelo método da QUEDA DE POTENCIAL
 * (62%). Navegação manual; a medição é feita movendo a estaca de potencial.
 */
export const aterramentoProcedure: TestProcedure = {
  id: 'resistencia-aterramento',
  nome: 'Resistência de Aterramento',
  norma: 'NBR 5419 · IEEE 81 — Queda de Potencial',
  instrumento: 'terrometro',
  engineRef: 'aterramento',
  modo: 'aterramento',
  tensoes: [],
  tensaoPadrao: 0,
  duracaoS: 0,
  steps: [
    {
      id: 'at-seguranca',
      titulo: 'Segurança e preparação',
      descricao: 'Análise de risco e preparação do ensaio de aterramento.',
      detalhes: [
        'APR e EPI adequados',
        'Desconectar o eletrodo de descidas, se exigido pela norma',
        'Terrômetro calibrado e cabos/estacas em bom estado',
      ],
      cuidados: ['Cuidado com tensões de passo/toque durante a injeção de corrente.'],
      feito: 'Preparação concluída.',
      acao: 'Confirmar preparação',
      acaoTipo: 'confirmar',
      norma: 'NBR 5419',
    },
    {
      id: 'at-estaca-c',
      titulo: 'Cravar estaca de corrente (C)',
      descricao: 'Crave a estaca de corrente em linha reta, afastada do eletrodo (E) — tipicamente 30 a 50 m.',
      detalhes: ['Distância D suficiente (≥ 5× a dimensão da malha)', 'Estaca firme e em solo natural'],
      feito: 'Estaca de corrente (C) cravada.',
      acao: 'Cravar estaca C',
      acaoTipo: 'confirmar',
      requer: ['at-seguranca'],
    },
    {
      id: 'at-estaca-p',
      titulo: 'Cravar estaca de potencial (P)',
      descricao: 'Crave a estaca de potencial entre E e C, na mesma linha.',
      detalhes: ['P na linha reta entre E e C', 'Conexões firmes nos bornes do terrômetro'],
      feito: 'Estaca de potencial (P) cravada.',
      acao: 'Cravar estaca P',
      acaoTipo: 'confirmar',
      requer: ['at-estaca-c'],
    },
    {
      id: 'at-medir',
      titulo: 'Medir movendo a estaca P',
      descricao:
        'Mova a estaca de potencial e registre a leitura. A curva forma um platô no meio — a leitura a ~62% é a resistência verdadeira.',
      detalhes: ['Varrer P de ~10% a ~90% da distância E–C', 'Registrar a leitura em cada posição', 'Identificar o platô'],
      cuidados: ['Se não houver platô, aumente a distância D (acoplamento entre eletrodos).'],
      feito: 'Curva levantada — platô identificado a ~62%.',
      acao: 'Concluir medição',
      acaoTipo: 'confirmar',
      requer: ['at-estaca-p'],
    },
    {
      id: 'at-laudo',
      titulo: 'Resultado e veredito',
      descricao: 'Leia a resistência a 62% e compare com o limite de norma (NBR 5419: ≤ 10 Ω).',
      feito: 'Ensaio concluído.',
      acao: 'Emitir resultado',
      acaoTipo: 'confirmar',
      requer: ['at-medir'],
    },
  ],
}

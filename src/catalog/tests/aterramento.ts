import type { TestProcedure } from '../types'

/**
 * Ensaio de RESISTÊNCIA DE ATERRAMENTO pelo método da QUEDA DE POTENCIAL
 * (62%). Navegação manual; cada passo é acompanhado pela cena 3D. A medição é
 * feita MOVENDO a estaca de potencial (P) — a curva é levantada ponto a ponto.
 */
export const aterramentoProcedure: TestProcedure = {
  id: 'resistencia-aterramento',
  nome: 'Resistência de Aterramento',
  norma: 'NBR 15749 · IEEE 81 — Queda de Potencial',
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
      descricao: 'Análise de risco, verifique a área e prepare o ensaio de aterramento.',
      detalhes: [
        'APR e EPI adequados',
        'Verifique a área e o entorno do eletrodo',
        'Terrômetro calibrado e cabos/estacas em bom estado',
      ],
      cuidados: ['Cuidado com tensões de passo/toque durante a injeção de corrente.'],
      feito: 'Preparação concluída.',
      acao: 'Confirmar preparação',
      acaoTipo: 'confirmar',
      norma: 'NBR 15749',
      // visão geral do pátio (survey da área)
      vista: { pos: [7.0, 8.0, 5.0], target: [3.4, 0.6, 0.4] },
    },
    {
      id: 'at-terrometro',
      titulo: 'Posicionar o terrômetro',
      descricao:
        'Posicione o terrômetro de haste no ponto de ensaio e conecte o cabo E (verde) ao eletrodo/malha sob ensaio.',
      detalhes: ['Terrômetro sobre solo firme', 'Cabo E (verde) no eletrodo sob ensaio (E)'],
      feito: 'Terrômetro posicionado e cabo E conectado.',
      acao: 'Posicionar terrômetro',
      acaoTipo: 'confirmar',
      requer: ['at-seguranca'],
      vista: { pos: [2.48, 3.924, 1.19], target: [2.314, 0.488, 0.234] },
    },
    {
      id: 'at-estaca-c',
      titulo: 'Cravar estaca de corrente (C)',
      descricao:
        'Crave a estaca de corrente em linha reta, afastada do eletrodo (E), e conecte o cabo C (vermelho).',
      detalhes: ['Distância D suficiente (≥ 5× a dimensão da malha)', 'Estaca firme e em solo natural'],
      feito: 'Estaca de corrente (C) cravada e cabo C conectado.',
      acao: 'Cravar estaca C',
      acaoTipo: 'confirmar',
      requer: ['at-terrometro'],
      vista: { pos: [3.768, 5.26, 1.921], target: [3.53, 0.341, 0.552] },
    },
    {
      id: 'at-medir',
      titulo: 'Medir movendo a estaca P',
      descricao:
        'A estaca de potencial (P) NÃO fica fixa: mova-a entre E e C e registre a leitura em cada posição. A curva forma um platô no meio — a leitura a ~62% é a resistência verdadeira.',
      detalhes: [
        'Varrer P de ~10% a ~90% da distância E–C, registrando cada posição (mín. 3 pontos)',
        'Confirmar o platô: variar P ±5% e ver se a leitura se mantém (NBR 15749)',
        'A leitura na zona de patamar (~62%) é a resistência verdadeira',
      ],
      cuidados: ['Se não houver platô, aumente a distância D (acoplamento entre eletrodos).'],
      feito: 'Curva levantada — platô identificado a ~62%.',
      acao: 'Concluir medição',
      acaoTipo: 'confirmar',
      requer: ['at-estaca-c'],
      vista: { pos: [5.593, 4.08, 3.361], target: [3.53, 0.341, 0.552] },
    },
    {
      id: 'at-laudo',
      titulo: 'Resultado e veredito',
      descricao:
        'Leia a resistência a 62% (queda de potencial, NBR 15749). Recomendação da concessionária: aterramento ≤ 10 Ω.',
      feito: 'Ensaio concluído.',
      acao: 'Emitir resultado',
      acaoTipo: 'confirmar',
      requer: ['at-medir'],
      vista: { pos: [6.478, 8.352, 4.937], target: [2.659, 1.433, -0.261] },
    },
  ],
}

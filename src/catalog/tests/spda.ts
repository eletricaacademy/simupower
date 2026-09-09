import type { TestProcedure } from '../types'

/**
 * Ensaio de CONTINUIDADE DO SPDA — ABNT NBR 5419-3 (inspeção e manutenção).
 *
 * Navegação MANUAL (padrão dos módulos guiados): cada passo é acompanhado pela
 * cena 3D. A medição é feita TRECHO A TRECHO — captação, cada descida e a
 * equipotencialização ao BEP (ver `catalog/spdaPontos.ts`).
 *
 * ⚠ As `vista`s de câmera são PLACEHOLDERS — recalibrar com o capturador de
 * pose depois que o prédio 3D (Codex) estiver na cena.
 */
export const spdaProcedure: TestProcedure = {
  id: 'continuidade-spda',
  nome: 'Continuidade do SPDA',
  norma: 'NBR 5419-3 — Inspeção e manutenção do SPDA',
  instrumento: 'terrometro',
  engineRef: 'spda',
  modo: 'spda',
  tensoes: [],
  tensaoPadrao: 0,
  duracaoS: 0,
  steps: [
    {
      id: 'spda-seguranca',
      titulo: 'Segurança e condições do ensaio',
      descricao:
        'Faça a APR, confira as condições climáticas e prepare o acesso aos pontos de medição do SPDA.',
      detalhes: [
        'APR e EPI adequados (trabalho em altura, se houver acesso à cobertura)',
        'NÃO inspecionar com tempestade na região ou previsão de descargas atmosféricas',
        'Instrumento de continuidade calibrado, com cabos e garras em bom estado',
        'Identificar as descidas e localizar as caixas de inspeção',
      ],
      cuidados: [
        'O SPDA pode estar energizado por indução durante tempestades próximas — suspenda o ensaio.',
        'Acesso à cobertura exige sistema de proteção contra quedas (NR-35).',
      ],
      feito: 'Preparação e análise de risco concluídas.',
      acao: 'Confirmar preparação',
      acaoTipo: 'confirmar',
      norma: 'NBR 5419-3 · NR-35',
      vista: { pos: [18, 10, 18], target: [0, 4.5, 0] },
    },
    {
      id: 'spda-visual',
      titulo: 'Inspeção visual do SPDA',
      descricao:
        'Antes de medir, inspecione visualmente captação, descidas, conexões e caixas de inspeção. A continuidade confirma o que a vista levanta.',
      detalhes: [
        'Captação: captores fixos, anel íntegro, sem afrouxamento',
        'Descidas: condutor sem emendas desnecessárias e com fixação regular',
        'Conexões: sem corrosão, sem folga, protegidas contra intempéries',
        'Caixas de inspeção: acessíveis, conector desconectável em condições de uso',
      ],
      erros: [
        'Medir sem inspecionar: a leitura boa não garante fixação nem seção mínima.',
        'Ignorar corrosão na base da descida — ponto de falha mais comum.',
      ],
      feito: 'Inspeção visual registrada.',
      acao: 'Concluir inspeção visual',
      acaoTipo: 'confirmar',
      requer: ['spda-seguranca'],
      norma: 'NBR 5419-3 · 7 (inspeção)',
      vista: { pos: [12, 6, 12], target: [0, 3.5, 0] },
    },
    {
      id: 'spda-zerar',
      titulo: 'Preparar o instrumento (zerar pontas)',
      descricao:
        'Selecione a função CONTINUIDADE (baixa resistência) e ZERE as pontas de prova: encoste uma garra na outra e compense a resistência dos cabos.',
      detalhes: [
        'Função de continuidade com corrente de ensaio ≥ 200 mA',
        'Curto-circuitar as pontas e acionar a compensação (zero/REL)',
        'Sem zerar, os cabos somam ~0,13 Ω em TODAS as leituras',
      ],
      erros: ['Reprovar um trecho bom por esquecer de compensar as pontas de prova.'],
      feito: 'Pontas compensadas — instrumento pronto.',
      acao: 'Zerar as pontas',
      acaoTipo: 'confirmar',
      requer: ['spda-visual'],
      norma: 'NBR 5419-3 · Anexo (ensaios)',
      vista: { pos: [-8, 2.2, 6], target: [-6, 0.9, 2.2] },
    },
    {
      id: 'spda-medir',
      titulo: 'Medir a continuidade trecho a trecho',
      descricao:
        'Meça cada trecho do SPDA: anel de captação, cada descida (do captor à caixa de inspeção) e a ligação ao BEP. Selecione o trecho no instrumento e registre a leitura.',
      detalhes: [
        'Abrir o conector desconectável da caixa de inspeção para medir a descida isolada',
        'Trecho íntegro lê alguns miliohms; conexão ruim eleva a leitura',
        'Critério adotado: R ≤ 0,2 Ω conforme · 0,2–1,0 Ω atenção · > 1,0 Ω ou OL não conforme',
        'Medir TODOS os trechos previstos antes de emitir o laudo',
      ],
      cuidados: ['Refazer a medição com outra pressão de contato se a leitura oscilar muito.'],
      feito: 'Todos os trechos medidos.',
      acao: 'Concluir medições',
      acaoTipo: 'confirmar',
      requer: ['spda-zerar'],
      norma: 'NBR 5419-3 · 7 (ensaios de continuidade)',
      vista: { pos: [10, 3, 10], target: [0, 2, 0] },
    },
    {
      id: 'spda-laudo',
      titulo: 'Laudo de continuidade',
      descricao:
        'Consolide as leituras: trechos aprovados, não conformidades, causa provável e ação corretiva. O SPDA só é conforme com TODOS os trechos dentro do critério.',
      detalhes: [
        'Registrar leitura, data e instrumento utilizado por trecho',
        'Não conformidade exige correção e NOVA medição do trecho',
        'Periodicidade da inspeção conforme o nível de proteção (NBR 5419-3)',
      ],
      feito: 'Laudo emitido.',
      acao: 'Emitir laudo',
      acaoTipo: 'confirmar',
      requer: ['spda-medir'],
      norma: 'NBR 5419-3 · 7',
      vista: { pos: [16, 9, 16], target: [0, 4, 0] },
    },
  ],
}

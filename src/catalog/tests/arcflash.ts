import type { TestProcedure } from '../types'

/**
 * Estudo de ARCO ELÉTRICO (energia incidente) — IEEE 1584 / NFPA 70E / NR-10.
 * Fluxo guiado: o usuário define os parâmetros do sistema e calcula a energia
 * incidente, a fronteira de arco e a categoria de EPI. Modo 'arcflash'.
 */
export const arcflashProcedure: TestProcedure = {
  id: 'arco-eletrico',
  nome: 'Análise de Arco Elétrico',
  norma: 'IEEE 1584 · NFPA 70E · NR-10',
  instrumento: 'analisador',
  engineRef: 'arcflash',
  modo: 'arcflash',
  tensoes: [480, 4160, 13800],
  tensaoPadrao: 13800,
  duracaoS: 0,
  steps: [
    {
      id: 'af-seguranca',
      titulo: 'Análise de risco (NR-10)',
      descricao:
        'Antes de energizado: confirme a análise documental, a delimitação da área e a necessidade do estudo de arco.',
      acao: 'Confirmar análise',
      norma: 'NR-10 · NFPA 70E',
    },
    {
      id: 'af-tensao',
      titulo: 'Tensão do sistema',
      descricao: 'Selecione a tensão nominal do barramento sob estudo.',
      acao: 'Definir tensão',
      requer: ['af-seguranca'],
      control: 'af-tensao',
      focoAnchorId: 'frente',
    },
    {
      id: 'af-corrente',
      titulo: 'Corrente de curto-circuito',
      descricao:
        'Informe a corrente de curto presumida (bolted fault) no ponto, obtida do estudo de curto-circuito.',
      acao: 'Definir Icc',
      requer: ['af-tensao'],
      control: 'af-corrente',
    },
    {
      id: 'af-tempo',
      titulo: 'Tempo de eliminação',
      descricao:
        'Tempo total de extinção do arco = atuação da proteção + abertura do disjuntor. Quanto menor, menor a energia.',
      acao: 'Definir tempo',
      requer: ['af-corrente'],
      control: 'af-tempo',
    },
    {
      id: 'af-config',
      titulo: 'Configuração e distância',
      descricao:
        'Defina a distância de trabalho, o gap entre condutores e se o arco é em caixa (cubículo) ou ao ar livre.',
      acao: 'Definir configuração',
      requer: ['af-tempo'],
      control: 'af-config',
    },
    {
      id: 'af-calcular',
      titulo: 'Calcular energia incidente',
      descricao:
        'Calcula a energia incidente (cal/cm²), a fronteira de arco (AFB) e a categoria de EPI segundo IEEE 1584 / NFPA 70E.',
      acao: 'Calcular arco',
      requer: ['af-seguranca', 'af-tensao', 'af-corrente', 'af-tempo', 'af-config'],
      control: 'af-calcular',
      focoAnchorId: 'frente',
    },
    {
      id: 'af-epi',
      titulo: 'Definir EPI e etiqueta',
      descricao:
        'Com base na categoria, defina o EPI adequado e registre a etiqueta de arco no equipamento.',
      acao: 'Concluir',
      requer: ['af-calcular'],
    },
  ],
}

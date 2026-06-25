/**
 * verificacaoTestes.ts — Fundação de dados dos ENSAIOS da NBR 5410, Seção 7
 * (verificação de instalações de baixa tensão), executados com o instrumento
 * multifunção **Fluke 1662**.
 *
 * Orientado a dados (padrão do projeto): a engine/HUD/animação do multímetro
 * consomem estas definições. Critérios resumidos da NBR 5410 — revisar/ajustar
 * com o Pablo antes de "travar" os limites de aprovação.
 *
 * Fonte das funções: manual do Fluke 1662/1663/1664 FC (seletor rotativo).
 */

// ─── Funções do seletor rotativo do Fluke 1662 ────────────────────────────────
export type FlukeFuncao =
  | 'tensao' // V — tensão CA, frequência, verificação de polaridade
  | 'isolamento' // Riso — resistência de isolamento (50/100/250/500/1000 V CC)
  | 'continuidade' // RLO — continuidade/baixa resistência (200 mA, zera pontas)
  | 'loop' // Zs — impedância de loop (linha-terra/linha-neutro) → PEFC/PSC
  | 'rcd-tempo' // Δt — tempo de disparo do DR (×½, ×1, ×5; 0°/180°)
  | 'rcd-rampa' // ΔI — corrente de disparo do DR (teste de rampa)

export interface FlukeFuncaoInfo {
  id: FlukeFuncao
  simbolo: string
  nome: string
  mede: string
  unidade: string
}

/** Funções do Fluke 1662 (posições do seletor), confirmadas no manual. */
export const FLUKE_FUNCOES: FlukeFuncaoInfo[] = [
  { id: 'tensao', simbolo: 'V', nome: 'Tensão / Polaridade', mede: 'Tensão CA, frequência e polaridade dos fios', unidade: 'V' },
  { id: 'isolamento', simbolo: 'MΩ', nome: 'Resistência de isolamento', mede: 'Isolamento entre condutores e à terra', unidade: 'MΩ' },
  { id: 'continuidade', simbolo: 'Ω', nome: 'Continuidade (RLO)', mede: 'Resistência do condutor de proteção/equipotencialização', unidade: 'Ω' },
  { id: 'loop', simbolo: 'ZI', nome: 'Impedância de loop (Zs)', mede: 'Impedância do percurso de falta → corrente de falta prevista (PEFC/PSC)', unidade: 'Ω' },
  { id: 'rcd-tempo', simbolo: 'Δt', nome: 'Tempo de disparo do DR', mede: 'Tempo de atuação do dispositivo DR (RCD)', unidade: 'ms' },
  { id: 'rcd-rampa', simbolo: 'ΔI', nome: 'Corrente de disparo do DR', mede: 'Corrente de atuação do DR (teste de rampa)', unidade: 'mA' },
]

// ─── Pontos de ensaio no QUADRO (mundo) ──────────────────────────────────────
/**
 * Pontos no quadro onde o Fluke conecta para os ensaios do quadro (fornecidos
 * pelo Pablo). Usados quando o procedimento passar das tomadas para o quadro.
 */
export const QUADRO_PONTOS = {
  barramentoTerra: [6.22, 2.34, 4.34] as [number, number, number], // terra (verde)
  barramentoFase: [6.22, 2.08, 4.56] as [number, number, number], // fase (vermelho) — testes gerais
  pontoDR: [6.22, 1.82, 4.39] as [number, number, number], // DR — testes de DR (rcd): vermelho vai aqui
  barramentoNeutro: [6.22, 2.3, 4.77] as [number, number, number], // neutro (azul) — +2cm à direita (z 4.75→4.77)
}

// ─── Ensaios da NBR 5410 §7 ──────────────────────────────────────────────────
export type AlvoEnsaio = 'tomada' | 'quadro' | 'condutor-protecao' | 'instalacao'

export interface EnsaioVerificacao {
  id: string
  nome: string
  /** Item da NBR 5410 (Seção 7 — verificação final). */
  norma: string
  /** Função do Fluke 1662 usada. */
  funcao: FlukeFuncao
  /** O que o ensaio verifica. */
  descricao: string
  /** Parâmetro de ensaio (ex.: tensão de teste, corrente nominal do DR). */
  parametro: string
  unidade: string
  /** Critério de aceitação (resumo NBR 5410). */
  criterio: string
  alvo: AlvoEnsaio
}

/**
 * Sequência dos ENSAIOS (NBR 5410 §7.3.2) executáveis com o Fluke 1662.
 * Ordem usual de campo: visual → continuidade → isolamento → polaridade →
 * seccionamento automático (Zs + DR) → aterramento.
 */
export const ENSAIOS_VERIFICACAO: EnsaioVerificacao[] = [
  {
    id: 'continuidade',
    nome: 'Continuidade dos condutores de proteção',
    norma: 'NBR 5410 — 7.3.2 (continuidade)',
    funcao: 'continuidade',
    descricao:
      'Verificar a continuidade do condutor de proteção (PE) e das ligações de equipotencialização entre o quadro e cada tomada.',
    parametro: 'Ensaio 200 mA, pontas zeradas',
    unidade: 'Ω',
    criterio: 'Baixa resistência, condutor contínuo (tipicamente < 1–2 Ω conforme comprimento/seção).',
    alvo: 'condutor-protecao',
  },
  {
    id: 'isolamento',
    nome: 'Resistência de isolamento',
    norma: 'NBR 5410 — 7.3.2 (isolamento) · Tabela 61',
    funcao: 'isolamento',
    descricao:
      'Medir a resistência de isolamento entre condutores vivos e entre vivos e a terra, com a instalação desenergizada.',
    parametro: 'Tensão de ensaio 500 V CC (circuitos até 500 V)',
    unidade: 'MΩ',
    criterio: 'R_iso ≥ 1,0 MΩ (até 500 V). SELV/PELV: 250 V, ≥ 0,5 MΩ. Acima de 500 V: 1000 V, ≥ 1,0 MΩ.',
    alvo: 'instalacao',
  },
  {
    id: 'polaridade',
    nome: 'Ensaio de polaridade',
    norma: 'NBR 5410 — 7.3.2 (polaridade)',
    funcao: 'tensao',
    descricao:
      'Confirmar fase, neutro e terra nos terminais corretos da tomada (fase não invertida, PE presente).',
    parametro: 'Verificação de tensão/polaridade',
    unidade: 'V',
    criterio: 'Fase e neutro nos terminais corretos; PE presente; tensão dentro da faixa nominal.',
    alvo: 'tomada',
  },
  {
    id: 'loop-zs',
    nome: 'Impedância de loop (seccionamento automático)',
    norma: 'NBR 5410 — 7.3.2 (seccionamento automático) · 5.1.2.2.4',
    funcao: 'loop',
    descricao:
      'Medir a impedância do percurso de falta fase-terra (Zs) na tomada e calcular a corrente de falta prevista, para confirmar o seccionamento no tempo exigido.',
    parametro: 'Modo sem disparo (não dispara o DR)',
    unidade: 'Ω',
    criterio: 'Zs × Ia ≤ U0: a corrente de falta deve atuar a proteção no tempo da Tabela 24/25 (TN ≤ 0,4 s em circuitos terminais).',
    alvo: 'tomada',
  },
  {
    id: 'rcd-tempo',
    nome: 'Tempo de disparo do DR',
    norma: 'NBR 5410 — 7.3.2 (ensaio funcional do DR) · 6.3.4.2',
    funcao: 'rcd-tempo',
    descricao:
      'Aplicar a corrente diferencial nominal (IΔn) e múltiplos (×½, ×1, ×5) para medir o tempo de atuação do DR que protege a tomada.',
    parametro: 'IΔn 30 mA, tipo A/AC, ×½ / ×1 / ×5, 0°/180°',
    unidade: 'ms',
    criterio: '×½: não dispara. ×1: ≤ 300 ms (DR geral). ×5: ≤ 40 ms.',
    alvo: 'tomada',
  },
  {
    id: 'rcd-rampa',
    nome: 'Corrente de disparo do DR',
    norma: 'NBR 5410 — 7.3.2 (ensaio funcional do DR)',
    funcao: 'rcd-rampa',
    descricao:
      'Elevar a corrente diferencial em rampa até o DR atuar, medindo a corrente real de disparo.',
    parametro: 'Rampa até IΔn (30 mA)',
    unidade: 'mA',
    criterio: 'Disparo entre 50% e 100% de IΔn (15–30 mA para DR de 30 mA).',
    alvo: 'tomada',
  },
  {
    id: 'aterramento',
    nome: 'Resistência de aterramento',
    norma: 'NBR 5410 — 7.3.2 (resistência de aterramento)',
    funcao: 'loop',
    descricao:
      'Medir a resistência do eletrodo de aterramento pelo método de loop (sem estacas), a partir de uma tomada.',
    parametro: 'Método de loop (RE)',
    unidade: 'Ω',
    criterio: 'Compatível com o esquema de aterramento e o DR (ex.: TT: RA × IΔn ≤ 50 V).',
    alvo: 'instalacao',
  },
]

/**
 * spdaPontos.ts — Fundação de dados dos TRECHOS ensaiados na continuidade do
 * SPDA (ABNT NBR 5419-3). Orientado a dados, como o resto do projeto: engine,
 * store, HUD e cena 3D consomem estas definições.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ CONTRATO CLAUDE × CODEX — este arquivo é a fronteira entre os dois.       ║
 * ║                                                                          ║
 * ║ • CLAUDE (ferramenta): tipos, ids, física (comprimento/material/seção/    ║
 * ║   conexões/defeito), textos e critérios. NÃO mexe em `pos`/`posOrigem`.   ║
 * ║ • CODEX (cena/ambiente): APENAS os campos `pos`, `posOrigem` e `vista`,   ║
 * ║   calibrados no prédio 3D real (`models/spda-predio.glb`).                ║
 * ║                                                                          ║
 * ║ Regra: NÃO renomear ids nem remover campos — o HUD e a engine dependem.   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Convenção de mundo (igual ao resto do projeto): 1 unidade ≈ 1 metro, +Y para
 * cima, base do prédio em y = 0.
 */
import type { Vec3, Vista } from './types'

/** Material do condutor do SPDA (NBR 5419-3, Tabela 6). */
export type MaterialCondutor = 'cobre-nu' | 'aluminio' | 'aco-galvanizado'

/** Defeito plantado no trecho (só aparece no cenário 'com-defeitos'). */
export type TipoDefeito = 'emenda-frouxa' | 'corrosao' | 'rompido'

/** Subsistema do SPDA a que o trecho pertence. */
export type SubsistemaSPDA = 'captacao' | 'descida' | 'equipotencializacao'

export interface PontoSPDA {
  id: string
  nome: string
  subsistema: SubsistemaSPDA
  /** Item da NBR 5419 correspondente (exibido no HUD). */
  norma: string
  /** Extremidade onde fica a garra fixa do instrumento. */
  de: string
  /** Extremidade onde o operador encosta a ponta de prova. */
  ate: string
  /** Comprimento do percurso condutor (m). */
  comprimentoM: number
  material: MaterialCondutor
  /** Seção nominal (mm²) — mínimos da NBR 5419-3: Cu 35, Al 70, aço 50. */
  secaoMm2: number
  /** Nº de conexões/emendas no percurso (cada uma soma resistência de contato). */
  conexoes: number
  /** Defeito plantado (cenário 'com-defeitos'); ausente = trecho íntegro. */
  defeito?: TipoDefeito
  /** O que o aluno deve observar na inspeção visual deste trecho. */
  dica: string

  // ── CAMPOS DA CENA 3D — CALIBRAR (CODEX) ────────────────────────────────
  /** Ponto de teste na cena (onde a ponta de prova encosta). */
  pos: Vec3
  /** Outra extremidade do trecho (garra fixa / referência). */
  posOrigem: Vec3
  /** Vista de câmera do trecho (gravada com o capturador de pose do HUD). */
  vista?: Vista
}

/**
 * Prédio de referência (placeholder até o GLB do Codex): 12 m × 8 m de base,
 * 9 m de altura, 4 descidas nos cantos. Estas medidas alimentam a cena
 * procedural provisória em `scene/SpdaElements.tsx`.
 */
export const PREDIO = {
  largura: 12,
  profundidade: 8,
  altura: 9,
  /** Altura da caixa de inspeção (ponto de medição na descida). */
  alturaCaixa: 0.7,
} as const

/**
 * Trechos ensaiados. A ordem é a ordem de medição sugerida no HUD.
 * ⚠ `pos`/`posOrigem` são PLACEHOLDERS derivados de PREDIO — Codex recalibra
 * sobre o modelo real.
 */
export const SPDA_PONTOS: PontoSPDA[] = [
  {
    id: 'capt-anel',
    nome: 'Anel de captação (malha superior)',
    subsistema: 'captacao',
    norma: 'NBR 5419-3 · 5.2 (subsistema de captação)',
    de: 'Captor A (canto noroeste)',
    ate: 'Captor B (canto nordeste)',
    comprimentoM: 12,
    material: 'cobre-nu',
    secaoMm2: 35,
    conexoes: 3,
    dica: 'Verifique fixações, emendas do anel e distância entre captores.',
    pos: [6, 9.3, -4],
    posOrigem: [-6, 9.3, -4],
  },
  {
    id: 'desc-d1',
    nome: 'Descida D1 — fachada norte/oeste',
    subsistema: 'descida',
    norma: 'NBR 5419-3 · 5.3 (subsistema de descida)',
    de: 'Anel de captação (canto NO)',
    ate: 'Caixa de inspeção D1',
    comprimentoM: 9.4,
    material: 'cobre-nu',
    secaoMm2: 35,
    conexoes: 4,
    dica: 'Condutor sem emendas desnecessárias, fixado a cada 1,0 m.',
    pos: [-6, 0.7, -4],
    posOrigem: [-6, 9.3, -4],
  },
  {
    id: 'desc-d2',
    nome: 'Descida D2 — fachada norte/leste',
    subsistema: 'descida',
    norma: 'NBR 5419-3 · 5.3 (subsistema de descida)',
    de: 'Anel de captação (canto NE)',
    ate: 'Caixa de inspeção D2',
    comprimentoM: 9.4,
    material: 'cobre-nu',
    secaoMm2: 35,
    conexoes: 4,
    dica: 'Confira a caixa de inspeção: conector desconectável para medição.',
    pos: [6, 0.7, -4],
    posOrigem: [6, 9.3, -4],
  },
  {
    id: 'desc-d3',
    nome: 'Descida D3 — fachada sul/leste',
    subsistema: 'descida',
    norma: 'NBR 5419-3 · 5.3 (subsistema de descida)',
    de: 'Anel de captação (canto SE)',
    ate: 'Caixa de inspeção D3',
    comprimentoM: 9.4,
    material: 'cobre-nu',
    secaoMm2: 35,
    conexoes: 5,
    defeito: 'emenda-frouxa',
    dica: 'Emenda no meio da descida — ponto clássico de aperto insuficiente.',
    pos: [6, 0.7, 4],
    posOrigem: [6, 9.3, 4],
  },
  {
    id: 'desc-d4',
    nome: 'Descida D4 — fachada sul/oeste',
    subsistema: 'descida',
    norma: 'NBR 5419-3 · 5.3 (subsistema de descida)',
    de: 'Anel de captação (canto SO)',
    ate: 'Caixa de inspeção D4',
    comprimentoM: 9.4,
    material: 'cobre-nu',
    secaoMm2: 35,
    conexoes: 4,
    defeito: 'corrosao',
    dica: 'Trecho exposto à maresia/umidade — procure oxidação verde no conector.',
    pos: [-6, 0.7, 4],
    posOrigem: [-6, 9.3, 4],
  },
  {
    id: 'eq-bep',
    nome: 'Equipotencialização — caixa D1 ao BEP',
    subsistema: 'equipotencializacao',
    norma: 'NBR 5419-3 · 6.2 (equipotencialização) · NBR 5410',
    de: 'Caixa de inspeção D1',
    ate: 'BEP — barramento de equipotencialização principal',
    comprimentoM: 6,
    material: 'cobre-nu',
    secaoMm2: 50,
    conexoes: 3,
    dica: 'A ligação do SPDA ao BEP é obrigatória: sem ela, não há equipotencial.',
    pos: [-6.8, 0.9, 2.2],
    posOrigem: [-6, 0.7, -4],
  },
]

/** Acesso por id (HUD/cena). */
export function getPontoSPDA(id: string): PontoSPDA | undefined {
  return SPDA_PONTOS.find((p) => p.id === id)
}

/** Rótulo curto do subsistema (chips do HUD). */
export const ROTULO_SUBSISTEMA: Record<SubsistemaSPDA, string> = {
  captacao: 'Captação',
  descida: 'Descida',
  equipotencializacao: 'Equipotencial',
}

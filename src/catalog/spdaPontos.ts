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
export type SubsistemaSPDA = 'captacao' | 'descida' | 'aterramento' | 'equipotencializacao'

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
  /** Roteiro aprovado por Pablo: duas caixas, acima/abaixo do seccionamento. */
  nivel?: 'superior' | 'inferior' | 'bep'
  par?: string
  grupo?: 'Vizinhas' | 'Cruzadas' | 'BEP'
  /** Dois percursos do anel em paralelo, além do comprimento comum em série. */
  ramos?: { comprimentoM: number; conexoes: number }[]

  // ── CAMPOS DA CENA 3D — CALIBRAR (CODEX) ────────────────────────────────
  /** Ponto de teste na cena (onde a ponta de prova encosta). */
  pos: Vec3
  /** Outra extremidade do trecho (garra fixa / referência). */
  posOrigem: Vec3
  /** Vista de câmera do trecho (gravada com o capturador de pose do HUD). */
  vista?: Vista
}

/**
 * Edificação do GLB: 12 m × 8 m de base, 9 m de altura. As mesmas medidas
 * sustentam o fallback procedural quando não há modelPath.
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
 * `pos` capturadas por pick no GLB em 2026-09-08; vistas capturadas no HUD.
 * Referências superiores seguem os nós do anel modelado em metros.
 */
export const SPDA_PONTOS_LEGADO: PontoSPDA[] = [
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
    pos: [6.21, 9.36, -4.27],
    posOrigem: [-6.25, 9.35, -4.25],
    vista: { pos: [10, 12, -10], target: [6.25, 9.35, -4.25] },
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
    pos: [-6.28, 0.7, -4.35],
    posOrigem: [-6.25, 9.35, -4.25],
    vista: { pos: [-7.5, 1.5, -7], target: [-6.25, 0.7, -4.35] },
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
    pos: [6.26, 0.7, -4.35],
    posOrigem: [6.25, 9.35, -4.25],
    vista: { pos: [7.5, 1.5, -7], target: [6.25, 0.7, -4.35] },
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
    pos: [6.27, 0.7, 4.35],
    posOrigem: [6.25, 9.35, 4.25],
    vista: { pos: [7.5, 1.5, 7], target: [6.25, 0.7, 4.35] },
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
    pos: [-6.26, 0.7, 4.35],
    posOrigem: [-6.25, 9.35, 4.25],
    vista: { pos: [-7.5, 1.5, 7], target: [-6.25, 0.7, 4.35] },
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
    pos: [-6.28, 0.92, 1.49],
    posOrigem: [-6.28, 0.7, -4.35],
    vista: { pos: [-9, 1.6, 2.5], target: [-6.28, 0.9, 1.5] },
  },
]

/** Acesso por id (HUD/cena). */
export function getPontoSPDA(id: string): PontoSPDA | undefined {
  return SPDA_PONTOS.find((p) => p.id === id) ?? SPDA_PONTOS_LEGADO.find(p => p.id === id)
}

/** Rótulo curto do subsistema (chips do HUD). */
export const ROTULO_SUBSISTEMA: Record<SubsistemaSPDA, string> = {
  captacao: 'Captação',
  descida: 'Descida',
  aterramento: 'Continuidade do aterramento',
  equipotencializacao: 'Equipotencial',
}

/** Revisão autorizada por Pablo: legado preservado para referência, fora do roteiro ativo. */
export const CAIXAS_SPDA = [
  [-6.25, -4.25], [6.25, -4.25], [6.25, 4.25], [-6.25, 4.25],
] as const
export function contatoCaixa(indice: number, nivel: 'superior' | 'inferior'): Vec3 {
  // Pick nos oito terminais do GLB em 09/09; o ponto é a face do cobre, não o parafuso.
  const superiores: Vec3[] = [[-6.31, 0.87, -4.35], [6.22, 0.85, -4.35], [6.22, 0.86, 4.35], [-6.26, 0.88, 4.35]]
  const inferiores: Vec3[] = [[-6.29, 0.56, -4.35], [6.22, 0.56, -4.35], [6.21, 0.56, 4.35], [-6.26, 0.57, 4.35]]
  return (nivel === 'superior' ? superiores : inferiores)[indice]
}
const PARES = [[0, 1, 12.5], [1, 2, 8.5], [2, 3, 12.5], [3, 0, 8.5], [0, 2, 21], [1, 3, 21]] as const
export const SPDA_PONTOS: PontoSPDA[] = PARES.flatMap(([a, b, percurso], i) =>
  (['superior', 'inferior'] as const).map(nivel => {
    const pos = contatoCaixa(b, nivel), posOrigem = contatoCaixa(a, nivel)
    const superior = nivel === 'superior'
    const par = `D${a + 1}–D${b + 1}`
    return {
      id: `d${a + 1}-d${b + 1}-${superior ? 'sup' : 'inf'}`, par, nivel,
      grupo: i < 4 ? 'Vizinhas' : 'Cruzadas', nome: `${par} · ${superior ? 'Superior' : 'Inferior'}`,
      subsistema: superior ? 'captacao' : 'aterramento',
      norma: 'NBR 5419-3 · inspeção de continuidade · roteiro definido por Pablo',
      de: `D${a + 1} — terminal ${nivel}`, ate: `D${b + 1} — terminal ${nivel}`,
      comprimentoM: superior ? 2 * (9.35 - 0.84) : 2 * 0.56,
      material: 'cobre-nu', secaoMm2: superior ? 35 : 50, conexoes: 4,
      ramos: [{ comprimentoM: percurso, conexoes: 2 }, { comprimentoM: 42 - percurso, conexoes: 2 }],
      defeito: superior && (a === 2 || b === 2) ? 'emenda-frouxa' : !superior && (a === 3 || b === 3) ? 'corrosao' : undefined,
      dica: superior ? 'Seccionamentos abertos: garras nos terminais superiores das duas caixas; caminho pela captação.' : 'Mova as duas garras para os terminais inferiores. Mede continuidade do anel enterrado, não resistência em relação ao solo.',
      pos, posOrigem,
      vista: { pos: [pos[0] + Math.sign(pos[0]) * 1.25, 1.5, pos[2] + Math.sign(pos[2]) * 2.65], target: [pos[0], 0.7, pos[2]] },
    } satisfies PontoSPDA
  }),
)
SPDA_PONTOS.push({
  ...SPDA_PONTOS_LEGADO.find(p => p.id === 'eq-bep')!,
  nome: 'D1–BEP · Sala elétrica', nivel: 'bep', grupo: 'BEP', par: 'D1–BEP',
  de: 'D1 — terminal inferior', ate: 'BEP interno, ao lado do QGBT',
  comprimentoM: 9.5, posOrigem: contatoCaixa(0, 'inferior'), pos: [-4.74, 1.23, 0.54],
  dica: 'Entre pela porta da fachada norte e verifique a ligação equipotencial ao BEP, ao lado do QGBT fechado.',
  vista: { pos: [-3.7, 1.8, -3.4], target: [-3.7, 1.3, 0.5] },
})

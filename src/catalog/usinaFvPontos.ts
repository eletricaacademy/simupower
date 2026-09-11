/**
 * usinaFvPontos.ts — Dados da USINA FOTOVOLTAICA DE SOLO (100 kW) do módulo
 * "Aterramento em usina fotovoltaica": arranjo, malha enterrada, pontos de
 * continuidade, pontos de toque/passo e a linha das estacas da queda de potencial.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ CONTRATO CLAUDE × CODEX — este arquivo é a fronteira entre os dois.       ║
 * ║                                                                          ║
 * ║ • CLAUDE (ferramenta): tipos, ids, dados elétricos (trechos, seções,      ║
 * ║   conexões, defeitos, frações de GPR), malha, textos e critérios.         ║
 * ║ • CODEX (cena/ambiente): APENAS os campos marcados `CALIBRAR (CODEX)` —   ║
 * ║   `pos` e `vista` dos pontos e `vistaPadrao`, recapturados no GLB real    ║
 * ║   com o pickMode e o capturador de pose do HUD (⚙ → Calibração).          ║
 * ║                                                                          ║
 * ║ A geometria abaixo (mesas, skid, trafo, SE, cerca) desenha o placeholder  ║
 * ║ procedural de `scene/UsinaFvElements.tsx`. O GLB deve respeitar as mesmas ║
 * ║ posições; se precisar movê-las, alinhar antes (a malha e as distâncias    ║
 * ║ elétricas derivam delas).                                                 ║
 * ║                                                                          ║
 * ║ Regra: NÃO renomear ids nem remover campos — engine, store e HUD dependem.║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Mundo: 1 unidade ≈ 1 metro, +Y para cima, solo em y = 0. NORTE = −Z: no
 * hemisfério sul os módulos ficam voltados para o norte, com a borda baixa ao
 * norte. O acesso (portão, estrada) fica ao sul (+Z).
 */
import type { Vec3, Vista } from './types'

// ─── Dados nominais da planta ────────────────────────────────────────────────

/**
 * Usina de solo de 100 kW (CA) com skid de inversores, transformador elevador
 * e subestação de entrada (cabine de medição e proteção) em média tensão.
 *
 * ⚠ REVISAR COM O PABLO: potência (o pedido citou 300 e corrigiu para 100 kW),
 * módulo de 555 Wp, 2 inversores de 50 kW, trafo de 112,5 kVA e ligação em
 * 13,8 kV são uma configuração típica adotada para o cenário, não um projeto.
 */
export const USINA = {
  potenciaCaKw: 100,
  moduloWp: 555,
  /** Mesa fixa 2P × 15: duas fileiras de módulos em retrato, 15 por fileira. */
  modulosPorFileira: 15,
  fileirasPorMesa: 2,
  mesas: 6,
  inversores: 2,
  inversorKw: 50,
  trafoKva: 112.5,
  tensaoMtKv: 13.8,
  tensaoBtV: 380,
  inclinacaoGraus: 20,
} as const

export const MODULOS_TOTAL = USINA.mesas * USINA.modulosPorFileira * USINA.fileirasPorMesa
/** Potência de pico do arranjo (kWp) — 180 × 555 Wp = 99,9 kWp. */
export const POTENCIA_DC_KWP = (MODULOS_TOTAL * USINA.moduloWp) / 1000

/** Módulo de 144 meias-células (m). */
export const MODULO = { comprimento: 2.278, largura: 1.134, espessura: 0.035, folga: 0.02 } as const

/** Mesa: comprimento ao longo de X, profundidade inclinada, altura da borda baixa. */
export const MESA = {
  comprimento: USINA.modulosPorFileira * MODULO.largura + (USINA.modulosPorFileira - 1) * MODULO.folga,
  profundidade: USINA.fileirasPorMesa * MODULO.comprimento + MODULO.folga,
  alturaBorda: 0.8,
} as const

export interface MesaFv {
  id: string
  nome: string
  /** Centro da mesa no solo (x, 0, z). */
  centro: Vec3
}

/** Seis mesas em 3 fileiras × 2 colunas; corredor central de 3 m e passo de 7,5 m. */
const COLUNAS_X = [-10.15, 10.15]
const FILEIRAS_Z = [-10, -2.5, 5]
export const MESAS_FV: MesaFv[] = FILEIRAS_Z.flatMap((z, f) =>
  COLUNAS_X.map((x, c) => ({ id: `M${f * 2 + c + 1}`, nome: `Mesa M${f * 2 + c + 1}`, centro: [x, 0, z] as Vec3 })),
)

/** Cerca perimetral (m). Portão na face sul (z = zMax). */
export const CERCA = { xMin: -22, xMax: 22, zMin: -16, zMax: 19, altura: 2.1 } as const
export const PORTAO = { x: -16, largura: 4 } as const

/** Skid de conversão: contêiner com os inversores e o QGBT CA. */
export const SKID = { centro: [-6, 0, 13.5] as Vec3, dimensoes: [6.06, 2.6, 2.44] as Vec3 }
/** Transformador elevador a óleo sobre base de concreto. */
export const TRAFO = { centro: [2.5, 0, 13.5] as Vec3, dimensoes: [1.6, 1.8, 1.2] as Vec3 }
/** Subestação de entrada: cabine de medição e proteção em alvenaria. */
export const SE = { centro: [13, 0, 16] as Vec3, dimensoes: [4, 3, 3] as Vec3 }
/** Poste da concessionária, fora da cerca, com a derivação em MT. */
export const POSTE_MT: Vec3 = [16, 0, 22]
/** Área com brita em volta do skid e do trafo (retângulo x/z). */
export const AREA_BRITA = { xMin: -10.5, xMax: 5.5, zMin: 10.8, zMax: 16.4 } as const

/**
 * BEP do skid (terminal de aterramento principal da usina): referência das
 * medições de continuidade. Face norte do contêiner.
 * CALIBRAR (CODEX): recapturar no GLB.
 */
export const BEP_SKID: Vec3 = [-4.2, 0.55, 12.2]

// ─── Malha de aterramento ────────────────────────────────────────────────────

/** Profundidade dos condutores da malha (m). */
export const PROFUNDIDADE_MALHA = 0.5

export interface CondutorMalha {
  id: string
  a: Vec3
  b: Vec3
  /** Anel externo de equalização da cerca (mitiga a tensão de toque no portão). */
  equalizacao?: boolean
}

const Y = -PROFUNDIDADE_MALHA
const ret = (id: string, x0: number, x1: number, z0: number, z1: number, equalizacao = false): CondutorMalha[] => [
  { id: `${id}-n`, a: [x0, Y, z0], b: [x1, Y, z0], equalizacao },
  { id: `${id}-l`, a: [x1, Y, z0], b: [x1, Y, z1], equalizacao },
  { id: `${id}-s`, a: [x1, Y, z1], b: [x0, Y, z1], equalizacao },
  { id: `${id}-o`, a: [x0, Y, z1], b: [x0, Y, z0], equalizacao },
]

/**
 * Malha interligada: anel interno sob o arranjo, transversais sob cada fileira
 * de mesas e sob skid/trafo/SE, longitudinal no corredor central, anel da SE e
 * anel externo de equalização a 1 m da cerca. Tudo em cobre nu 50 mm².
 * ⚠ REVISAR COM O PABLO: topologia didática, não dimensionamento (IEEE 80 /
 * NBR 15751 exigem estudo com corrente de falta e estratificação do solo).
 */
export const MALHA_FV: CondutorMalha[] = [
  ...ret('anel', -21, 21, -15, 18),
  ...FILEIRAS_Z.map((z, i) => ({ id: `transv-${i + 1}`, a: [-21, Y, z] as Vec3, b: [21, Y, z] as Vec3 })),
  { id: 'transv-skid', a: [-21, Y, 13.5], b: [21, Y, 13.5] },
  { id: 'longitudinal', a: [0, Y, -15], b: [0, Y, 18] },
  ...ret('anel-se', 10.5, 15.5, 14, 18),
  ...ret('equalizacao', CERCA.xMin - 1, CERCA.xMax + 1, CERCA.zMin - 1, CERCA.zMax + 1, true),
]

/** Hastes verticais (copperweld 3 m) nos cantos, no trafo, no skid e na SE. */
export const COMPRIMENTO_HASTE = 3
export const HASTES_FV: Vec3[] = [
  [-21, Y, -15], [21, Y, -15], [21, Y, 18], [-21, Y, 18],
  [CERCA.xMin - 1, Y, CERCA.zMin - 1], [CERCA.xMax + 1, Y, CERCA.zMin - 1],
  [CERCA.xMax + 1, Y, CERCA.zMax + 1], [CERCA.xMin - 1, Y, CERCA.zMax + 1],
  [2.5, Y, 13.5], [-6, Y, 13.5], [10.5, Y, 18], [15.5, Y, 14],
]

/** Comprimento total enterrado (condutores + hastes), usado na fórmula de Sverak. */
export function comprimentoEnterradoM(): number {
  const cabos = MALHA_FV.reduce((s, c) => s + Math.hypot(c.b[0] - c.a[0], c.b[2] - c.a[2]), 0)
  return cabos + HASTES_FV.length * COMPRIMENTO_HASTE
}

/** Área coberta pela malha (m²) — delimitada pelo anel externo de equalização. */
export const AREA_MALHA_M2 = (CERCA.xMax - CERCA.xMin + 2) * (CERCA.zMax - CERCA.zMin + 2)
/** Diagonal da malha (m) — referência para a distância da estaca de corrente. */
export const DIAGONAL_MALHA_M = Math.hypot(CERCA.xMax - CERCA.xMin + 2, CERCA.zMax - CERCA.zMin + 2)

// ─── Ensaio 1 · continuidade da equipotencialização ──────────────────────────

export type TipoDefeitoFv = 'anodizacao' | 'corrosao' | 'rompido'
export type GrupoContinuidade = 'Mesas' | 'Equipamentos' | 'Cerca'

export interface TrechoCondutor {
  comprimentoM: number
  secaoMm2: number
}

export interface PontoContinuidadeFv {
  id: string
  nome: string
  grupo: GrupoContinuidade
  norma: string
  /** Extremidade onde o operador conecta o terminal remoto. */
  ate: string
  /** Percurso condutor do BEP do skid até o ponto (malha + derivação). */
  trechos: TrechoCondutor[]
  /** Nº de conexões no percurso (conector, grampo, solda exotérmica). */
  conexoes: number
  /** Defeito plantado — só aparece no cenário "com defeitos". */
  defeito?: TipoDefeitoFv
  /** O que observar na inspeção visual deste ponto. */
  dica: string
  /** CALIBRAR (CODEX): ponto de conexão da garra na cena. */
  pos: Vec3
  /** CALIBRAR (CODEX): vista de câmera do ponto. */
  vista?: Vista
}

/** Percurso pela malha (Manhattan em planta) + subida/descida até o terminal. */
function percursoMalha(pos: Vec3): number {
  return Math.abs(pos[0] - BEP_SKID[0]) + Math.abs(pos[2] - BEP_SKID[2]) + 2 * PROFUNDIDADE_MALHA + 1
}

const vistaDe = (pos: Vec3, dz = 4): Vista => ({
  pos: [pos[0] + 2.2, pos[1] + 2.4, pos[2] + dz],
  target: [pos[0], pos[1], pos[2]],
})

/** Terminal de aterramento da mesa: pé da estrutura voltado ao corredor central. */
function terminalMesa(m: MesaFv): Vec3 {
  const lado = m.centro[0] < 0 ? 1 : -1
  return [m.centro[0] + lado * (MESA.comprimento / 2 - 0.3), 0.45, m.centro[2] + 1.2]
}

const DEFEITO_MESA: Record<string, TipoDefeitoFv | undefined> = { M4: 'anodizacao', M6: 'corrosao' }
const DICA_MESA: Record<string, string> = {
  M4: 'Grampo de aterramento sobre perfil anodizado: sem arruela serrilhada, a anodização isola.',
  M6: 'Conector da derivação exposto à umidade — procure oxidação e aperto.',
}

export const PONTOS_CONTINUIDADE_FV: PontoContinuidadeFv[] = [
  ...MESAS_FV.map((m) => {
    const pos = terminalMesa(m)
    return {
      id: m.id.toLowerCase(),
      nome: `${m.nome} — estrutura`,
      grupo: 'Mesas' as const,
      norma: 'NBR 16274 · continuidade da equipotencialização · NBR 16690',
      ate: `Terminal de aterramento da ${m.nome}`,
      trechos: [
        { comprimentoM: percursoMalha(pos), secaoMm2: 50 },
        { comprimentoM: 2.5, secaoMm2: 16 },
      ],
      conexoes: 4,
      defeito: DEFEITO_MESA[m.id],
      dica: DICA_MESA[m.id] ?? 'Derivação da mesa à malha, jumpers entre perfis e grampos com arruela serrilhada.',
      pos,
      // do corredor central, acima das mesas, olhando o pé da estrutura
      vista: { pos: [0, 4.2, pos[2] + 7] as Vec3, target: pos },
    }
  }),
  {
    id: 'inversores',
    nome: 'Carcaça dos inversores (skid)',
    grupo: 'Equipamentos',
    norma: 'NBR 16274 · NBR 16690 · NBR 5410',
    ate: 'Terminal PE dos inversores',
    trechos: [{ comprimentoM: 4, secaoMm2: 16 }],
    conexoes: 2,
    dica: 'Condutor PE de cada inversor ao barramento de terra do skid.',
    pos: [-7.6, 1.1, 12.25],
    vista: vistaDe([-7.6, 1.1, 12.25], -4),
  },
  {
    id: 'trafo',
    nome: 'Carcaça e neutro do transformador',
    grupo: 'Equipamentos',
    norma: 'NBR 14039 · NBR 15751',
    ate: 'Terminal de terra do tanque do trafo',
    trechos: [{ comprimentoM: percursoMalha([1.65, 0.35, 13.5]), secaoMm2: 50 }],
    conexoes: 3,
    dica: 'Tanque e neutro BT ligados à malha em pontos distintos; sem cordoalha rompida.',
    pos: [1.65, 0.35, 13.5],
    vista: vistaDe([1.65, 0.35, 13.5], -4),
  },
  {
    id: 'se',
    nome: 'Barramento de terra da subestação',
    grupo: 'Equipamentos',
    norma: 'NBR 14039 · NBR 15751',
    ate: 'Barra de terra da cabine de medição e proteção',
    trechos: [{ comprimentoM: percursoMalha([11.2, 0.5, 14.6]), secaoMm2: 50 }],
    conexoes: 4,
    dica: 'Malha da SE interligada à malha da usina — sem malhas separadas no mesmo sítio.',
    pos: [11.2, 0.5, 14.6],
    vista: vistaDe([11.2, 0.5, 14.6], -4),
  },
  {
    id: 'portao',
    nome: 'Portão da cerca',
    grupo: 'Cerca',
    norma: 'NBR 15751 · aterramento de cercas',
    ate: 'Folha do portão (via cordoalha flexível)',
    trechos: [
      { comprimentoM: percursoMalha([PORTAO.x + 1.2, 1, CERCA.zMax]), secaoMm2: 50 },
      { comprimentoM: 1.5, secaoMm2: 16 },
    ],
    conexoes: 5,
    defeito: 'rompido',
    dica: 'A folha móvel precisa de cordoalha flexível até o mourão aterrado — a dobradiça não conduz.',
    pos: [PORTAO.x + 1.2, 1, CERCA.zMax],
    vista: { pos: [PORTAO.x + 3, 2.6, CERCA.zMax + 5], target: [PORTAO.x + 1.2, 1, CERCA.zMax] },
  },
  {
    id: 'cerca-no',
    nome: 'Cerca — mourão do canto noroeste',
    grupo: 'Cerca',
    norma: 'NBR 15751 · aterramento de cercas',
    ate: 'Mourão aterrado do canto NO',
    trechos: [{ comprimentoM: percursoMalha([CERCA.xMin, 1, CERCA.zMin]), secaoMm2: 50 }],
    conexoes: 3,
    dica: 'Cerca metálica aterrada a intervalos e nos cantos, ligada ao anel de equalização.',
    pos: [CERCA.xMin, 1, CERCA.zMin],
    vista: { pos: [CERCA.xMin + 4, 3, CERCA.zMin + 4], target: [CERCA.xMin, 1, CERCA.zMin] },
  },
]

export function getPontoContinuidadeFv(id: string): PontoContinuidadeFv | undefined {
  return PONTOS_CONTINUIDADE_FV.find((p) => p.id === id)
}

// ─── Ensaio 2 · resistência da malha (queda de potencial) ────────────────────

/**
 * Linha das estacas: sai da caixa de inspeção junto ao portão (ponto E, na
 * borda da malha) e segue pela estrada de acesso, rumo ao sul (+Z).
 * CALIBRAR (CODEX): E e a direção seguem a estrada do GLB.
 */
export const ESTACAS_FV = {
  e: [PORTAO.x - 2.6, 0, CERCA.zMax + 1] as Vec3,
  direcao: [0, 0, 1] as Vec3,
}

/**
 * Distâncias oferecidas para a estaca de corrente (m), como múltiplos da
 * diagonal da malha. ⚠ REVISAR COM O PABLO: o módulo de aterramento já adota
 * "≥ 5× a dimensão da malha"; conferir a recomendação da NBR 15749.
 */
export const DISTANCIAS_C_M = [1, 2, 3, 5].map((k) => Math.round((k * DIAGONAL_MALHA_M) / 10) * 10)

// ─── Ensaio 3 · tensões de toque e de passo ──────────────────────────────────

export type TipoPotencial = 'toque' | 'passo'
export type SuperficieFv = 'brita' | 'grama'

export interface PontoToquePassoFv {
  id: string
  nome: string
  tipo: TipoPotencial
  local: string
  superficie: SuperficieFv
  /**
   * Fração do GPR que aparece como tensão de toque/passo neste ponto.
   * ⚠ REVISAR COM O PABLO: parâmetro didático do cenário — num estudo real vem
   * da simulação da malha (IEEE 80: Km, Ks, Ki) ou da medição NBR 15749.
   */
  fracaoGpr: number
  /** Fração no cenário com defeitos (ausente = igual à íntegra). */
  fracaoGprDefeito?: number
  norma: string
  dica: string
  /** CALIBRAR (CODEX): onde ficam os eletrodos de pé na cena. */
  pos: Vec3
  /** CALIBRAR (CODEX): vista de câmera do ponto. */
  vista?: Vista
}

export const PONTOS_TOQUE_PASSO_FV: PontoToquePassoFv[] = [
  {
    id: 't-trafo',
    nome: 'Toque — tanque do transformador',
    tipo: 'toque',
    local: 'Mão no tanque, pés a 1 m sobre a brita',
    superficie: 'brita',
    fracaoGpr: 0.14,
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'Ponto crítico: falta na MT do trafo eleva o potencial da malha inteira.',
    pos: [2.5, 0, 15],
    vista: vistaDe([2.5, 0.8, 15], 5),
  },
  {
    id: 't-skid',
    nome: 'Toque — porta do QGBT no skid',
    tipo: 'toque',
    local: 'Mão na porta metálica, pés sobre a brita',
    superficie: 'brita',
    fracaoGpr: 0.12,
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'Portas e painéis metálicos no mesmo potencial da malha.',
    pos: [-6, 0, 15.8],
    vista: vistaDe([-6, 0.8, 15.8], 5),
  },
  {
    id: 't-mesa',
    nome: 'Toque — estrutura da mesa M1',
    tipo: 'toque',
    local: 'Mão no pilar da mesa, pés sobre a grama',
    superficie: 'grama',
    fracaoGpr: 0.06,
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'Transversal da malha sob a fileira reduz a diferença entre estrutura e solo.',
    pos: [-8, 0, -8.2],
    vista: vistaDe([-8, 0.8, -8.2], 5),
  },
  {
    id: 't-portao',
    nome: 'Toque — portão, lado externo',
    tipo: 'toque',
    local: 'Mão no portão, pés fora da cerca, sobre a grama',
    superficie: 'grama',
    fracaoGpr: 0.07,
    fracaoGprDefeito: 0.3,
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'Quem está fora da cerca não tem brita nem malha sob os pés: o anel de equalização é que protege.',
    pos: [PORTAO.x + 1.2, 0, CERCA.zMax + 1],
    vista: { pos: [PORTAO.x + 4, 2.4, CERCA.zMax + 6], target: [PORTAO.x + 1.2, 0.8, CERCA.zMax + 1] },
  },
  {
    id: 'p-trafo',
    nome: 'Passo — junto à base do transformador',
    tipo: 'passo',
    local: 'Pés afastados 1 m, sobre a brita',
    superficie: 'brita',
    fracaoGpr: 0.05,
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'A camada de brita aumenta a resistência de contato dos pés.',
    pos: [4.2, 0, 14.8],
    vista: vistaDe([4.2, 0.4, 14.8], 5),
  },
  {
    id: 'p-cerca',
    nome: 'Passo — perímetro externo da cerca',
    tipo: 'passo',
    local: 'Pés afastados 1 m, fora da cerca, sobre a grama',
    superficie: 'grama',
    fracaoGpr: 0.09,
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'O gradiente de potencial é maior na borda da malha.',
    pos: [CERCA.xMax + 1.5, 0, 0],
    vista: { pos: [CERCA.xMax + 6, 2.6, 3], target: [CERCA.xMax + 1.5, 0.3, 0] },
  },
]

export function getPontoToquePassoFv(id: string): PontoToquePassoFv | undefined {
  return PONTOS_TOQUE_PASSO_FV.find((p) => p.id === id)
}

// ─── Vistas gerais ───────────────────────────────────────────────────────────

/** CALIBRAR (CODEX): vistas de abertura e de referência da planta. */
export const VISTAS_FV = {
  // pelo lado norte: os módulos estão voltados para o norte, então é daqui que se vê a face
  geral: { pos: [36, 28, -42], target: [0, 0.5, 4] } as Vista,
  planta: { pos: [0.01, 62, 18], target: [0, 0, 2] } as Vista,
  skid: { pos: [-1, 6, 3], target: [-5, 1, 12.5] } as Vista,
  // da planta para a estrada: a usina em primeiro plano e as estacas se afastando
  estacas: { pos: [-46, 40, -34], target: [ESTACAS_FV.e[0], 0, 95] } as Vista,
  trafo: { pos: [9, 5, 6], target: [2.5, 1, 13.5] } as Vista,
}

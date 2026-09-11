/**
 * usinaFvPontos.ts — Dados da USINA FOTOVOLTAICA DE SOLO (300 kW) do módulo
 * "Aterramento em usina fotovoltaica": arranjo, malha enterrada, pontos de
 * continuidade, pontos de toque/passo e a linha das estacas da queda de potencial.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ CONTRATO CLAUDE × CODEX — este arquivo é a fronteira entre os dois.       ║
 * ║                                                                          ║
 * ║ • CLAUDE (ferramenta): tipos, ids, dados elétricos (trechos, seções,      ║
 * ║   conexões, defeitos), malha, textos e critérios. Os potenciais vêm      ║
 * ║   calculados em `usinaFvResultados.ts` — mudar a malha exige recalcular.  ║
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
 * Usina de solo de 300 kW (CA) com skid de inversores, transformador elevador
 * e subestação de entrada (cabine de medição e proteção) em média tensão.
 * Pablo passou de 100 para 300 kW em 11/09/2026 ("conforme sua recomendação").
 *
 * ⚠ REVISAR COM O PABLO: módulo de 555 Wp, 10 mesas 2P×27, 3 inversores de
 * 100 kW, trafo de 300 kVA e ligação em 13,8 kV são uma configuração típica
 * adotada para o cenário, não um projeto.
 */
export const USINA = {
  potenciaCaKw: 300,
  moduloWp: 555,
  /** Mesa fixa 2P × 27: duas fileiras de módulos em retrato, 27 por fileira. */
  modulosPorFileira: 27,
  fileirasPorMesa: 2,
  mesas: 10,
  inversores: 3,
  inversorKw: 100,
  trafoKva: 300,
  tensaoMtKv: 13.8,
  tensaoBtV: 380,
  inclinacaoGraus: 20,
} as const

export const MODULOS_TOTAL = USINA.mesas * USINA.modulosPorFileira * USINA.fileirasPorMesa
/** Potência de pico do arranjo (kWp) — 540 × 555 Wp = 299,7 kWp. */
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

/** Corredor central entre as duas colunas de mesas (m). */
const CORREDOR = 3
/** Passo entre fileiras (m): ~1,75× a projeção da mesa, para não sombrear no inverno. */
const PASSO_FILEIRAS = 7.5
/** Dez mesas em 5 fileiras × 2 colunas. */
const COLUNAS_X = [-(MESA.comprimento + CORREDOR) / 2, (MESA.comprimento + CORREDOR) / 2]
const FILEIRAS_Z = [0, 1, 2, 3, 4].map((i) => -22.5 + i * PASSO_FILEIRAS)
export const MESAS_FV: MesaFv[] = FILEIRAS_Z.flatMap((z, f) =>
  COLUNAS_X.map((x, c) => ({ id: `M${f * 2 + c + 1}`, nome: `Mesa M${f * 2 + c + 1}`, centro: [x, 0, z] as Vec3 })),
)

/** Cerca perimetral (m). Portão na face sul (z = zMax). */
export const CERCA = { xMin: -38, xMax: 38, zMin: -29, zMax: 23, altura: 2.1 } as const
export const PORTAO = { x: -26, largura: 4 } as const

/** Skid de conversão: contêiner com os inversores e o QGBT CA. */
export const SKID = { centro: [-8, 0, 16.5] as Vec3, dimensoes: [6.06, 2.6, 2.44] as Vec3 }
/** Transformador elevador a óleo sobre base de concreto. */
export const TRAFO = { centro: [0, 0, 16.5] as Vec3, dimensoes: [2.0, 2.0, 1.5] as Vec3 }
/** Subestação de entrada: cabine de medição e proteção em alvenaria. */
export const SE = { centro: [14, 0, 19.5] as Vec3, dimensoes: [4.5, 3, 3.5] as Vec3 }
/** Poste da concessionária, fora da cerca, com a derivação em MT. */
export const POSTE_MT: Vec3 = [18, 0, 26]
/** Área com brita em volta do skid e do trafo (retângulo x/z). */
export const AREA_BRITA = { xMin: -12, xMax: 3.5, zMin: 13.6, zMax: 19.8 } as const

/**
 * BEP do skid (terminal de aterramento principal da usina): referência das
 * medições de continuidade. Face norte do contêiner.
 * CALIBRAR (CODEX): recapturar no GLB.
 */
export const BEP_SKID: Vec3 = [-6.2, 0.55, 15.2]

// ─── Malha de aterramento ────────────────────────────────────────────────────

/** Profundidade dos condutores da malha (m). */
export const PROFUNDIDADE_MALHA = 0.5

export interface CondutorMalha {
  id: string
  a: Vec3
  b: Vec3
  /** Anel externo de equalização da cerca (mitiga a tensão de toque no portão). */
  equalizacao?: boolean
  /** Trecho do anel de equalização em frente ao portão — ausente no cenário com defeitos. */
  trechoPortao?: boolean
}

const Y = -PROFUNDIDADE_MALHA
const ret = (id: string, x0: number, x1: number, z0: number, z1: number, equalizacao = false): CondutorMalha[] => [
  { id: `${id}-n`, a: [x0, Y, z0], b: [x1, Y, z0], equalizacao },
  { id: `${id}-l`, a: [x1, Y, z0], b: [x1, Y, z1], equalizacao },
  { id: `${id}-s`, a: [x1, Y, z1], b: [x0, Y, z1], equalizacao },
  { id: `${id}-o`, a: [x0, Y, z1], b: [x0, Y, z0], equalizacao },
]

/** Anel interno: 1 m para dentro da cerca. */
const ANEL = { x0: CERCA.xMin + 1, x1: CERCA.xMax - 1, z0: CERCA.zMin + 1, z1: CERCA.zMax - 1 }
/** Anel da SE, em volta da cabine. */
const ANEL_SE = { x0: SE.centro[0] - 2.5, x1: SE.centro[0] + 2.5, z0: SE.centro[2] - 2, z1: SE.centro[2] + 2 }
/** Anel de equalização: 1 m para fora da cerca. */
const EQ = { x0: CERCA.xMin - 1, x1: CERCA.xMax + 1, z0: CERCA.zMin - 1, z1: CERCA.zMax + 1 }
/** Meia largura do trecho do anel de equalização em frente ao portão (m). */
const TRECHO_PORTAO = 6
/** Afastamento dos pilares em relação ao eixo da mesa, em planta (m). */
const Z_PILARES = (MESA.profundidade / 2 - 0.5) * Math.cos((USINA.inclinacaoGraus * Math.PI) / 180)

/**
 * Malha interligada: anel interno; sob cada mesa, um condutor em cada linha de
 * pilares (é assim que a estrutura é equipotencializada em usina de solo);
 * transversal sob skid/trafo/SE; longitudinal no corredor; anel da SE; anel
 * externo de equalização a 1 m da cerca. Tudo em cobre nu 50 mm².
 * ⚠ REVISAR COM O PABLO: topologia didática, não dimensionamento (IEEE 80 /
 * NBR 15751 exigem estudo com corrente de falta e estratificação do solo).
 */
export const MALHA_FV: CondutorMalha[] = [
  ...ret('anel', ANEL.x0, ANEL.x1, ANEL.z0, ANEL.z1),
  ...FILEIRAS_Z.flatMap((z, i) =>
    [-1, 1].map((s) => ({ id: `fileira-${i + 1}${s < 0 ? 'n' : 's'}`, a: [ANEL.x0, Y, z + s * Z_PILARES] as Vec3, b: [ANEL.x1, Y, z + s * Z_PILARES] as Vec3 })),
  ),
  { id: 'transv-skid', a: [ANEL.x0, Y, SKID.centro[2]], b: [ANEL.x1, Y, SKID.centro[2]] },
  { id: 'longitudinal', a: [0, Y, ANEL.z0], b: [0, Y, ANEL.z1] },
  ...ret('anel-se', ANEL_SE.x0, ANEL_SE.x1, ANEL_SE.z0, ANEL_SE.z1),
  // anel de equalização: a face sul vem em três trechos para o do portão poder faltar
  { id: 'equalizacao-n', a: [EQ.x0, Y, EQ.z0], b: [EQ.x1, Y, EQ.z0], equalizacao: true },
  { id: 'equalizacao-l', a: [EQ.x1, Y, EQ.z0], b: [EQ.x1, Y, EQ.z1], equalizacao: true },
  { id: 'equalizacao-s1', a: [EQ.x1, Y, EQ.z1], b: [PORTAO.x + TRECHO_PORTAO, Y, EQ.z1], equalizacao: true },
  { id: 'equalizacao-portao', a: [PORTAO.x + TRECHO_PORTAO, Y, EQ.z1], b: [PORTAO.x - TRECHO_PORTAO, Y, EQ.z1], equalizacao: true, trechoPortao: true },
  { id: 'equalizacao-s2', a: [PORTAO.x - TRECHO_PORTAO, Y, EQ.z1], b: [EQ.x0, Y, EQ.z1], equalizacao: true },
  { id: 'equalizacao-o', a: [EQ.x0, Y, EQ.z1], b: [EQ.x0, Y, EQ.z0], equalizacao: true },
  // o anel de equalização é interligado ao anel interno nos cantos
  ...([[EQ.x0, EQ.z0, ANEL.x0, ANEL.z0], [EQ.x1, EQ.z0, ANEL.x1, ANEL.z0], [EQ.x1, EQ.z1, ANEL.x1, ANEL.z1], [EQ.x0, EQ.z1, ANEL.x0, ANEL.z1]] as const).map(
    ([x0, z0, x1, z1], i) => ({ id: `interliga-${i + 1}`, a: [x0, Y, z0] as Vec3, b: [x1, Y, z1] as Vec3 }),
  ),
]

/** Condutores presentes no cenário (com defeitos: falta o trecho do anel em frente ao portão). */
export function malhaDoCenario(comDefeitos: boolean): CondutorMalha[] {
  return comDefeitos ? MALHA_FV.filter((c) => !c.trechoPortao) : MALHA_FV
}

/** Raio do condutor de 50 mm² (m), usado pelo solver. */
export const RAIO_CONDUTOR_M = Math.sqrt(50 / Math.PI) / 1000

/** Hastes verticais (copperweld 3 m) nos cantos, no meio dos lados, no trafo, no skid e na SE. */
export const COMPRIMENTO_HASTE = 3
export const HASTES_FV: Vec3[] = [
  [ANEL.x0, Y, ANEL.z0], [ANEL.x1, Y, ANEL.z0], [ANEL.x1, Y, ANEL.z1], [ANEL.x0, Y, ANEL.z1],
  [0, Y, ANEL.z0], [0, Y, ANEL.z1],
  [EQ.x0, Y, EQ.z0], [EQ.x1, Y, EQ.z0], [EQ.x1, Y, EQ.z1], [EQ.x0, Y, EQ.z1],
  [TRAFO.centro[0], Y, TRAFO.centro[2]], [SKID.centro[0], Y, SKID.centro[2]],
  [ANEL_SE.x0, Y, ANEL_SE.z1], [ANEL_SE.x1, Y, ANEL_SE.z0],
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

/** Terminais nas faces dos equipamentos (derivados das dimensões acima). */
const FACE_NORTE_SKID = SKID.centro[2] - SKID.dimensoes[2] / 2
const T_INVERSORES: Vec3 = [SKID.centro[0] - 1.6, 1.1, FACE_NORTE_SKID - 0.03]
const T_TRAFO: Vec3 = [TRAFO.centro[0] - TRAFO.dimensoes[0] / 2 - 0.05, 0.35, TRAFO.centro[2]]
const T_SE: Vec3 = [SE.centro[0] - SE.dimensoes[0] / 2 - 0.15, 0.5, SE.centro[2] - 1.2]

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
    pos: T_INVERSORES,
    vista: vistaDe(T_INVERSORES, -4),
  },
  {
    id: 'trafo',
    nome: 'Carcaça e neutro do transformador',
    grupo: 'Equipamentos',
    norma: 'NBR 14039 · NBR 15751',
    ate: 'Terminal de terra do tanque do trafo',
    trechos: [{ comprimentoM: percursoMalha(T_TRAFO), secaoMm2: 50 }],
    conexoes: 3,
    dica: 'Tanque e neutro BT ligados à malha em pontos distintos; sem cordoalha rompida.',
    pos: T_TRAFO,
    vista: vistaDe(T_TRAFO, -4),
  },
  {
    id: 'se',
    nome: 'Barramento de terra da subestação',
    grupo: 'Equipamentos',
    norma: 'NBR 14039 · NBR 15751',
    ate: 'Barra de terra da cabine de medição e proteção',
    trechos: [{ comprimentoM: percursoMalha(T_SE), secaoMm2: 50 }],
    conexoes: 4,
    dica: 'Malha da SE interligada à malha da usina — sem malhas separadas no mesmo sítio.',
    pos: T_SE,
    vista: vistaDe(T_SE, -4),
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
  norma: string
  dica: string
  /** CALIBRAR (CODEX): onde ficam os eletrodos de pé na cena (centro entre os pés). */
  pos: Vec3
  /** Toque: onde a mão encosta na massa. CALIBRAR (CODEX). */
  alvo?: Vec3
  /** CALIBRAR (CODEX): vista de câmera do ponto. */
  vista?: Vista
}

/** Pilares por fileira da mesa: um a cada ~5 m. */
export const PILARES_POR_FILA = Math.round(MESA.comprimento / 5) + 1

/** Pilar traseiro (sul, lado alto) de uma mesa — i de 0 a PILARES_POR_FILA − 1, de oeste para leste. */
export function pilarMesa(m: MesaFv, i: number): Vec3 {
  const xl = -MESA.comprimento / 2 + 0.6 + (i * (MESA.comprimento - 1.2)) / (PILARES_POR_FILA - 1)
  const zl = (MESA.profundidade / 2 - 0.5) * Math.cos((USINA.inclinacaoGraus * Math.PI) / 180)
  return [m.centro[0] + xl, 0, m.centro[2] + zl]
}

const PILAR_M1 = pilarMesa(MESAS_FV[0], 2)
const FACE_SUL_TRAFO = TRAFO.centro[2] + TRAFO.dimensoes[2] / 2

export const PONTOS_TOQUE_PASSO_FV: PontoToquePassoFv[] = [
  {
    id: 't-trafo',
    nome: 'Toque — tanque do transformador',
    tipo: 'toque',
    local: 'Mão no tanque, pés a 1 m sobre a brita',
    superficie: 'brita',
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'Ponto crítico: falta na MT do trafo eleva o potencial da malha inteira.',
    pos: [TRAFO.centro[0], 0, FACE_SUL_TRAFO + 1],
    alvo: [TRAFO.centro[0], 1.1, FACE_SUL_TRAFO],
    vista: vistaDe([TRAFO.centro[0], 0.8, FACE_SUL_TRAFO + 1], 5),
  },
  {
    id: 't-skid',
    nome: 'Toque — porta do QGBT no skid',
    tipo: 'toque',
    local: 'Mão na porta metálica, pés sobre a brita',
    superficie: 'brita',
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'Portas e painéis metálicos no mesmo potencial da malha.',
    pos: [SKID.centro[0], 0, FACE_NORTE_SKID - 1],
    alvo: [SKID.centro[0], 1.2, FACE_NORTE_SKID],
    vista: vistaDe([SKID.centro[0], 0.8, FACE_NORTE_SKID - 1], -5),
  },
  {
    id: 't-mesa',
    nome: 'Toque — estrutura da mesa M1',
    tipo: 'toque',
    local: 'Mão no pilar da mesa, pés sobre a grama',
    superficie: 'grama',
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'Transversal da malha sob a fileira reduz a diferença entre estrutura e solo.',
    pos: [PILAR_M1[0], 0, PILAR_M1[2] + 1],
    alvo: [PILAR_M1[0], 1.0, PILAR_M1[2]],
    vista: vistaDe([PILAR_M1[0], 0.8, PILAR_M1[2] + 1], 5),
  },
  {
    id: 't-portao',
    nome: 'Toque — portão, lado externo',
    tipo: 'toque',
    local: 'Mão no portão, pés fora da cerca, sobre a grama',
    superficie: 'grama',
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'Fora da cerca não há brita nem malha sob os pés: é o anel de equalização a 1 m que segura o potencial do solo. Com o trecho em frente ao portão interrompido, o toque sobe.',
    pos: [PORTAO.x + 1.2, 0, CERCA.zMax + 1],
    alvo: [PORTAO.x + 1.2, 1.1, CERCA.zMax],
    vista: { pos: [PORTAO.x + 4, 2.4, CERCA.zMax + 6], target: [PORTAO.x + 1.2, 0.8, CERCA.zMax + 1] },
  },
  {
    id: 'p-trafo',
    nome: 'Passo — junto à base do transformador',
    tipo: 'passo',
    local: 'Pés afastados 1 m, sobre a brita',
    superficie: 'brita',
    norma: 'NBR 15749 (medição) · NBR 15751 (limite)',
    dica: 'A camada de brita aumenta a resistência de contato dos pés.',
    pos: [TRAFO.centro[0] + 2.3, 0, FACE_SUL_TRAFO + 1],
    vista: vistaDe([TRAFO.centro[0] + 2.3, 0.4, FACE_SUL_TRAFO + 1], 5),
  },
  {
    id: 'p-cerca',
    nome: 'Passo — perímetro externo da cerca',
    tipo: 'passo',
    local: 'Pés afastados 1 m, fora da cerca, sobre a grama',
    superficie: 'grama',
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
  geral: { pos: [58, 44, -66], target: [0, 0.5, 0] } as Vista,
  planta: { pos: [0.01, 100, 14], target: [0, 0, -2] } as Vista,
  skid: { pos: [-3, 7, 7], target: [-7, 1, 15.5] } as Vista,
  // da planta para a estrada: a usina em primeiro plano e as estacas se afastando
  estacas: { pos: [-80, 70, -60], target: [ESTACAS_FV.e[0], 0, 160] } as Vista,
  trafo: { pos: [7, 5, 9], target: [0, 1, 16.5] } as Vista,
}

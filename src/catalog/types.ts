/**
 * types.ts — Esquema de dados orientado a conteúdo.
 *
 * A cena e o HUD renderizam QUALQUER par (equipamento × ensaio) a partir
 * destas definições. Adicionar um novo equipamento ou ensaio = adicionar
 * uma definição; nenhuma reescrita da engine ou da cena.
 */

export type Vec3 = [number, number, number]

/** Vista de câmera gravada (posição + alvo) para abertura/etapas. */
export interface Vista {
  pos: Vec3
  target: Vec3
}

/** Ponto de conexão no equipamento (borne, carcaça, terminal). */
export interface Anchor {
  id: string
  /**
   * Posição relativa ao equipamento já normalizado/assentado, em unidades
   * de mundo. Heurística inicial pela bounding box; ajuste fino aqui.
   */
  pos: Vec3
  label: string
  /** Papel elétrico do ponto, usado pelas travas do ensaio. */
  papel: 'line' | 'earth' | 'neutro'
}

export interface DadosNominais {
  tensaoV?: number
  potenciaCV?: number
  rpm?: number
  isolamentoClasse?: string
  [k: string]: string | number | undefined
}

/** Cenário 3D onde o equipamento é apresentado. */
export type Cenario = 'bancada-lab' | 'subestacao' | 'subestacao-3d' | 'hospital'

export interface Equipment {
  id: string
  nome: string
  tipo: 'motor' | 'transformador' | 'painel' | 'disjuntor'
  modelPath: string
  /** Escala-alvo (maior dimensão) ao normalizar o GLB, em unidades de mundo. */
  escalaAlvo: number
  /** Cenário onde aparece (define o ambiente 3D). Default: bancada-lab. */
  cenario?: Cenario
  /** Vista de abertura da simulação (câmera), quando gravada. */
  vistaInicial?: Vista
  /** Sobrescreve a cor de materiais por nome (ex.: pintar o transformador de cinza). */
  recolor?: Record<string, string>
  anchors: Anchor[]
  dadosNominais: DadosNominais
}

/** Tipo de controle que um passo expõe no HUD. */
export type StepControl =
  | 'voltage'
  | 'connect-earth'
  | 'connect-line'
  | 'run-test'
  | 'af-tensao'
  | 'af-corrente'
  | 'af-tempo'
  | 'af-config'
  | 'af-calcular'
  | 'insp-check'

export interface Step {
  id: string
  titulo: string
  descricao: string
  /** Itens/detalhes adicionais a verificar (lista exibida no painel). */
  detalhes?: string[]
  /** Cuidados de segurança (exibidos na caixa de diálogo da etapa). */
  cuidados?: string[]
  /** Erros comuns que ocorrem nesta etapa. */
  erros?: string[]
  /** Mensagem de resultado exibida quando a etapa é concluída. */
  feito?: string
  /** Vista de câmera gravada para esta etapa (visita guiada). */
  vista?: Vista
  /** Ação 3D (desenergização): tipo do marcador/efeito no ponto. */
  acaoTipo?: AcaoDes
  /** Texto curto da ação a executar (botão/checklist). */
  acao: string
  /** IDs de passos que precisam estar cumpridos para habilitar este. */
  requer?: string[]
  /** Controle interativo exibido neste passo (se houver). */
  control?: StepControl
  /** Anchor de destino para a câmera deslizar (drei Bounds). */
  focoAnchorId?: string
  /** Citação de norma relevante ao passo. */
  norma?: string
}

/** Identificador de função pura registrada em engine/registry. */
export type EngineRef =
  | 'insulation'
  | 'arcflash'
  | 'inspecao'
  | 'desenergizacao'
  | 'aterramento'
  | 'verificacao'

/** Modo de simulação — define qual HUD/fluxo a app usa. */
export type ModoSim =
  | 'guiado-megger'
  | 'arcflash'
  | 'inspecao'
  | 'desenergizacao'
  | 'aterramento'
  | 'verificacao'

/** Ação 3D de um passo de desenergização/reenergização. */
export type AcaoDes =
  | 'confirmar'
  | 'seccionar'
  | 'bloquear'
  | 'testar'
  | 'aterrar'
  | 'proteger'
  | 'sinalizar'
  | 'carregar-mola'
  | 'religar'
  | 'rem-sinalizar'
  | 'rem-proteger'
  | 'rem-aterrar'
  | 'rem-bloquear'

export interface TestProcedure {
  id: string
  nome: string
  norma: string
  instrumento: 'megger' | 'analisador' | 'checklist' | 'terrometro'
  engineRef: EngineRef
  /** Modo de simulação (default: guiado-megger). */
  modo?: ModoSim
  /** Tensões de ensaio selecionáveis (V) — usado no modo megger. */
  tensoes: number[]
  /** Tensão padrão pré-selecionada. */
  tensaoPadrao: number
  /** Duração do energizado (s) — modo megger. */
  duracaoS: number
  steps: Step[]
}

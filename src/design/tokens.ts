/**
 * tokens.ts — Fonte única da identidade visual de SimuPower.
 *
 * Conceito: "Instrumento Calibrado / HUD de campo". Preciso, técnico, imersivo.
 * Estes tokens são consumidos tanto pelo CSS/Tailwind (espelhados em index.css via @theme)
 * quanto pelo código 3D (cores de materiais, bloom, traço do osciloscópio).
 *
 * Regra: nenhum hex solto pela base de código — tudo vem daqui.
 */

export const color = {
  /** Materiais do prédio de treinamento e do SPDA (também usados no GLB). */
  spda: {
    concreto: '#c9c5bd',
    cobertura: '#a9a49b',
    metal: '#4a5058',
    cobre: '#b87333',
    isolador: '#e6ebf0',
    vidro: '#314f60',
    aluminio: '#cfd4da',
    oxidacao: '#54876b',
  },
  inbrat: {
    maleta: '#ee3027',
    painel: '#333537',
    borracha: '#17191b',
    tecla: '#f0f1ed',
    tela: '#eef3ee',
    tinta: '#283438',
    ligar: '#20a080',
  },
  /** fundo do palco 3D (escuro, imersivo) */
  viewport: '#0B0F14',
  /** painéis HUD flutuantes (vidro fosco) — usar com backdrop-blur */
  surfaceGlass: 'rgba(18,24,33,0.72)',
  /** módulos sólidos (readout do instrumento) */
  surface: '#11161D',
  /** bordas finas */
  hairline: 'rgba(255,255,255,0.08)',

  text: '#E8EDF2',
  textMuted: '#8A97A6',
  textFaint: '#5B6675',

  /** accent assinatura — âmbar de instrumento. Usar com PARCIMÔNIA: passo ativo, ação principal, energizado. */
  accent: '#F2B705',
  /** traço de medição / dados */
  accentCool: '#4CC2FF',

  status: {
    pass: '#34D399',
    marginal: '#FBBF24',
    fail: '#F87171',
  },
} as const

export const font = {
  /** Display/UI — grotesca técnica e moderna */
  display: "'Space Grotesk', system-ui, sans-serif",
  /** Texto corrido */
  body: "'Inter', system-ui, sans-serif",
  /** Mono em TODA leitura numérica — a assinatura de instrumento */
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const

export const space = {
  hairline: 1,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const

/** Tempos e easings — movimento sutil, sempre com fallback de prefers-reduced-motion. */
export const motion = {
  /** duração do ensaio energizado, em segundos */
  testDurationS: 60,
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  stepFadeMs: 420,
} as const

/** Veredito → cor de status. Centraliza o mapeamento usado por engine e UI. */
export type VeredictoCor = 'pass' | 'marginal' | 'fail'

export const tokens = { color, font, space, radius, motion } as const
export default tokens

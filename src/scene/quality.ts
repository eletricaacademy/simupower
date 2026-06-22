/**
 * quality.ts — Níveis de qualidade gráfica adaptativos.
 *
 * Objetivo: rodar bem em máquinas leves e celular. Detecta a capacidade do
 * dispositivo (GPU/cores/DPR/memória) e devolve um preset que controla os
 * itens que mais pesam: postprocessing (Bloom), DPR, sombras e o frameloop.
 * O usuário pode forçar um nível manualmente (persistido em localStorage).
 */

export type Tier = 'baixo' | 'medio' | 'alto'
export type QualidadePref = 'auto' | Tier

export interface QualidadeConfig {
  tier: Tier
  /** DPR máximo (telas retina renderizam em 2× sem isto). */
  dprMax: number
  antialias: boolean
  /** EffectComposer ligado? */
  postprocessing: boolean
  /** Bloom (o efeito mais caro). */
  bloom: boolean
  /** Sombras dinâmicas da luz direcional. */
  shadows: boolean
  shadowMapSize: number
  /** Sombra de contato no chão (mais barata que a dinâmica). */
  contactShadows: boolean
  contactRes: number
  /** Teto de resolução de textura aplicado em runtime (px). Reduz VRAM em
   *  aparelhos fracos sem precisar de um GLB separado. Infinity = sem corte. */
  texCapPx: number
  envResolution: number
  autoRotate: boolean
  damping: boolean
  /** 'demand' = só renderiza quando há mudança (economiza GPU/bateria parado). */
  frameloop: 'always' | 'demand'
  /** Teto de quadros/segundo durante render contínuo (ensaio) em modo demand. */
  fpsCap: number
}

const PRESETS: Record<Tier, QualidadeConfig> = {
  alto: {
    tier: 'alto',
    dprMax: 2,
    antialias: true,
    postprocessing: true,
    bloom: true,
    shadows: true,
    shadowMapSize: 2048,
    contactShadows: true,
    contactRes: 1024,
    texCapPx: Infinity,
    envResolution: 256,
    autoRotate: true,
    damping: true,
    frameloop: 'always',
    fpsCap: 60,
  },
  medio: {
    tier: 'medio',
    dprMax: 1.5,
    antialias: true,
    postprocessing: true,
    bloom: true,
    shadows: true,
    shadowMapSize: 1024,
    contactShadows: true,
    contactRes: 512,
    texCapPx: 1024,
    envResolution: 128,
    autoRotate: true,
    damping: true,
    frameloop: 'always',
    fpsCap: 60,
  },
  baixo: {
    tier: 'baixo',
    // DPR < 1 renderiza abaixo da resolução da tela e a CSS faz upscale — o
    // maior alívio de fill-rate em GPU integrada (custo ~ pixels × shader).
    dprMax: 0.75,
    antialias: false,
    postprocessing: false,
    bloom: false,
    shadows: false,
    shadowMapSize: 512,
    // sem sombra de contato: ela é um passe de profundidade extra por quadro.
    contactShadows: false,
    contactRes: 256,
    texCapPx: 512,
    envResolution: 64,
    autoRotate: false,
    damping: false,
    frameloop: 'demand',
    fpsCap: 30,
  },
}

/**
 * Lê a string do renderer WebGL. IMPORTANTE: pede `powerPreference:
 * 'high-performance'` para que, em notebooks híbridos (Intel + NVIDIA/AMD), o
 * probe reflita a GPU dedicada — a mesma que o Canvas real vai usar. Sem isso, o
 * navegador costuma reportar a integrada e nós degradaríamos à toa.
 */
export function lerRenderer(): string {
  if (typeof document === 'undefined') return ''
  try {
    const canvas = document.createElement('canvas')
    const attrs: WebGLContextAttributes = { powerPreference: 'high-performance' }
    const gl = (canvas.getContext('webgl', attrs) ||
      canvas.getContext('experimental-webgl', attrs)) as WebGLRenderingContext | null
    if (!gl) return 'sem-webgl'
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const r = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''
    return String(r || '').toLowerCase()
  } catch {
    return ''
  }
}

/** Heurística de detecção do nível adequado ao dispositivo. */
export function detectarTier(): Tier {
  if (typeof window === 'undefined') return 'medio'

  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const renderer = lerRenderer()

  const semWebgl = renderer === 'sem-webgl'
  const software = /swiftshader|software|llvmpipe|microsoft basic/.test(renderer)

  // GPU dedicada presente → topo (mesmo em notebook híbrido).
  const discreta = /nvidia|geforce|rtx|gtx|radeon|\brx \d{3,4}\b|\bamd\b/.test(renderer)

  // Integradas fracas → baixo (ex.: Intel UHD/HD pega 90%+ com bloom/sombras).
  const intelFraca = /intel.*(?:uhd|hd) graphics/.test(renderer)
  const integradaFraca =
    /adreno \(?[1-5]\d{2}|mali-t\d{3}|mali-g[1-5]\d|powervr|videocore/.test(renderer)

  // Integradas medianas → médio (Iris/Xe/Arc, Apple GPU, Adreno/Mali recentes).
  const integradaMedia =
    /iris|intel.*(?:xe|arc)|apple gpu|adreno \(?[6-9]\d{2}|mali-g[6-9]\d/.test(renderer)

  if (discreta) return 'alto'
  if (semWebgl || software || intelFraca || integradaFraca || (mem !== undefined && mem <= 2) || (coarse && cores <= 3)) {
    return 'baixo'
  }
  if (coarse || cores <= 4 || integradaMedia || (mem !== undefined && mem <= 4)) {
    return 'medio'
  }
  return 'alto'
}

export function configDe(tier: Tier): QualidadeConfig {
  return PRESETS[tier]
}

/** Resolve a preferência ('auto' usa a detecção) num preset concreto. */
export function resolverQualidade(pref: QualidadePref): QualidadeConfig {
  const tier = pref === 'auto' ? detectarTier() : pref
  return PRESETS[tier]
}

const STORAGE_KEY = 'calibra:qualidade'

export function carregarPref(): QualidadePref {
  if (typeof localStorage === 'undefined') return 'auto'
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'baixo' || v === 'medio' || v === 'alto' ? v : 'auto'
}

export function salvarPref(p: QualidadePref): void {
  try {
    localStorage?.setItem(STORAGE_KEY, p)
  } catch {
    /* ignore */
  }
}

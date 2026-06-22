/**
 * sons.ts — Efeitos sonoros sintetizados (Web Audio API), sem arquivos.
 * Cada procedimento tem um som próprio + um som de mudança de etapa.
 * O AudioContext é criado/retomado sob gesto do usuário (cliques).
 */
import { asset } from '../lib/asset'

let ctx: AudioContext | null = null
let master = 0.7 // volume mestre (0..1)
let mudo = false

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

const ativo = () => !mudo && master > 0

/** Atualiza volume mestre / mudo e reaplica no som ambiente em andamento. */
export function setMaster(volume: number, m: boolean) {
  master = Math.max(0, Math.min(1, volume))
  mudo = m
  aplicarAmbiente()
}

/* --------------------- sons de arquivo (one-shot) ---------------------- */
const ARQUIVOS = {
  disjuntor: 'sounds/disjuntor.mp3', // abertura/fechamento do disjuntor MT (mesmo)
  mola: 'sounds/mola.mp3', // carregamento da mola do disjuntor
  fechadura: 'sounds/fechadura.mp3', // cadeado/LOTO
  catraca: 'sounds/catraca.mp3', // chave catraca — aterramento temporário
  palmas: 'sounds/palmas.mp3', // comemoração ao concluir
} as const

let molaAtual: HTMLAudioElement | null = null

/** Toca um efeito a partir de arquivo. `mola` pode ser interrompido com pararMola(). */
export function somArquivo(qual: keyof typeof ARQUIVOS) {
  if (!ativo() || typeof Audio === 'undefined') return
  const a = new Audio(asset(ARQUIVOS[qual]))
  a.volume = Math.min(1, master * 0.9 * ef())
  a.play().catch(() => {})
  if (qual === 'mola') molaAtual = a
}

export function pararMola() {
  if (molaAtual) {
    molaAtual.pause()
    molaAtual = null
  }
}

/* ----------------------------- locução (voz) ---------------------------- */
let vozAtual: HTMLAudioElement | null = null
let vozAtiva = false // enquanto a voz toca, abaixa o ambiente (ducking)

/**
 * Toca a locução de uma etapa: /sounds/voz/<id>.mp3. Para a anterior.
 * Abaixa o zumbido (ducking) enquanto narra. Retorna o elemento ou null.
 */
export function somVoz(id: string): HTMLAudioElement | null {
  pararVoz()
  if (mudo || typeof Audio === 'undefined') return null
  const a = new Audio(asset(`sounds/voz/${id}.mp3`))
  a.volume = Math.min(1, Math.max(0.3, master))
  vozAtual = a
  vozAtiva = true
  aplicarAmbiente() // duck
  const fim = () => {
    if (vozAtual === a) {
      vozAtiva = false
      aplicarAmbiente()
    }
  }
  a.addEventListener('ended', fim)
  a.addEventListener('error', fim)
  a.play().catch(() => fim())
  return a
}

export function pararVoz() {
  if (vozAtual) {
    vozAtual.pause()
    vozAtual = null
  }
  if (vozAtiva) {
    vozAtiva = false
    aplicarAmbiente()
  }
}

/* ------------------------- som ambiente (loop) ------------------------- */
let amb: HTMLAudioElement | null = null
let fadeTimer: ReturnType<typeof setInterval> | null = null
let ambOn = false
let ambTrack = 'sounds/subestacao.mp3'
let ambElTrack = ''
let ambBase = 0.5 // fração do volume mestre para o ambiente
const DUCK = 0.1 // fração do ambiente/efeitos enquanto a voz fala (10%)

/** fator aplicado aos efeitos enquanto o locutor fala. */
const ef = () => (vozAtiva ? DUCK : 1)

/**
 * Liga/desliga um som ambiente em loop. Por padrão o zumbido da subestação;
 * o motor usa 'sounds/oficina.mp3' com base menor.
 */
export function ambiente(on: boolean, src = 'sounds/subestacao.mp3', base = 0.2) {
  ambOn = on
  if (on) {
    ambTrack = src
    ambBase = base
  }
  aplicarAmbiente()
}

/** Reaplica o estado do ambiente (chamado por ambiente() e setMaster()). */
function aplicarAmbiente() {
  if (typeof Audio === 'undefined') return
  if (!amb || ambElTrack !== ambTrack) {
    if (amb) amb.pause()
    amb = new Audio(asset(ambTrack))
    amb.loop = true
    amb.volume = 0
    ambElTrack = ambTrack
  }
  const tocar = ambOn && ativo()
  const alvo = tocar ? master * ambBase * (vozAtiva ? DUCK : 1) : 0
  if (tocar) amb.play().catch(() => {})
  if (fadeTimer) {
    clearInterval(fadeTimer)
    fadeTimer = null
  }
  const a = amb
  fadeTimer = setInterval(() => {
    const passo = 0.04
    if (Math.abs(a.volume - alvo) <= passo) {
      a.volume = alvo
      if (alvo === 0) a.pause()
      if (fadeTimer) clearInterval(fadeTimer)
      fadeTimer = null
    } else {
      a.volume = Math.max(0, Math.min(1, a.volume + (alvo > a.volume ? passo : -passo)))
    }
  }, 50)
}

function tom(freq: number, t0: number, dur: number, tipo: OscillatorType, vol: number) {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = tipo
  o.frequency.setValueAtTime(freq, c.currentTime + t0)
  g.gain.setValueAtTime(0.0001, c.currentTime + t0)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * master * ef()), c.currentTime + t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur)
  o.connect(g).connect(c.destination)
  o.start(c.currentTime + t0)
  o.stop(c.currentTime + t0 + dur + 0.02)
}

/** ruído curto (clique/clack mecânico) */
function ruido(t0: number, dur: number, vol: number, hp = 800) {
  const c = ac()
  if (!c) return
  const n = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, n, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = hp
  const g = c.createGain()
  g.gain.value = vol * master * ef()
  src.connect(f).connect(g).connect(c.destination)
  src.start(c.currentTime + t0)
}

export type SomTipo =
  | 'passo'
  | 'seccionar'
  | 'bloquear'
  | 'testar'
  | 'aterrar'
  | 'proteger'
  | 'sinalizar'
  | 'religar'
  | 'sucesso'
  | 'remover'
  | 'descarga'

export function som(tipo: SomTipo) {
  if (!ativo() || !ac()) return
  switch (tipo) {
    case 'passo': // mudança de etapa — blip curto
      tom(520, 0, 0.08, 'sine', 0.12)
      tom(700, 0.05, 0.08, 'sine', 0.1)
      break
    case 'seccionar': // disjuntor abrindo — clack grave + ruído
      tom(140, 0, 0.12, 'square', 0.18)
      ruido(0.02, 0.09, 0.25, 500)
      break
    case 'bloquear': // cadeado/LOTO — dois cliques metálicos
      ruido(0, 0.05, 0.22, 1500)
      ruido(0.09, 0.05, 0.18, 1800)
      break
    case 'testar': // detector — bip-bip
      tom(880, 0, 0.1, 'square', 0.14)
      tom(880, 0.16, 0.12, 'square', 0.14)
      break
    case 'aterrar': // grampo/aterramento — thunk grave
      tom(110, 0, 0.16, 'sawtooth', 0.16)
      ruido(0.02, 0.06, 0.18, 300)
      break
    case 'proteger': // cobertura/barreira isolante — pano + baque suave
      ruido(0, 0.14, 0.16, 500)
      tom(170, 0.02, 0.13, 'sine', 0.14)
      break
    case 'sinalizar': // placa de sinalização — duas batidinhas (tack-tack)
      ruido(0, 0.03, 0.12, 2200)
      tom(720, 0.0, 0.05, 'square', 0.12)
      tom(610, 0.11, 0.07, 'square', 0.11)
      break
    case 'remover': // retirada — tick descendente
      tom(520, 0, 0.07, 'triangle', 0.12)
      tom(380, 0.06, 0.08, 'triangle', 0.1)
      break
    case 'religar': // energização — sweep ascendente
      tom(180, 0, 0.35, 'sawtooth', 0.12)
      tom(360, 0.1, 0.3, 'sawtooth', 0.1)
      break
    case 'descarga': // aterramento p/ descarga — zap/crepitação
      ruido(0, 0.18, 0.22, 1200)
      tom(90, 0, 0.14, 'sawtooth', 0.14)
      break
    case 'sucesso': // conclusão — tríade ascendente
      tom(523, 0, 0.16, 'sine', 0.16)
      tom(659, 0.12, 0.16, 'sine', 0.16)
      tom(784, 0.24, 0.24, 'sine', 0.18)
      break
  }
}

/**
 * sons.ts — Efeitos sonoros sintetizados (Web Audio API), sem arquivos.
 * Cada procedimento tem um som próprio + um som de mudança de etapa.
 * O AudioContext é criado/retomado sob gesto do usuário (cliques).
 */
import { asset } from '../lib/asset'

let ctx: AudioContext | null = null
let master = 0.7 // volume mestre (0..1)
let mudo = false

/**
 * Regra de níveis (frações do volume mestre):
 *  - LOCUTOR (voz) é prioritário e claro → VOZ_BASE alto.
 *  - SOM DE FUNDO (ambiente) e EFEITOS abaixam (ducking) p/ DUCK enquanto a voz
 *    fala, para não competir com o locutor.
 *  - Cada faixa de ambiente tem sua própria base (ambBase), pois umas são mais
 *    presentes que outras (ex.: campo aberto > oficina).
 * Tudo é multiplicado pelo `master` (slider) e zerado quando `mudo`.
 */
const VOZ_BASE = 0.95

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

/**
 * Roteamento por GainNode — CRÍTICO p/ iOS: o Safari do iPhone IGNORA
 * `HTMLAudioElement.volume` (volume só pelos botões físicos). Então todo áudio
 * de arquivo (ambiente, locução, efeitos) passa por um GainNode da Web Audio,
 * cujo ganho o iOS respeita. Assim volume, ducking e mudo funcionam no celular.
 * Cada elemento só pode ter UM MediaElementSource — cacheamos por elemento.
 */
const ganhos = new WeakMap<HTMLAudioElement, GainNode>()

function ganho(el: HTMLAudioElement): GainNode | null {
  const c = ac()
  if (!c) return null
  const existente = ganhos.get(el)
  if (existente) return existente
  try {
    const src = c.createMediaElementSource(el)
    const g = c.createGain()
    src.connect(g).connect(c.destination)
    ganhos.set(el, g)
    return g
  } catch {
    return null // Web Audio indisponível ou elemento já roteado
  }
}

/** Define o volume efetivo de um elemento via GainNode (iOS) com fallback p/ .volume. */
function setGanho(el: HTMLAudioElement, v: number, ramp = 0.08) {
  const vol = Math.max(0, Math.min(1, v))
  const g = ganho(el)
  if (g && ctx) {
    g.gain.cancelScheduledValues(ctx.currentTime)
    g.gain.setTargetAtTime(vol, ctx.currentTime, Math.max(0.005, ramp))
  } else {
    el.volume = vol // desktop sem AudioContext / Web Audio indisponível
  }
}

const ativo = () => !mudo && master > 0

/** Atualiza volume mestre / mudo e reaplica AO VIVO no ambiente e na locução em
 *  andamento (antes só o ambiente respondia, e a voz só na próxima narração). */
export function setMaster(volume: number, m: boolean) {
  master = Math.max(0, Math.min(1, volume))
  mudo = m
  if (vozAtual) setGanho(vozAtual, mudo ? 0 : master * VOZ_BASE)
  efeitos.forEach((a) => setGanho(a, mudo ? 0 : master * 0.9 * ef()))
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
// efeitos de arquivo em andamento (ex.: palmas/disjuntor) — rastreados para
// poder silenciá-los ao sair da simulação (antes ficavam tocando soltos).
const efeitos = new Set<HTMLAudioElement>()

/** Toca um efeito a partir de arquivo. `mola` pode ser interrompido com pararMola(). */
export function somArquivo(qual: keyof typeof ARQUIVOS) {
  if (!ativo() || typeof Audio === 'undefined') return
  const a = new Audio(asset(ARQUIVOS[qual]))
  a.volume = 1
  efeitos.add(a)
  setGanho(a, master * 0.9 * ef(), 0.01)
  const limpar = () => efeitos.delete(a)
  a.addEventListener('ended', limpar)
  a.addEventListener('error', limpar)
  a.play().catch(limpar)
  if (qual === 'mola') molaAtual = a
}

export function pararMola() {
  if (molaAtual) {
    molaAtual.pause()
    efeitos.delete(molaAtual)
    molaAtual = null
  }
}

/** Para todos os efeitos de arquivo em andamento. */
function pararEfeitos() {
  efeitos.forEach((a) => {
    try {
      a.pause()
    } catch {
      /* ignore */
    }
  })
  efeitos.clear()
  molaAtual = null
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
  a.volume = 1
  vozAtual = a
  vozAtiva = true
  setGanho(a, master * VOZ_BASE, 0.02)
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
let ambOn = false
let ambTrack = 'sounds/subestacao.mp3'
let ambElTrack = ''
let ambBase = 0.5 // fração do volume mestre para o ambiente
const DUCK = 0.15 // fração do ambiente/efeitos enquanto a voz fala (15%)

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

/** Reaplica o estado do ambiente (chamado por ambiente() e setMaster()).
 *  O nível é controlado pelo GainNode (iOS respeita) com rampa suave. */
function aplicarAmbiente() {
  if (typeof Audio === 'undefined') return
  if (!amb || ambElTrack !== ambTrack) {
    if (amb) amb.pause()
    amb = new Audio(asset(ambTrack))
    amb.loop = true
    amb.volume = 1 // ganho controla o nível
    ambElTrack = ambTrack
  }
  const tocar = ambOn && ativo()
  const alvo = tocar ? master * ambBase * (vozAtiva ? DUCK : 1) : 0
  if (tocar) {
    amb.play().catch(() => {})
    setGanho(amb, alvo, 0.12) // rampa suave (fade in/duck)
  } else {
    setGanho(amb, 0, 0.05)
    amb.pause()
  }
}

/**
 * pararTudo — silencia IMEDIATAMENTE todo o áudio da simulação: ambiente (sem
 * fade), locução e efeitos de arquivo. Chamado ao sair de uma simulação (volta
 * ao menu) para nada vazar tocando. Não zera o volume/mudo do usuário.
 */
export function pararTudo() {
  ambOn = false
  if (amb) {
    setGanho(amb, 0, 0.02)
    amb.pause()
  }
  pararVoz()
  pararEfeitos()
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

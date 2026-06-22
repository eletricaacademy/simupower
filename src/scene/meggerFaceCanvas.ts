/**
 * meggerFaceCanvas.ts — Desenha a face do Minipa MI-2705 num <canvas> 2D, usado
 * como CanvasTexture no corpo 3D. Confiável (sem pegadinhas de SVG-como-imagem) e
 * inclui o LCD ao vivo na própria textura (redesenhado quando os valores mudam).
 *
 * Mapa px→local do plano (W×D): xLocal=(x/FACE_W-0.5)·W ; zLocal=(y/FACE_H-0.5)·D
 */
// proporção real da face: 155 (largura) × 202 (comprimento) mm
export const FACE_W = 540
export const FACE_H = 704

export const HOLES = {
  earth: { x: 78, y: 96 },
  guard: { x: 188, y: 96 },
  line1: { x: 350, y: 96 },
  line2: { x: 440, y: 96 },
}

export interface FaceData {
  leitura: number
  tensao: number
  tempo: number
  idle: boolean
  energizado: boolean
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

export function drawMeggerFace(ctx: CanvasRenderingContext2D, d: FaceData) {
  const W = FACE_W
  const H = FACE_H
  ctx.clearRect(0, 0, W, H)

  // corpo
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#454a51')
  bg.addColorStop(1, '#33373d')
  rr(ctx, 0, 0, W, H, 30)
  ctx.fillStyle = bg
  ctx.fill()
  rr(ctx, 6, 6, W - 12, H - 12, 26)
  ctx.strokeStyle = '#22262b'
  ctx.lineWidth = 4
  ctx.stroke()

  // painel azul dos bornes + zona amarela
  rr(ctx, 20, 22, 500, 128, 16)
  ctx.fillStyle = grad(ctx, 22, 150, '#3a7fbb', '#285f93')
  ctx.fill()
  rr(ctx, 288, 28, 226, 116, 12)
  ctx.fillStyle = grad(ctx, 28, 144, '#f3cb2c', '#d9a814')
  ctx.fill()

  // diagrama de ligação + terra + aviso
  ctx.strokeStyle = '#0c1c10'
  ctx.lineWidth = 3
  line(ctx, 78, 64, 78, 56)
  line(ctx, 78, 56, 188, 56)
  line(ctx, 188, 56, 188, 64)
  // terra sob GUARD
  line(ctx, 188, 44, 188, 56)
  line(ctx, 178, 56, 198, 56)
  line(ctx, 181, 60, 195, 60)
  line(ctx, 184, 64, 192, 64)
  // triângulo de aviso perto de LINE
  ctx.fillStyle = '#1a1d22'
  tri(ctx, 350, 40, 16)
  ctx.fillStyle = '#f3cb2c'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('!', 350, 62)
  ctx.fillStyle = '#0c1c10'
  ctx.font = 'bold 13px Arial'
  ctx.fillText('CAT III', 258, 70)
  ctx.fillText('600V', 258, 86)

  // furos dos bornes
  for (const h of [HOLES.earth, HOLES.guard, HOLES.line1, HOLES.line2]) {
    circle(ctx, h.x, h.y, 28, '#14171b')
  }

  // rótulos dos bornes
  ctx.font = 'bold 17px Arial'
  ctx.fillStyle = '#f3cb2c'
  ctx.fillText('EARTH', 78, 150)
  ctx.fillText('GUARD', 188, 150)
  ctx.fillStyle = '#14171b'
  ctx.fillText('LINE', 395, 150)

  // marca
  rr(ctx, 22, 166, 496, 56, 10)
  ctx.fillStyle = '#d6d9dc'
  ctx.fill()
  // logo (montanha)
  ctx.fillStyle = '#c0282d'
  tri(ctx, 50, 196, 16)
  ctx.fillStyle = '#7a1518'
  tri(ctx, 50, 200, 9)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#2a2f36'
  ctx.font = 'italic bold 24px Arial'
  ctx.fillText('Minipa', 70, 204)
  ctx.font = 'bold 24px Arial'
  ctx.fillText('MI-2705', 178, 204)
  ctx.font = '13px Arial'
  ctx.fillStyle = '#5b6675'
  ctx.textAlign = 'right'
  ctx.fillText('Professional Insulation Tester', 506, 198)

  // LCD
  drawLcd(ctx, 24, 236, 492, 212, d)

  // botoeira
  btn(ctx, 28, 472, 110, 54, '#f3cb2c', '#d9a814', '#3a2e00', 'LIGHT', 18)
  btn(ctx, 28, 536, 110, 54, '#f3cb2c', '#d9a814', '#3a2e00', 'CLEAR', 18)
  btn(ctx, 402, 472, 110, 54, '#3a7fbb', '#285f93', '#ffffff', 'LOAD', 18)
  btn(ctx, 402, 536, 110, 54, '#3a7fbb', '#285f93', '#ffffff', 'SAVE', 18)

  // d-pad
  rr(ctx, 204, 470, 132, 134, 18)
  ctx.fillStyle = '#2b2f35'
  ctx.fill()
  ctx.fillStyle = '#cdd2d8'
  triUp(ctx, 270, 486, 12)
  triUp(ctx, 270, 588, -12)
  triLeft(ctx, 220, 537, 12)
  triLeft(ctx, 320, 537, -12)
  circle(ctx, 270, 537, 24, '#1f242b')
  ctx.fillStyle = '#9fb4d0'
  ctx.font = 'bold 13px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('USB', 270, 542)

  btn(ctx, 28, 614, 98, 40, '#5a6068', '#474d54', '#dfe3e7', 'ON/OFF', 14)
  btn(ctx, 132, 614, 80, 40, '#5a6068', '#474d54', '#dfe3e7', 'COMP', 14)
  btn(ctx, 218, 614, 80, 40, '#5a6068', '#474d54', '#dfe3e7', 'TIME', 14)

  // TEST
  const tg = ctx.createRadialGradient(420, 596, 8, 432, 608, 60)
  tg.addColorStop(0, d.energizado ? '#c3ddc8' : '#b6d2bb')
  tg.addColorStop(1, '#7e9b86')
  circle(ctx, 440, 606, 56, tg)
  ctx.strokeStyle = '#22262b'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(440, 606, 56, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#22351f'
  ctx.font = 'bold 22px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('TEST', 440, 614)

  btn(ctx, 28, 660, 60, 16, '#5a6068', '#474d54', '#dfe3e7', 'IR', 11)
  btn(ctx, 94, 660, 70, 16, '#5a6068', '#474d54', '#dfe3e7', 'DCV', 11)
  btn(ctx, 170, 660, 70, 16, '#5a6068', '#474d54', '#dfe3e7', 'ACV', 11)
  ctx.fillStyle = '#9aa3ad'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('CE', 290, 674)
  ctx.font = '10px Arial'
  ctx.fillText('PUSH 1 SEC TO TEST', 360, 674)
}

function drawLcd(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, d: FaceData) {
  // moldura + fundo backlit
  rr(ctx, x, y, w, h, 10)
  ctx.fillStyle = '#0a1c1b'
  ctx.fill()
  const ix = x + 6
  const iy = y + 6
  const iw = w - 12
  const ih = h - 12
  rr(ctx, ix, iy, iw, ih, 6)
  ctx.fillStyle = d.energizado ? '#aedbd6' : '#9fc6c2'
  ctx.fill()

  const dark = '#0d2b29'
  const faint = '#5f938e'
  ctx.save()
  ctx.beginPath()
  ctx.rect(ix, iy, iw, ih)
  ctx.clip()
  ctx.translate(ix, iy)

  // bateria
  ctx.strokeStyle = dark
  ctx.lineWidth = 2
  ctx.strokeRect(12, 10, 34, 16)
  ctx.fillStyle = dark
  ctx.fillRect(46, 14, 4, 8)
  for (let i = 0; i < 3; i++) ctx.fillRect(16 + i * 10, 13, 7, 10)

  // escala (rótulos)
  const escala = ['0', '100K', '1M', '10M', '100M', '1G', '10G', '1000G', '1T', '∞']
  const x0 = 30
  const x1 = iw - 24
  ctx.font = '11px Arial'
  ctx.textAlign = 'center'
  ctx.fillStyle = dark
  escala.forEach((s, i) => {
    const t = i / (escala.length - 1)
    ctx.fillText(s, x0 + t * (x1 - x0), 14)
  })

  // bargraph em arco
  const pos = d.idle || d.leitura <= 0 ? 0 : clamp((Math.log10(d.leitura * 1e6) - 5) / 7, 0, 1)
  const N = 34
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const px = x0 + t * (x1 - x0)
    const py = 34 - Math.sin(t * Math.PI) * 12
    const on = t <= pos
    ctx.strokeStyle = on ? dark : faint
    ctx.lineWidth = on ? 5 : 3
    line(ctx, px, py, px, py + (on ? 20 : 12))
  }

  // tensão + alta tensão
  ctx.fillStyle = dark
  boltSymbol(ctx, iw / 2 - 70, 92)
  ctx.font = 'bold 30px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`${d.tensao}v`, iw / 2 - 52, 100)

  // leitura grande + unidade
  const valor = d.idle ? 'OL.' : valorCurto(d.leitura)
  const unidade = d.idle || d.leitura >= 1000 ? 'GΩ' : 'MΩ'
  ctx.textAlign = 'right'
  ctx.font = 'bold 70px "JetBrains Mono", monospace'
  ctx.fillText(valor, iw - 18, 150)
  ctx.font = 'bold 26px "JetBrains Mono", monospace'
  ctx.fillText(unidade, iw - 16, 100)

  // coluna esquerda
  ctx.textAlign = 'left'
  ctx.font = 'bold 20px "JetBrains Mono", monospace'
  ctx.fillText('0', 16, 108)
  const mm = Math.floor(d.tempo / 60)
  const ss = Math.floor(d.tempo % 60)
  ctx.font = 'bold 26px "JetBrains Mono", monospace'
  ctx.fillText(`${pad(mm)}:${pad(ss)}`, 16, 156)
  ctx.font = '11px Arial'
  ctx.fillText('min:sec', 16, 172)

  ctx.restore()
}

/* ---------- helpers ---------- */
function grad(ctx: CanvasRenderingContext2D, y0: number, y1: number, a: string, b: string) {
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  g.addColorStop(0, a)
  g.addColorStop(1, b)
  return g
}
function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string | CanvasGradient) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}
function tri(ctx: CanvasRenderingContext2D, cx: number, baseY: number, half: number) {
  ctx.beginPath()
  ctx.moveTo(cx, baseY - half * 1.4)
  ctx.lineTo(cx - half, baseY)
  ctx.lineTo(cx + half, baseY)
  ctx.closePath()
  ctx.fill()
}
function triUp(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx - s, cy + s)
  ctx.lineTo(cx + s, cy + s)
  ctx.closePath()
  ctx.fill()
}
function triLeft(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + s, cy - s)
  ctx.lineTo(cx + s, cy + s)
  ctx.closePath()
  ctx.fill()
}
function boltSymbol(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath()
  ctx.moveTo(x + 6, y - 16)
  ctx.lineTo(x - 4, y + 2)
  ctx.lineTo(x + 2, y + 2)
  ctx.lineTo(x - 2, y + 16)
  ctx.lineTo(x + 10, y - 6)
  ctx.lineTo(x + 2, y - 6)
  ctx.closePath()
  ctx.fill()
}
function btn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  a: string,
  b: string,
  fg: string,
  label: string,
  fs: number,
) {
  rr(ctx, x, y, w, h, 6)
  ctx.fillStyle = grad(ctx, y, y + h, a, b)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = fg
  ctx.font = `bold ${fs}px Arial`
  ctx.textAlign = 'center'
  ctx.fillText(label, x + w / 2, y + h / 2 + fs / 3)
}
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}
function pad(n: number) {
  return String(n).padStart(2, '0')
}
function valorCurto(mohm: number): string {
  if (mohm >= 1000) return (mohm / 1000).toFixed(2).replace('.', ',')
  if (mohm >= 100) return mohm.toFixed(0)
  if (mohm >= 10) return mohm.toFixed(1).replace('.', ',')
  return mohm.toFixed(2).replace('.', ',')
}

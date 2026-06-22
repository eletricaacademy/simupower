import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useSim } from '../sim/store'
import { drawMeggerFace, FACE_W, FACE_H, HOLES } from './meggerFaceCanvas'

// Dimensões reais do MI-2705: 202 (comprimento) × 155 (largura) × 94 (espessura) mm,
// mantendo a escala da cena (~4×): largura W de referência, D e Hh nas proporções reais.
const W = 0.434 // largura (70% do tamanho anterior de 0.62)
const D = (W * 202) / 155 // comprimento (proporção real 202/155)
const Hh = (W * 94) / 155 // espessura (proporção real 94/155)
const TOPY = Hh

/** px da face → coords locais do corpo. */
const xL = (px: number) => (px / FACE_W - 0.5) * W
const zL = (py: number) => (py / FACE_H - 0.5) * D

/** Posição de mundo (frame da bancada) onde o megômetro fica assentado. */
export const MEGGER_POS: [number, number, number] = [1.15, 0, 0.4]
const BORNE_Y = Hh + 0.05
export const MEGGER_BORNE_E: [number, number, number] = [
  MEGGER_POS[0] + xL(HOLES.earth.x),
  BORNE_Y,
  MEGGER_POS[2] + zL(HOLES.earth.y),
]
export const MEGGER_BORNE_L: [number, number, number] = [
  MEGGER_POS[0] + xL(HOLES.line2.x),
  BORNE_Y,
  MEGGER_POS[2] + zL(HOLES.line2.y),
]

const CORPO = '#3a3f45'
const RUBBER = '#23272c'
const AMARELO = '#e6b81c'

/**
 * Megger — Minipa MI-2705. A face é desenhada em Canvas 2D (CanvasTexture)
 * impressa no corpo 3D — inclui o LCD ao vivo (redesenhado quando os valores
 * mudam). Bornes são postes 3D nos furos. Assenta deitado na bancada.
 */
export function Megger() {
  const energizado = useSim((s) => s.energizado)
  const leitura = useSim((s) => s.leituraAtual)
  const tensao = useSim((s) => s.tensao)
  const tempo = useSim((s) => s.tempo)
  const fase = useSim((s) => s.fase)

  const { texture, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = FACE_W
    canvas.height = FACE_H
    const context = canvas.getContext('2d')
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return { texture: t, ctx: context }
  }, [])

  // redesenha a face (incl. LCD) quando o estado muda
  useEffect(() => {
    if (!ctx) return
    drawMeggerFace(ctx, { leitura, tensao, tempo, idle: fase === 'idle', energizado })
    texture.needsUpdate = true
  }, [ctx, texture, leitura, tensao, tempo, fase, energizado])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group position={MEGGER_POS}>
      {/* corpo */}
      <mesh castShadow receiveShadow position={[0, Hh / 2, 0]}>
        <boxGeometry args={[W, Hh, D]} />
        <meshStandardMaterial color={CORPO} metalness={0.25} roughness={0.7} />
      </mesh>

      {/* face texturizada (plano sobre o topo) — matte, p/ não estourar no bloom */}
      <mesh position={[0, TOPY + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0} />
      </mesh>

      {/* cantoneiras de borracha */}
      {(
        [
          [W / 2, D / 2],
          [-W / 2, D / 2],
          [W / 2, -D / 2],
          [-W / 2, -D / 2],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, Hh / 2, z]}>
          <boxGeometry args={[0.06, Hh + 0.02, 0.06]} />
          <meshStandardMaterial color={RUBBER} roughness={0.85} />
        </mesh>
      ))}

      {/* tampa lateral (tilt-stand) */}
      <mesh position={[W / 2 + 0.015, Hh / 2, -0.05]} castShadow>
        <boxGeometry args={[0.04, Hh * 0.8, D * 0.7]} />
        <meshStandardMaterial color={RUBBER} roughness={0.8} />
      </mesh>

      {/* postes dos bornes */}
      <Terminal x={xL(HOLES.earth.x)} z={zL(HOLES.earth.y)} cor="#15181c" />
      <Terminal x={xL(HOLES.guard.x)} z={zL(HOLES.guard.y)} cor="#15181c" />
      <Terminal x={xL(HOLES.line1.x)} z={zL(HOLES.line1.y)} cor={AMARELO} aro />
      <Terminal x={xL(HOLES.line2.x)} z={zL(HOLES.line2.y)} cor={AMARELO} aro />
    </group>
  )
}

function Terminal({ x, z, cor, aro = false }: { x: number; z: number; cor: string; aro?: boolean }) {
  return (
    <group position={[x, TOPY + 0.03, z]}>
      {aro && (
        <mesh position={[0, -0.025, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.012, 18]} />
          <meshStandardMaterial color={AMARELO} metalness={0.3} roughness={0.5} />
        </mesh>
      )}
      <mesh castShadow>
        <cylinderGeometry args={[0.032, 0.036, 0.06, 18]} />
        <meshStandardMaterial color={cor} metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.012, 14]} />
        <meshStandardMaterial color="#c9ccce" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

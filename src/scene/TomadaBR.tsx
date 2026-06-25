import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Tomada padrão brasileiro (NBR 14136) — construída em geometria pura (não é
 * GLB), para ser realista E controlável (cada tomada é uma instância, pronta
 * para receber a animação do multímetro depois).
 *
 * Espelho/placa 4×2" (levemente aumentado a pedido do Pablo): ~80 × 125 mm,
 * branco, com recesso redondo central (soquete 2P+T): 2 furos de fase/neutro
 * a 19 mm + 1 furo de terra (triângulo), e 2 parafusos.
 *
 * Montada na parede +x: fundo na parede, frente (furos) p/ a sala. O grupo é
 * girado -90° em Y para a face frontal (+Z local) apontar p/ -x (sala).
 */
// Placa ~quadrada (como a foto de referência do Pablo), branca, sem parafusos.
const W = 0.084 // largura da placa (m)
const H = 0.092 // altura da placa (m)
const D = 0.011 // espessura/saliência da placa (m)
const R_PLACA = 0.008 // raio dos cantos
// NBR 14136 / IEC 60906-1: recesso redondo com CHANFRO LARGO (funil) e fundo
// claro; furos dos pinos Ø4,8mm; fase/neutro a 19mm; terra 3mm abaixo.
const R_RECESSO = 0.024 // raio da BOCA do recesso (Ø48mm)
const R_FUNDO = 0.020 // raio do FUNDO do recesso (chanfro suave)
const PROF_RECESSO = 0.0035 // profundidade do recesso (RASO — fundo claro e furos visíveis)
const R_FURO = 0.0024 // raio dos furos dos pinos (~Ø4,8mm)
const SEP_PINOS = 0.019 // distância entre os pinos fase/neutro (NBR 14136)
const OFFSET_TERRA = 0.003 // deslocamento do furo de terra abaixo da linha dos pinos

/** Shape de retângulo arredondado (no plano XY). */
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/** Geometria do espelho (placa com furo redondo central), extrudada em +Z. */
function usePlacaGeo() {
  return useMemo(() => {
    const shape = roundedRect(W, H, R_PLACA)
    const furo = new THREE.Path()
    furo.absarc(0, 0, R_RECESSO, 0, Math.PI * 2, true)
    shape.holes.push(furo)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: D,
      bevelEnabled: true,
      bevelThickness: 0.0012,
      bevelSize: 0.0012,
      bevelSegments: 2,
      curveSegments: 24,
    })
    geo.translate(0, 0, -D / 2) // centraliza a espessura na origem
    return geo
  }, [])
}

/** Uma tomada NBR 14136 (face frontal em +Z, centrada na origem). */
function OutletGeom() {
  const placaGeo = usePlacaGeo()
  const frente = D / 2
  const fundoZ = frente - PROF_RECESSO // plano do fundo do recesso
  // furos: 2 pinos (fase/neutro) na horizontal + terra 3mm abaixo (triângulo raso)
  const furos: [number, number][] = [
    [-SEP_PINOS / 2, OFFSET_TERRA / 2],
    [SEP_PINOS / 2, OFFSET_TERRA / 2],
    [0, -OFFSET_TERRA - OFFSET_TERRA / 2],
  ]
  return (
    <group>
      {/* placa branca (com furo redondo central) */}
      <mesh geometry={placaGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#f3f2ee" roughness={0.5} metalness={0.02} />
      </mesh>

      {/* funil chanfrado do recesso (cone aberto, da boca até o fundo) — claro */}
      <mesh position={[0, 0, frente - PROF_RECESSO / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[R_FUNDO, R_RECESSO, PROF_RECESSO, 56, 1, true]} />
        <meshStandardMaterial color="#eeece7" roughness={0.55} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* fundo do recesso (disco claro — superfície onde ficam os furos) */}
      <mesh position={[0, 0, fundoZ]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[R_FUNDO, R_FUNDO, 0.001, 56]} />
        <meshStandardMaterial color="#f1efe9" roughness={0.55} metalness={0} />
      </mesh>

      {/* 3 furos (pinos) escuros, rasos, no fundo do recesso (visíveis de frente) */}
      {furos.map(([x, y], i) => (
        <mesh key={i} position={[x, y, fundoZ - 0.0015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[R_FURO, R_FURO, 0.004, 20]} />
          <meshStandardMaterial color="#15151a" roughness={0.75} metalness={0.05} />
        </mesh>
      ))}
    </group>
  )
}

/** Tomada posicionada na parede +x, face p/ a sala (-x). `z` = posição na parede. */
export function TomadaBR({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      <OutletGeom />
    </group>
  )
}

/**
 * Conjunto de tomadas procedurais ao lado da tomada-objeto (z=3.30), espaçadas
 * 20 cm, mesma parede (x≈6.22) e altura (1,20 m). IDs prontos para o fluxo de
 * teste/animação do multímetro.
 */
const WALL_X = 6.22
const Y = 1.2
const BACK = D / 2 // recuo p/ o fundo da placa encostar na parede

/** Parâmetros de montagem das tomadas BR (reusados pelo Fluke p/ alinhar). */
export const TOMADA_BR = { wallX: WALL_X, y: Y, frenteX: WALL_X - D } // frenteX ≈ face do soquete

export const TOMADAS_BR: { id: string; z: number }[] = [
  { id: 'tomada-br-1', z: 3.1 },
  { id: 'tomada-br-2', z: 2.9 },
  { id: 'tomada-br-3', z: 2.7 },
]

/** Posição-mundo do soquete (frente) de uma tomada BR pelo id. */
export function posSoqueteBR(id: string): [number, number, number] {
  const t = TOMADAS_BR.find((x) => x.id === id) ?? TOMADAS_BR[0]
  return [TOMADA_BR.frenteX, TOMADA_BR.y, t.z]
}

/**
 * Posição-mundo dos 3 FUROS (fase/neutro/terra) do soquete de uma tomada BR.
 * O grupo da tomada é girado -90° em Y; furos locais (hx, hy) → mundo
 * [frenteX, y+hy, z+hx]. fase/neutro = pinos a ±SEP/2; terra abaixo.
 */
export function posFurosBR(id: string): {
  fase: [number, number, number]
  neutro: [number, number, number]
  terra: [number, number, number]
} {
  const t = TOMADAS_BR.find((x) => x.id === id) ?? TOMADAS_BR[0]
  const x = TOMADA_BR.frenteX
  const yPino = TOMADA_BR.y + OFFSET_TERRA / 2 // ≈ +0,0015
  const yTerra = TOMADA_BR.y - OFFSET_TERRA - OFFSET_TERRA / 2 // ≈ -0,0045
  return {
    fase: [x, yPino, t.z + SEP_PINOS / 2],
    neutro: [x, yPino, t.z - SEP_PINOS / 2],
    terra: [x, yTerra, t.z],
  }
}

export function TomadasBR() {
  return (
    <>
      {TOMADAS_BR.map((t) => (
        <TomadaBR key={t.id} position={[WALL_X - BACK, Y, t.z]} />
      ))}
    </>
  )
}

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSim } from '../sim/store'
import { color } from '../design/tokens'
import { MEGGER_POS } from './Megger'
import type { Vec3 } from '../catalog/types'

/**
 * MotorElements — apoios visuais 3D dos primeiros passos do ensaio de
 * isolamento: cadeado LOTO na caixa de bornes, bastão de descarga (com faísca)
 * nos terminais e destaque da tensão no megômetro.
 */
export function MotorElements() {
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const cumpridos = useSim((s) => s.cumpridos)
  const tensao = useSim((s) => s.tensao)
  const invalidate = useThree((s) => s.invalidate)

  const anchor = (id: string): Vec3 =>
    equipamento.anchors.find((a) => a.id === id)?.pos ?? [0, 0, 0]
  const id = ensaio.steps[passoIndex]?.id

  const bloqueado = !!cumpridos['s1-loto']
  const descargaOn = id === 's2-descarga-inicial' || id === 's7-descarga-final'
  const tensaoOn = id === 's3-tensao'

  // bombeia quadros enquanto há animação (frameloop 'demand')
  useEffect(() => {
    if (!descargaOn && !tensaoOn) return
    let raf = 0
    const tick = () => {
      invalidate()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [descargaOn, tensaoOn, invalidate])

  return (
    <group>
      {bloqueado && <Cadeado pos={anchor('borne-u')} />}
      {descargaOn && <Descarga pos={anchor('borne-u')} />}
      {tensaoOn && <DestaqueTensao tensao={tensao} />}
    </group>
  )
}

/** Cadeado LOTO na caixa de bornes. */
function Cadeado({ pos }: { pos: Vec3 }) {
  return (
    <group position={[pos[0] + 0.06, pos[1], pos[2] + 0.05]}>
      <mesh castShadow>
        <boxGeometry args={[0.07, 0.09, 0.035]} />
        <meshStandardMaterial color={color.accent} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.024, 0.008, 10, 20, Math.PI]} />
        <meshStandardMaterial color="#cdd0d3" metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Bastão de aterramento p/ descarga + faísca pulsante no terminal. */
function Descarga({ pos }: { pos: Vec3 }) {
  const spark = useRef<THREE.MeshStandardMaterial>(null)
  const luz = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const t = performance.now() / 70
    const i = 0.5 + 0.5 * Math.sin(t) * Math.sin(t * 1.7)
    if (spark.current) spark.current.emissiveIntensity = 0.4 + 3 * i
    if (luz.current) luz.current.intensity = 0.2 + 1.6 * i
  })

  const va = new THREE.Vector3(...pos)
  const vb = new THREE.Vector3(pos[0] + 0.18, 0.02, pos[2] + 0.18) // até a bancada
  const meio = va.clone().lerp(vb, 0.5)
  const len = va.distanceTo(vb)
  const dir = vb.clone().sub(va).normalize()
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)

  return (
    <group>
      {/* haste/cabo de aterramento */}
      <mesh position={meio.toArray()} quaternion={quat}>
        <cylinderGeometry args={[0.01, 0.01, len, 8]} />
        <meshStandardMaterial color="#2c7a3f" roughness={0.6} />
      </mesh>
      {/* grampo no terminal */}
      <mesh position={pos}>
        <boxGeometry args={[0.04, 0.035, 0.03]} />
        <meshStandardMaterial color="#bfa23a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* faísca */}
      <mesh position={pos}>
        <sphereGeometry args={[0.016, 12, 12]} />
        <meshStandardMaterial ref={spark} color="#bfe3ff" emissive="#7fc8ff" emissiveIntensity={1.5} />
      </mesh>
      <pointLight ref={luz} position={pos} color="#9fd4ff" intensity={0.6} distance={0.8} />
    </group>
  )
}

/** Destaque do megômetro com a tensão de ensaio selecionada. */
function DestaqueTensao({ tensao }: { tensao: number }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const s = 1 + 0.12 * (0.5 + 0.5 * Math.sin(performance.now() / 280))
    if (ring.current) ring.current.scale.setScalar(s)
  })
  const p = MEGGER_POS
  return (
    <group position={[p[0], p[1] + 0.34, p[2]]}>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.012, 12, 28]} />
        <meshStandardMaterial color={color.accent} emissive={color.accent} emissiveIntensity={1.4} />
      </mesh>
      <Html center distanceFactor={2.4} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            fontSize: 16,
            color: '#0B0F14',
            background: color.accent,
            padding: '4px 10px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            boxShadow: `0 0 16px ${color.accent}`,
          }}
        >
          {tensao} V
        </div>
      </Html>
    </group>
  )
}

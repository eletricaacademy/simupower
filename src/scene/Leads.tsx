import { useMemo } from 'react'
import * as THREE from 'three'
import { useSim } from '../sim/store'
import { color } from '../design/tokens'
import { MEGGER_BORNE_L, MEGGER_BORNE_E } from './Megger'
import type { Vec3 } from '../catalog/types'

/**
 * Leads — ponteiras (tubos) que APARECEM ao conectar e BRILHAM (emissive →
 * bloom) quando energizadas. Curva em arco entre o borne do megômetro e a
 * âncora correspondente do equipamento.
 */
export function Leads() {
  const equipamento = useSim((s) => s.equipamento)
  const earthOn = useSim((s) => s.earthConectado)
  const lineOn = useSim((s) => s.lineConectado)
  const energizado = useSim((s) => s.energizado)

  const earthAnchor = equipamento.anchors.find((a) => a.papel === 'earth')
  const lineAnchor = equipamento.anchors.find((a) => a.papel === 'line')

  return (
    <group>
      {earthOn && earthAnchor && (
        <Lead
          from={MEGGER_BORNE_E}
          to={earthAnchor.pos}
          cor="#9aa3ad"
          emissivo={energizado}
          emissiveCor={color.accent}
        />
      )}
      {lineOn && lineAnchor && (
        <Lead
          from={MEGGER_BORNE_L}
          to={lineAnchor.pos}
          cor="#d05b5b"
          emissivo={energizado}
          emissiveCor={color.accent}
        />
      )}
    </group>
  )
}

function Lead({
  from,
  to,
  cor,
  emissivo,
  emissiveCor,
}: {
  from: Vec3
  to: Vec3
  cor: string
  emissivo: boolean
  emissiveCor: string
}) {
  const { geometry, endPos, quat } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const mid = a.clone().lerp(b, 0.5)
    // arco com leve queda por gravidade
    const lift = a.distanceTo(b) * 0.28
    mid.y -= lift * 0.4
    const ctrl1 = a.clone().lerp(mid, 0.5)
    ctrl1.y += lift * 0.5
    const ctrl2 = b.clone().lerp(mid, 0.5)
    ctrl2.y += lift * 0.5
    const curve = new THREE.CatmullRomCurve3([a, ctrl1, mid, ctrl2, b])
    const tan = curve.getTangent(1).normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan)
    // o tubo termina um pouco antes para a garra "morder" o terminal
    return {
      geometry: new THREE.TubeGeometry(curve, 48, 0.012, 10, false),
      endPos: b,
      quat: q,
    }
  }, [from, to])

  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color={cor}
          emissive={emissivo ? emissiveCor : '#000000'}
          emissiveIntensity={emissivo ? 1.6 : 0}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      <Garra position={endPos} quaternion={quat} cor={cor} emissivo={emissivo} emissiveCor={emissiveCor} />
    </group>
  )
}

/**
 * Garra tipo jacaré na ponta do cabo. +Z (quaternion) aponta para o terminal;
 * o corpo fica todo no lado do cabo (-Z) e só a ponta das mandíbulas "morde" a
 * superfície, para não enterrar no equipamento.
 */
function Garra({
  position,
  quaternion,
  cor,
  emissivo,
  emissiveCor,
}: {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  cor: string
  emissivo: boolean
  emissiveCor: string
}) {
  const METAL = '#cdd0d3'
  return (
    <group position={position} quaternion={quaternion}>
      {/* capa isolante (cor do cabo) — lado do cabo */}
      <mesh position={[0, 0, -0.14]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.04, 0.14, 14]} />
        <meshStandardMaterial
          color={cor}
          emissive={emissivo ? emissiveCor : '#000000'}
          emissiveIntensity={emissivo ? 0.8 : 0}
          metalness={0.2}
          roughness={0.5}
        />
      </mesh>
      {/* corpo metálico */}
      <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.026, 0.06, 14]} />
        <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* mandíbula superior (afilada) */}
      <mesh position={[0, 0.02, 0.0]} rotation={[-0.22, 0, 0]} castShadow>
        <boxGeometry args={[0.026, 0.016, 0.13]} />
        <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* mandíbula inferior */}
      <mesh position={[0, -0.02, 0.0]} rotation={[0.22, 0, 0]} castShadow>
        <boxGeometry args={[0.026, 0.016, 0.13]} />
        <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* parafuso/pivô */}
      <mesh position={[0, 0, -0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.06, 10]} />
        <meshStandardMaterial color="#3f444b" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}

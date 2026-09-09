import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getDiagnosticoSPDA, SPDA_DIAGNOSTICOS } from '../catalog/spdaDiagnostico'
import { useSpdaDiagnostico } from '../sim/spdaDiagnosticoStore'
import { color } from '../design/tokens'

/** Marcador da parada fotográfica ativa; não participa da medição elétrica. */
export function SpdaDiagnostico() {
  const ativo = useSpdaDiagnostico((s) => s.ativo)
  const item = getDiagnosticoSPDA(ativo)
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3.2) * 0.14)
  })

  if (!item) return null
  const indice = SPDA_DIAGNOSTICOS.findIndex((p) => p.id === item.id) + 1
  const cor = item.tipo === 'verificacao' ? color.accentCool : color.status.marginal

  return <group position={item.ancora}>
    <mesh ref={ref} renderOrder={20}>
      <sphereGeometry args={[0.14, 18, 12]} />
      <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.55} depthTest={false} />
    </mesh>
    <Html position={[0, 0.42, 0]} center style={{ pointerEvents: 'none' }}>
      <span style={{ display: 'block', whiteSpace: 'nowrap', padding: '5px 9px', borderRadius: 6, background: color.surface, color: cor, border: `1px solid ${cor}`, fontSize: 12, fontWeight: 700 }}>
        Parada {indice} - {item.local}
      </span>
    </Html>
  </group>
}

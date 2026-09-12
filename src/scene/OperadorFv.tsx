import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'
import type { Vec3 } from '../catalog/types'
import { prepararOperadorFv, descartarOperadorFv } from './operadorFvModelo'

export function OperadorFv({ pos, alvo, passo, cor }: { pos: Vec3; alvo?: Vec3; passo: boolean; cor: string }) {
  const { scene } = useGLTF(asset('models/colaborador.glb'))
  const giro = alvo ? Math.atan2(alvo[0] - pos[0], alvo[2] - pos[2]) : 0
  const modelo = useMemo(() => prepararOperadorFv(scene, passo, alvo ? new THREE.Vector3(0, alvo[1] - pos[1], Math.hypot(alvo[0] - pos[0], alvo[2] - pos[2])) : undefined), [scene, passo, pos, alvo])
  useEffect(() => () => descartarOperadorFv(modelo), [modelo])
  return <group position={pos} rotation={[0, giro, 0]}>
    <primitive object={modelo} dispose={null} />
    {[-1, 1].map(s => <mesh key={s} position={[s * (passo ? .5 : .12), .03, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={23}>
      <ringGeometry args={[.13, .18, 20]} />
      <meshBasicMaterial color={cor} transparent opacity={.95} depthTest={false} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>)}
  </group>
}

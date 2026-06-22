import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'

/**
 * Colaborador — operador (homem com viseira) posicionado de frente para o
 * painel no estudo de arco. Escala ajustada à altura do painel (~1,75 m).
 * Recentra X/Z mantendo os pés no piso (y=0); a rotação gira em torno dele.
 */
const ESCALA = 1.45
const POS: [number, number, number] = [0.7, 0, 1.9] // à frente do painel (+Z), à direita
const ROT_Y = Math.PI // de frente para o painel (-Z)

export function Colaborador() {
  const { scene } = useGLTF(asset('models/colaborador.glb'))
  const modelo = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    // recentra X/Z (pés no chão em y=0)
    const box = new THREE.Box3().setFromObject(clone)
    const c = box.getCenter(new THREE.Vector3())
    clone.position.set(-c.x, -box.min.y, -c.z)
    return clone
  }, [scene])

  return (
    <group position={POS} rotation={[0, ROT_Y, 0]} scale={ESCALA}>
      <primitive object={modelo} />
    </group>
  )
}

useGLTF.preload(asset('models/colaborador.glb'))

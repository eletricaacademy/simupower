import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'

/**
 * Tomada (TUG) na parede +x da instalação hospitalar (NBR 5410 — Seção 7).
 *
 * O GLB vem grande demais (~0,32 × 0,44 m). Escalamos para o tamanho REAL de
 * uma placa/tomada padrão do mercado brasileiro: placa 4×2" (NBR 14136),
 * ≈ 70 × 114 mm. Alvo pela ALTURA = 11,4 cm (preserva a proporção do modelo).
 *
 * Montagem (pedido do Pablo): FUNDO encostado na parede, frente p/ a sala, a
 * 1,20 m do piso (altura/centro). Ponto de referência: x≈6.22, z=3,30.
 */
const WALL_X = 6.22 // plano interno da parede +x
const Z = 3.3
const Y_CENTER = 1.2 // altura (centro) da tomada, 1,20 m do piso
const ROT_Y = -Math.PI / 2 // fundo p/ a parede (+x), frente p/ a sala (-x)
const ALTURA_REAL = 0.114 // altura da placa 4×2" padrão (~11,4 cm)

export function Tomada() {
  const { scene } = useGLTF(asset('models/tomada.glb'))
  const { modelo, halfX } = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    root.rotation.y = ROT_Y
    root.updateWorldMatrix(true, true)
    const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3())
    // escala para a altura real de uma placa 4×2 (preserva proporção)
    root.scale.setScalar(ALTURA_REAL / size.y)
    root.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(root)
    const c = new THREE.Vector3()
    box.getCenter(c)
    box.getSize(size)
    root.position.set(root.position.x - c.x, root.position.y - c.y, root.position.z - c.z)
    return { modelo: root, halfX: size.x / 2 }
  }, [scene])

  // face +x (fundo) encosta na parede; centro em Y_CENTER, z=Z.
  return (
    <group position={[WALL_X - halfX, Y_CENTER, Z]}>
      <primitive object={modelo} />
    </group>
  )
}

useGLTF.preload(asset('models/tomada.glb'))

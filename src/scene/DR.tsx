import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'

/**
 * DR (dispositivo diferencial residual) ADICIONADO no ponto [6.22, 1.83, 4.45]
 * do quadro (não remove o disjuntor existente). Modelo dr.glb em ~metros reais
 * (≈36×96×74mm). Face/alavanca p/ a sala (-x); girado 90° (horário) na face.
 */
const POS: [number, number, number] = [6.22, 1.83, 4.43] // -2cm em z (esquerda, de frente)
const ROT_Y = -Math.PI / 2 // face/alavanca p/ a sala (-x); fundo (terminais) p/ a placa
const ROT_SPIN = -Math.PI / 2 // gira 90° horário em torno da normal da face
const ESCALA = 1 // modelo em metros reais
const DX = -0.087 // encostado na placa (-0,067) + 2cm p/ frente (-0,02) = -0,087

export function DR() {
  const { scene } = useGLTF(asset('models/dr.glb'))
  const modelo = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    // centraliza na origem (p/ a rotação girar em torno do centro)
    const box = new THREE.Box3().setFromObject(root)
    const c = box.getCenter(new THREE.Vector3())
    root.position.sub(c)
    return root
  }, [scene])

  return (
    <group position={[POS[0] + DX, POS[1], POS[2]]}>
      <group rotation={[0, ROT_Y, 0]}>
        {/* spin em torno da normal da face (eixo local Z após o ROT_Y) */}
        <group rotation={[0, 0, ROT_SPIN]} scale={ESCALA}>
          <primitive object={modelo} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(asset('models/dr.glb'))

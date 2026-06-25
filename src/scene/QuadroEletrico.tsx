import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'

/**
 * Quadro elétrico de distribuição montado na parede +x da instalação hospitalar
 * (NBR 5410 — Seção 7). Dimensões reais do GLB ≈ 0,61 × 1,00 × 0,84 m.
 *
 * Montagem (pedido do Pablo): FUNDO do quadro encostado na parede (porta voltada
 * p/ a sala) e BASE a 1,60 m do piso.
 */
const WALL_X = 6.22 // plano interno da parede +x
const Z = 4.55
const BASE_Y = 1.6 // distância do piso à base (parte inferior) do quadro
// O modelo tem a PORTA (com disjuntores) na face +z e o FUNDO (liso) na face -z.
// Girando -90° em Y: fundo (-z) aponta p/ +x (parede), porta (+z) aponta p/ -x (sala).
const ROT_Y = -Math.PI / 2

export function QuadroEletrico() {
  const { scene } = useGLTF(asset('models/quadro-eletrico.glb'))
  const { modelo, halfX, halfY } = useMemo(() => {
    const root = scene.clone(true)
    const anodizadas: { mesh: THREE.Mesh; area: number }[] = []
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
        // coleta as malhas da placa de montagem (material "Anodized")
        const mat = Array.isArray(m.material) ? m.material[0] : m.material
        if (mat?.name?.includes('Anodized')) {
          const s = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3())
          const d = [s.x, s.y, s.z].sort((a, b) => b - a)
          anodizadas.push({ mesh: m, area: d[0] * d[1] })
        }
      }
    })
    // PLACA DE FUNDO: a maior malha "Anodized" → laranja (pedido do Pablo).
    anodizadas.sort((a, b) => b.area - a.area)
    const placa = anodizadas[0]?.mesh
    if (placa) {
      const mat = (Array.isArray(placa.material) ? placa.material[0] : placa.material) as THREE.MeshStandardMaterial
      const laranja = mat.clone()
      laranja.map = null
      laranja.color = new THREE.Color('#ef7d18')
      laranja.metalness = 0.15
      laranja.roughness = 0.55
      laranja.needsUpdate = true
      placa.material = laranja
    }
    // rotaciona ANTES de medir, para encostar o fundo na parede
    root.rotation.y = ROT_Y
    root.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(root)
    const c = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(c)
    box.getSize(size)
    // centraliza a geometria na origem (mantém a rotação aplicada)
    root.position.set(root.position.x - c.x, root.position.y - c.y, root.position.z - c.z)
    return { modelo: root, halfX: size.x / 2, halfY: size.y / 2 }
  }, [scene])

  // x: face +x (fundo) encosta na parede; y: base (centro - halfY) em BASE_Y.
  return (
    <group position={[WALL_X - halfX, BASE_Y + halfY, Z]}>
      <primitive object={modelo} />
    </group>
  )
}

useGLTF.preload(asset('models/quadro-eletrico.glb'))

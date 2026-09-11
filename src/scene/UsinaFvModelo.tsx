import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'

/** O GLB é georreferenciado na planta local: não centralizar nem normalizar.
 * Agrupar as cópias da mesma geometria preserva as 540 instâncias dos módulos.
 */
export function instanciarUsina(cena: THREE.Group, detalhe: boolean) {
  cena.updateMatrixWorld(true)
  const lotes = new Map<string, { original: THREE.Mesh; matrizes: THREE.Matrix4[] }>()
  cena.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || (!detalhe && o.name.startsWith('detalhe'))) return
    const materiais = Array.isArray(o.material) ? o.material : [o.material]
    const chave = `${o.geometry.uuid}/${materiais.map(m => m.uuid).join('/')}`
    const lote = lotes.get(chave) ?? { original: o, matrizes: [] as THREE.Matrix4[] }
    lote.matrizes.push(o.matrixWorld.clone())
    lotes.set(chave, lote)
  })
  const grupo = new THREE.Group()
  for (const { original, matrizes } of lotes.values()) {
    const m = new THREE.InstancedMesh(original.geometry, original.material, matrizes.length)
    m.name = original.parent?.name ?? original.name
    if (m.name.startsWith('kit_modulo') && original.name.startsWith('detalhe')) {
      // As linhas subpixel das células geram moiré de longe. Mantê-las só no detalhe próximo.
      const material = (original.material as THREE.MeshStandardMaterial).clone()
      material.transparent = true; material.depthWrite = false
      material.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.a *= 1.0 - smoothstep(20.0, 45.0, length(vViewPosition));\n if (diffuseColor.a < 0.01) discard;')
      }
      material.customProgramCacheKey = () => 'celulas-fv-distancia'
      m.material = material
      m.userData.materialProprio = true
    }
    matrizes.forEach((v, i) => m.setMatrixAt(i, v))
    m.instanceMatrix.needsUpdate = true
    m.castShadow = !original.name.startsWith('detalhe')
    // Lâminas de poucos milímetros não recebem sombra de si mesmas no mapa de 100 m.
    m.receiveShadow = !m.name.startsWith('kit_modulo')
    m.computeBoundingSphere()
    grupo.add(m)
  }
  return grupo
}

function Modelo({ caminho, detalhe, onPick }: { caminho: string; detalhe: boolean; onPick?: (p: THREE.Vector3, nome: string) => void }) {
  const { scene } = useGLTF(asset(caminho))
  const grupo = useMemo(() => instanciarUsina(scene, detalhe), [scene, detalhe])
  useEffect(() => () => {
    // Geometrias e materiais pertencem ao cache GLTF; só os buffers de instância são nossos.
    grupo.children.forEach(o => {
      const m = o as THREE.InstancedMesh
      if (m.userData.materialProprio) (m.material as THREE.Material).dispose()
      m.dispose()
    })
  }, [grupo])
  return <primitive object={grupo} dispose={null} onClick={onPick ? (e: { stopPropagation: () => void; point: THREE.Vector3; object: THREE.Object3D }) => { e.stopPropagation(); onPick(e.point, e.object.name) } : undefined} />
}

class RecuperarModelo extends Component<{ children: ReactNode; fallback: ReactNode }, { falhou: boolean }> {
  state = { falhou: false }
  static getDerivedStateFromError() { return { falhou: true } }
  render() { return this.state.falhou ? this.props.fallback : this.props.children }
}

export function UsinaFvModelo({ caminho, detalhe, fallback, onPick }: { caminho: string; detalhe: boolean; fallback: ReactNode; onPick?: (p: THREE.Vector3, nome: string) => void }) {
  return <RecuperarModelo fallback={fallback}><Suspense fallback={fallback}><Modelo caminho={caminho} detalhe={detalhe} onPick={onPick} /></Suspense></RecuperarModelo>
}

import { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Equipment } from '../catalog/types'
import { asset } from '../lib/asset'
import { color } from '../design/tokens'
import { useSim } from '../sim/store'
import { resolverQualidade } from './quality'

/**
 * Reduz a textura para `maxPx` em runtime (canvas), cortando VRAM em aparelhos
 * fracos sem precisar de um GLB separado. Idempotente e seguro se a imagem já
 * couber no teto. one-time por textura.
 */
function limitarTextura(tex: THREE.Texture, maxPx: number): boolean {
  if (!isFinite(maxPx)) return false
  const img = tex.image as (HTMLImageElement | ImageBitmap | HTMLCanvasElement) | undefined
  const w = (img as { width?: number })?.width ?? 0
  const h = (img as { height?: number })?.height ?? 0
  if (!w || !h) return false
  const maior = Math.max(w, h)
  if (maior <= maxPx) return false
  const escala = maxPx / maior
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * escala))
  canvas.height = Math.max(1, Math.round(h * escala))
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  ctx.drawImage(img as CanvasImageSource, 0, 0, canvas.width, canvas.height)
  tex.image = canvas
  tex.needsUpdate = true
  return true
}

const SLOTS_TEXTURA = ['map', 'roughnessMap', 'metalnessMap', 'aoMap', 'normalMap', 'emissiveMap'] as const

/** Materiais de tela/grade/alambrado que devem usar alpha cutout. */
const RX_TELA = /fenc|lattice|tela|grade|alambrad|malha|mesh|grid|cage|rede|vazad|perfurad/i

/** Materiais de parede/alvenaria (no modelo da subestação = "Color M00"). */
const RX_PAREDE = /color m00|parede|wall|alvenaria|concret|masonry|plaster|reboco|gesso/i

/** Materiais do pórtico/postes de concreto (aterramento). No modelo do pátio
 *  os postes em L usam "DefaultMaterial" (9 instâncias). Calibrável por clique. */
const RX_PORTICO = /portico|p[oó]rtico|gantry|default ?material/i

/**
 * Equipment3D — Carrega o GLB do catálogo, centraliza, normaliza a escala
 * (maior dimensão → escalaAlvo), assenta no chão (y=0) e ativa sombras.
 * Expõe âncoras de conexão como pequenos marcadores discretos.
 */
export function Equipment3D({
  equipment,
  highlightAnchorId,
  ocultarTela = false,
  ocultarParedes = false,
  ocultarPortico = false,
  envIntensity = 0.9,
  pickMode = false,
  onPick,
}: {
  equipment: Equipment
  highlightAnchorId?: string
  /** esconde malhas de tela/grade/alambrado (ex.: durante a inspeção) */
  ocultarTela?: boolean
  /** esconde as paredes (lajes grandes e finas, verticais) do recinto */
  ocultarParedes?: boolean
  /** esconde o pórtico/estrutura metálica (aterramento) */
  ocultarPortico?: boolean
  /** intensidade do reflexo do ambiente nos materiais (brilho) */
  envIntensity?: number
  /** modo identificar peça: clique numa malha reporta sua coord no modelo */
  pickMode?: boolean
  onPick?: (info: { mat: string; raw: [number, number, number] }) => void
}) {
  const { scene } = useGLTF(asset(equipment.modelPath))
  const group = useRef<THREE.Group>(null)
  const pref = useSim((s) => s.qualidadePref)
  const texCapPx = useMemo(() => resolverQualidade(pref).texCapPx, [pref])

  // Clona cena E materiais (e texturas, só quando reduzidas) para o clone ser
  // dono do que descarta — sem mutar o cache compartilhado do useGLTF. No nível
  // 'alto' (texCapPx = Infinity) as texturas seguem compartilhadas (zero cópia).
  const modelo = useMemo(() => {
    const root = scene.clone(true)
    const texturasProprias = new Set<THREE.Texture>()
    const matCache = new Map<THREE.Material, THREE.Material>()

    const prepararMaterial = (m: THREE.Material): THREE.Material => {
      const existente = matCache.get(m)
      if (existente) return existente
      const c = m.clone()
      const std = c as THREE.MeshStandardMaterial
      if (std.isMeshStandardMaterial) {
        std.envMapIntensity = envIntensity
        // recolorir por nome de material (ex.: transformador → cinza)
        const novaCor = equipment.recolor?.[c.name]
        if (novaCor) {
          std.color = new THREE.Color(novaCor)
          std.needsUpdate = true
        }
        // Telas/grades/alambrados: o GLB veio alphaMode OPAQUE e ignora os furos
        // da textura. Aplica ALPHA CUTOUT (alphaTest) — vê-se através, sem bug de
        // ordenação do blend, e roda leve. Casa pelo NOME DO MATERIAL.
        if (RX_TELA.test(c.name) && std.map) {
          std.alphaTest = 0.5
          std.transparent = false
          std.depthWrite = true
          std.side = THREE.DoubleSide
          std.map.needsUpdate = true
          std.needsUpdate = true
        }
        if (isFinite(texCapPx)) {
          for (const slot of SLOTS_TEXTURA) {
            const tex = std[slot] as THREE.Texture | null
            if (!tex) continue
            const clone = tex.clone()
            if (limitarTextura(clone, texCapPx)) {
              std[slot] = clone
              texturasProprias.add(clone)
            }
          }
        }
      }
      matCache.set(m, c)
      return c
    }

    const meshesTela: THREE.Mesh[] = []
    const todas: THREE.Mesh[] = []
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(prepararMaterial)
      else if (mesh.material) mesh.material = prepararMaterial(mesh.material)
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (mats.some((mm) => mm && RX_TELA.test(mm.name))) meshesTela.push(mesh)
      todas.push(mesh)
    })

    // Detecta PAREDES pelo MATERIAL (no modelo da subestação = "Color M00").
    const meshesParede: THREE.Mesh[] = []
    const meshesPortico: THREE.Mesh[] = []
    for (const mh of todas) {
      const mats = Array.isArray(mh.material) ? mh.material : [mh.material]
      const nomes = mats.map((mm) => mm?.name || '')
      if (nomes.some((n) => RX_PORTICO.test(n))) meshesPortico.push(mh)
      if (nomes.some((n) => RX_TELA.test(n))) continue // é tela, não parede
      if (nomes.some((n) => RX_PAREDE.test(n))) meshesParede.push(mh)
    }

    const ud = root.userData as {
      _texturas?: Set<THREE.Texture>
      _tela?: THREE.Mesh[]
      _paredes?: THREE.Mesh[]
      _portico?: THREE.Mesh[]
    }
    ud._texturas = texturasProprias
    ud._tela = meshesTela
    ud._paredes = meshesParede
    ud._portico = meshesPortico
    return root
  }, [scene, texCapPx, envIntensity])

  // mostra/oculta a grade/alambrado
  useEffect(() => {
    const tela = (modelo.userData as { _tela?: THREE.Mesh[] })._tela ?? []
    for (const m of tela) m.visible = !ocultarTela
  }, [modelo, ocultarTela])

  // mostra/oculta as paredes
  useEffect(() => {
    const paredes = (modelo.userData as { _paredes?: THREE.Mesh[] })._paredes ?? []
    for (const m of paredes) m.visible = !ocultarParedes
  }, [modelo, ocultarParedes])

  // mostra/oculta o pórtico/estrutura metálica
  useEffect(() => {
    const portico = (modelo.userData as { _portico?: THREE.Mesh[] })._portico ?? []
    for (const m of portico) m.visible = !ocultarPortico
  }, [modelo, ocultarPortico])

  // Normaliza posição/escala uma vez que o modelo muda.
  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(modelo)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maior = Math.max(size.x, size.y, size.z) || 1
    const escala = equipment.escalaAlvo / maior
    // centraliza no plano XZ e assenta a base em y=0
    const offsetY = -box.min.y * escala
    return {
      escala,
      pos: new THREE.Vector3(-center.x * escala, offsetY, -center.z * escala),
    }
  }, [modelo, equipment.escalaAlvo])

  useEffect(() => {
    const root = modelo
    return () => {
      // libera geometria, materiais clonados e SÓ as texturas que criamos
      // (as compartilhadas com o cache do useGLTF ficam intactas).
      root.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) {
          m.geometry?.dispose()
          const mat = m.material
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
          else mat?.dispose()
        }
      })
      const txs = (root.userData as { _texturas?: Set<THREE.Texture> })._texturas
      txs?.forEach((t) => t.dispose())
    }
  }, [modelo])

  return (
    <group ref={group}>
      <group position={transform.pos} scale={transform.escala}>
        <primitive
          object={modelo}
          onClick={(e: { stopPropagation: () => void; point: THREE.Vector3; object: THREE.Object3D }) => {
            if (!pickMode || !onPick) return
            e.stopPropagation()
            // coord no frame das ÂNCORAS (outer group) — pronta p/ colar no catálogo
            const p = e.point.clone()
            group.current?.worldToLocal(p)
            const mat = ((e.object as THREE.Mesh).material as THREE.Material)?.name || '?'
            onPick({ mat, raw: [p.x, p.y, p.z] })
          }}
        />
      </group>

      {/* marcadores de âncora — discretos, destacam o alvo do passo */}
      {equipment.anchors.map((a) => {
        const ativo = a.id === highlightAnchorId
        const cor = a.papel === 'earth' ? '#1f2937' : color.accentCool
        return (
          <group key={a.id} position={a.pos}>
            <mesh>
              <sphereGeometry args={[ativo ? 0.035 : 0.022, 16, 16]} />
              <meshStandardMaterial
                color={ativo ? color.accent : cor}
                emissive={ativo ? color.accent : '#000000'}
                emissiveIntensity={ativo ? 1.4 : 0}
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>
            {ativo && (
              <mesh>
                <ringGeometry args={[0.05, 0.062, 32]} />
                <meshBasicMaterial color={color.accent} transparent opacity={0.7} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

// pré-carrega o asset padrão
useGLTF.preload(asset('models/electric_motor.glb'))

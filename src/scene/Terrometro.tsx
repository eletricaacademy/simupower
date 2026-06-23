import { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'
import { useAter } from '../sim/aterStore'
import { resistenciaAparente } from '../engine/aterramento'
import { color } from '../design/tokens'

/**
 * Terrometro3D — terrômetro digital Minipa MTR-1522 (modelo real) no pátio do
 * ensaio de aterramento, com visor interativo, tapete marcador, cabos coloridos
 * (E=verde, P=amarelo, C=vermelho — norma) e as 2 hastes auxiliares (P, C).
 * Pontos calibrados por clique (Pablo).
 */
const COMPRIMENTO_M = 0.2 // 20 cm (2× — pedido do Pablo)
const UNIDADES_POR_METRO = 1
const GROUND = 0.8 // nível da grama

// pontos calibrados (clique no HUD)
const POS: [number, number, number] = [2.6, GROUND, 0.61] // terrômetro
const PONTO_MEDICAO: [number, number, number] = [2.51, 0.79, -0.14] // base do trafo (cabo E)
const DIR_PONTO: [number, number, number] = [4.48, GROUND, 1.7] // direção das hastes

// hastes comprimidas (1:2) na direção calibrada: C no ponto clicado, P na metade
const _dx = DIR_PONTO[0] - POS[0]
const _dz = DIR_PONTO[2] - POS[2]
const _len = Math.hypot(_dx, _dz) || 1
const _ux = _dx / _len
const _uz = _dz / _len
const C_STAKE: [number, number, number] = [DIR_PONTO[0], GROUND, DIR_PONTO[2]]
const P_STAKE: [number, number, number] = [POS[0] + _ux * (_len / 2), GROUND, POS[2] + _uz * (_len / 2)]

// origem dos cabos (terminais do aparelho), um pouco acima da base
const ORIGEM: [number, number, number] = [POS[0], POS[1] + 0.06, POS[2]]

const ROT_Y = -0.4
const TAPETE: [number, number] = [0.55, 0.42]
const COR = { E: '#2a9d4a', P: '#e3c423', C: '#c83232' }

function desenharVisor(ctx: CanvasRenderingContext2D, valor: number) {
  const W = 256
  const H = 160
  ctx.fillStyle = '#11160f'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#aebd97'
  ctx.fillRect(10, 10, W - 20, H - 20)
  ctx.fillStyle = '#10180a'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  ctx.font = 'bold 78px "JetBrains Mono", monospace'
  ctx.fillText(valor.toFixed(1), W - 60, H / 2 + 6)
  ctx.font = 'bold 30px "JetBrains Mono", monospace'
  ctx.fillText('Ω', W - 22, H / 2 + 18)
  ctx.textAlign = 'left'
  ctx.font = '600 18px "JetBrains Mono", monospace'
  ctx.fillText('EARTH', 22, 32)
}

/** Cabo flexível entre dois pontos (bezier com leve flecha até o chão). */
function Cabo({ de, para, cor }: { de: [number, number, number]; para: [number, number, number]; cor: string }) {
  const geo = useMemo(() => {
    const a = new THREE.Vector3(...de)
    const b = new THREE.Vector3(...para)
    const mid = a.clone().lerp(b, 0.5)
    mid.y = GROUND + 0.01 // flecha: encosta no chão no meio
    const curva = new THREE.QuadraticBezierCurve3(a, mid, b)
    return new THREE.TubeGeometry(curva, 24, 0.014, 8, false)
  }, [de, para])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={cor} roughness={0.55} metalness={0.05} />
    </mesh>
  )
}

/** Haste auxiliar cravada no solo, com topo na cor do cabo. */
function Haste({ em, cor }: { em: [number, number, number]; cor: string }) {
  return (
    <group position={em}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.011, 0.011, 0.34, 8]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

export function Terrometro3D() {
  const { scene } = useGLTF(asset('models/terrometro-minipa.glb'))
  const modelo = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return c
  }, [scene])

  // escala (comprimento real), assentamento e Y do TOPO real (raycast no centro,
  // pois o bbox pode ter saliência acima do corpo onde fica o visor).
  const { escala, seat, visorY } = useMemo(() => {
    const b = new THREE.Box3().setFromObject(modelo)
    const size = new THREE.Vector3()
    const ctr = new THREE.Vector3()
    b.getSize(size)
    b.getCenter(ctr)
    const maior = Math.max(size.x, size.y, size.z) || 1
    const ray = new THREE.Raycaster(new THREE.Vector3(ctr.x, b.max.y + 1, ctr.z), new THREE.Vector3(0, -1, 0))
    const hit = ray.intersectObject(modelo, true)[0]
    const topLocal = hit ? hit.point.y : b.max.y
    return {
      escala: (COMPRIMENTO_M * UNIDADES_POR_METRO) / maior,
      seat: -b.min.y,
      visorY: topLocal - b.min.y, // no frame do grupo "seat"
    }
  }, [modelo])

  const { tex, ctx } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 160
    const cx = c.getContext('2d')!
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return { tex: t, ctx: cx }
  }, [])
  useEffect(() => () => tex.dispose(), [tex])

  const perfil = useAter((s) => s.perfil)
  const posP = useAter((s) => s.posP)
  const resultado = useAter((s) => s.resultado)
  const leitura = resultado ? resultado.r62 : resistenciaAparente(perfil, posP)
  useEffect(() => {
    desenharVisor(ctx, leitura)
    tex.needsUpdate = true
  }, [leitura, ctx, tex])

  return (
    <>
      <group position={POS}>
        {/* tapete marcador (BRANCO, borda âmbar) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <planeGeometry args={[TAPETE[0] + 0.06, TAPETE[1] + 0.06]} />
          <meshBasicMaterial color={color.accent} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
          <planeGeometry args={TAPETE} />
          <meshStandardMaterial color="#f2f2f2" roughness={0.9} metalness={0} />
        </mesh>

        {/* aparelho em escala real */}
        <group rotation={[0, ROT_Y, 0]} scale={escala}>
          <group position={[0, seat, 0]}>
            <primitive object={modelo} />
            {/* visor encaixado na superfície superior real */}
            <mesh position={[0, visorY + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.62, 0.4]} />
              <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>

      {/* marcador do ponto de medição = eletrodo na base do trafo (cabo E/verde) */}
      <group position={PONTO_MEDICAO}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.2, 8]} />
          <meshStandardMaterial color="#b5894e" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color={COR.E} emissive={COR.E} emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* hastes auxiliares P e C */}
      <Haste em={P_STAKE} cor={COR.P} />
      <Haste em={C_STAKE} cor={COR.C} />

      {/* cabos: E→trafo (verde), P→haste P (amarelo), C→haste C (vermelho) */}
      <Cabo de={ORIGEM} para={PONTO_MEDICAO} cor={COR.E} />
      <Cabo de={ORIGEM} para={[P_STAKE[0], P_STAKE[1] + 0.32, P_STAKE[2]]} cor={COR.P} />
      <Cabo de={ORIGEM} para={[C_STAKE[0], C_STAKE[1] + 0.32, C_STAKE[2]]} cor={COR.C} />
    </>
  )
}

useGLTF.preload(asset('models/terrometro-minipa.glb'))

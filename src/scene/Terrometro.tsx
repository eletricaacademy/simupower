import { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'
import { useSim } from '../sim/store'
import { useAter } from '../sim/aterStore'
import { color } from '../design/tokens'

/**
 * Terrometro3D — terrômetro digital Minipa MTR-1522 (modelo real) no pátio do
 * ensaio de aterramento: tapete marcador, cabos coloridos (E=verde, P=amarelo,
 * C=vermelho) e as 2 hastes auxiliares (P móvel, C fixa). A leitura é mostrada
 * no painel do HUD (sem visor virtual no objeto). Pontos calibrados por clique.
 */
const COMPRIMENTO_M = 0.2 // 20 cm (2× — pedido do Pablo)
const UNIDADES_POR_METRO = 1
const GROUND = 0.8 // nível da grama

// pontos calibrados (clique no HUD)
const POS: [number, number, number] = [2.6, GROUND, 0.61] // terrômetro
const PONTO_MEDICAO: [number, number, number] = [2.51, 0.79, -0.14] // base do trafo (cabo E)
const DIR_PONTO: [number, number, number] = [4.48, GROUND, 1.7] // direção das hastes

// estaca de corrente (C): afastada na direção calibrada (distância aumentada
// p/ separar melhor os eletrodos). A estaca de potencial (P) é MÓVEL entre E e C.
const DIST_FATOR = 1.9
const C_STAKE: [number, number, number] = [
  PONTO_MEDICAO[0] + (DIR_PONTO[0] - PONTO_MEDICAO[0]) * DIST_FATOR,
  GROUND,
  PONTO_MEDICAO[2] + (DIR_PONTO[2] - PONTO_MEDICAO[2]) * DIST_FATOR,
]

// origem dos cabos (terminais do aparelho), um pouco acima da base
const ORIGEM: [number, number, number] = [POS[0], POS[1] + 0.06, POS[2]]

const ROT_Y = -0.4
const TAPETE: [number, number] = [0.55, 0.42]
const COR = { E: '#2a9d4a', P: '#e3c423', C: '#c83232' }

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

  // escala (comprimento real) e assentamento da base
  const { escala, seat } = useMemo(() => {
    const b = new THREE.Box3().setFromObject(modelo)
    const size = new THREE.Vector3()
    b.getSize(size)
    const maior = Math.max(size.x, size.y, size.z) || 1
    return { escala: (COMPRIMENTO_M * UNIDADES_POR_METRO) / maior, seat: -b.min.y }
  }, [modelo])

  const posP = useAter((s) => s.posP)
  // a cena ACOMPANHA os passos: elementos aparecem conforme o procedimento.
  const cumpridos = useSim((s) => s.cumpridos)
  const temTerrometro = !!cumpridos['at-terrometro'] // passo "Posicionar terrômetro"
  const temC = !!cumpridos['at-estaca-c'] // passo "Cravar estaca C"

  // estaca de potencial (P): NÃO é fixa — move entre E e C conforme o slider (posP).
  const pPos: [number, number, number] = [
    PONTO_MEDICAO[0] + (C_STAKE[0] - PONTO_MEDICAO[0]) * posP,
    GROUND,
    PONTO_MEDICAO[2] + (C_STAKE[2] - PONTO_MEDICAO[2]) * posP,
  ]

  return (
    <>
      {temTerrometro && (
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
              </group>
            </group>
          </group>

          {/* eletrodo sob ensaio (E) — onde conecta o cabo E/verde */}
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
          {/* cabo E (verde) → eletrodo */}
          <Cabo de={ORIGEM} para={PONTO_MEDICAO} cor={COR.E} />
        </>
      )}

      {/* estaca de corrente (C) cravada + cabo C (vermelho) */}
      {temC && (
        <>
          <Haste em={C_STAKE} cor={COR.C} />
          <Cabo de={ORIGEM} para={[C_STAKE[0], C_STAKE[1] + 0.32, C_STAKE[2]]} cor={COR.C} />
        </>
      )}

      {/* estaca de potencial (P) — MÓVEL (acompanha o slider) + cabo P (amarelo) */}
      {temC && (
        <>
          <Haste em={pPos} cor={COR.P} />
          <Cabo de={ORIGEM} para={[pPos[0], pPos[1] + 0.32, pPos[2]]} cor={COR.P} />
        </>
      )}
    </>
  )
}

useGLTF.preload(asset('models/terrometro-minipa.glb'))

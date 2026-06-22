import { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'
import { useAter } from '../sim/aterStore'
import { resistenciaAparente } from '../engine/aterramento'
import { color } from '../design/tokens'

/**
 * Terrometro3D — terrômetro digital Minipa MTR-1522 (modelo real) no pátio do
 * ensaio de aterramento, em ESCALA REAL (~10 cm). Cabos pela norma:
 * E=verde(5m), P=amarelo(10m), C=vermelho(20m).
 *
 * Como é uma malha única (o LCD faz parte da textura), o VISOR interativo é um
 * pequeno plano com CanvasTexture sobreposto ao display, redesenhado quando a
 * leitura muda (lê o aterStore). Posição/tamanho do visor = placeholders
 * CALIBRÁVEIS (Pablo ajusta olhando a cena / por clique).
 */
const COMPRIMENTO_M = 0.1 // 10 cm reais (maior dimensão do aparelho)
const UNIDADES_POR_METRO = 1 // ajustar se o mundo não for 1 unidade = 1 m
// posição do terrômetro no pátio (CALIBRAR por clique — ⚙ Terrômetro)
const POS: [number, number, number] = [2.5, 0.8, 0.7]
const ROT_Y = -0.4
// ponto de medição = base do trafo (calibrado por Pablo) — onde o cabo E/verde conecta
const PONTO_MEDICAO: [number, number, number] = [2.51, 0.79, -0.14]
// tapete que sinaliza onde está o terrômetro (em unidades de MUNDO)
const TAPETE: [number, number] = [0.55, 0.42]

// Visor — no frame LOCAL do modelo (antes da escala). Aparelho deitado: face
// para CIMA (+Y). Calibrar olhando a cena.
const VISOR_POS: [number, number, number] = [0, 0.81, 0.1]
const VISOR_ROT: [number, number, number] = [-Math.PI / 2, 0, 0]
const VISOR_SIZE: [number, number] = [0.7, 0.42]

function desenharVisor(ctx: CanvasRenderingContext2D, valor: number) {
  const W = 256
  const H = 160
  // moldura escura + LCD esverdeado (estilo Minipa)
  ctx.fillStyle = '#11160f'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#aebd97'
  ctx.fillRect(10, 10, W - 20, H - 20)
  // valor grande
  ctx.fillStyle = '#10180a'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  ctx.font = 'bold 78px "JetBrains Mono", monospace'
  ctx.fillText(valor.toFixed(1), W - 60, H / 2 + 6)
  ctx.font = 'bold 30px "JetBrains Mono", monospace'
  ctx.fillText('Ω', W - 22, H / 2 + 18)
  // rótulo
  ctx.textAlign = 'left'
  ctx.font = '600 18px "JetBrains Mono", monospace'
  ctx.fillText('EARTH', 22, 32)
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

  // escala p/ comprimento real + assentamento da base
  const { escala, seat } = useMemo(() => {
    const b = new THREE.Box3().setFromObject(modelo)
    const size = new THREE.Vector3()
    b.getSize(size)
    const maior = Math.max(size.x, size.y, size.z) || 1
    return { escala: (COMPRIMENTO_M * UNIDADES_POR_METRO) / maior, seat: -b.min.y }
  }, [modelo])

  // textura de canvas do visor
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
        {/* tapete marcador (mundo) — sinaliza onde está o terrômetro */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <planeGeometry args={[TAPETE[0] + 0.06, TAPETE[1] + 0.06]} />
          <meshBasicMaterial color={color.accent} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
          <planeGeometry args={TAPETE} />
          <meshStandardMaterial color="#23282e" roughness={0.95} metalness={0} />
        </mesh>

        {/* aparelho em escala real */}
        <group rotation={[0, ROT_Y, 0]} scale={escala}>
          <group position={[0, seat, 0]}>
            <primitive object={modelo} />
            <mesh position={VISOR_POS} rotation={VISOR_ROT}>
              <planeGeometry args={VISOR_SIZE} />
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
          <meshStandardMaterial color={color.accent} emissive={color.accent} emissiveIntensity={0.7} />
        </mesh>
      </group>
    </>
  )
}

useGLTF.preload(asset('models/terrometro-minipa.glb'))

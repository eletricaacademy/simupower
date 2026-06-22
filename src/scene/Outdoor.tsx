import { useMemo, useEffect } from 'react'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import type { Tier } from './quality'

/**
 * Outdoor — ambiente externo ensolarado do ensaio de aterramento (pátio a céu
 * aberto). CUSTO ESCALADO PELO NÍVEL DE QUALIDADE (leveza é prioridade):
 *  - céu físico (drei Sky, shader de atmosfera) só em médio/alto; no baixo o
 *    fundo azul do Canvas já dá o "dia claro" sem custo de fragmento;
 *  - sombra: real (passe por quadro) só no alto; médio/baixo usam um "blob"
 *    estático (mancha radial sob o modelo) = custo de render ZERO;
 *  - grama em meshLambertMaterial (a grama cobre muita tela = fill-rate; Lambert
 *    é bem mais barato que PBR nessa área grande).
 * Texturas geradas por canvas (sem asset externo) e liberadas no unmount.
 */

/** Textura de grama procedural (verde com lâminas finas). */
function gerarGrama(detail: boolean): THREE.CanvasTexture {
  const s = detail ? 256 : 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  // verde claro e suave: o gramado deve RECUAR visualmente p/ destacar os
  // equipamentos/hastes/ferramenta (pedido do Pablo). Baixo contraste.
  ctx.fillStyle = '#9ab47e'
  ctx.fillRect(0, 0, s, s)
  const tons = ['#93ad77', '#a6bd8c', '#8da571', '#aec295', '#9bb582']
  const n = detail ? 2600 : 1100
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = tons[(Math.random() * tons.length) | 0]
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 2 + Math.random() * 4)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(detail ? 80 : 40, detail ? 80 : 40)
  tex.anisotropy = detail ? 8 : 1
  return tex
}

/** Mancha de sombra (gradiente radial) — sombra "fake" estática, sem render extra. */
function gerarBlob(): THREE.CanvasTexture {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(18,28,10,0.5)')
  g.addColorStop(0.55, 'rgba(18,28,10,0.22)')
  g.addColorStop(1, 'rgba(18,28,10,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(c)
}

export function Outdoor({
  sun = [14, 20, 9],
  tier,
  groundY = 0,
}: {
  sun?: [number, number, number]
  tier: Tier
  /** altura do chão de grama (alinha com a base visível do modelo) */
  groundY?: number
}) {
  const detail = tier !== 'baixo'
  const temSombraReal = tier === 'alto'
  const grama = useMemo(() => gerarGrama(detail), [detail])
  const blob = useMemo(() => (temSombraReal ? null : gerarBlob()), [temSombraReal])

  // libera a VRAM das texturas ao trocar de ensaio.
  useEffect(() => () => {
    grama.dispose()
    blob?.dispose()
  }, [grama, blob])

  return (
    <>
      {/* céu de atmosfera só onde a GPU aguenta; no baixo o fundo do Canvas basta */}
      {detail && (
        <Sky
          distance={450000}
          sunPosition={sun}
          turbidity={1}
          rayleigh={0.55}
          mieCoefficient={0.002}
          mieDirectionalG={0.7}
        />
      )}

      {/* chão de grama — disco grande p/ encontrar o horizonte. Lambert = barato no fill-rate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY - 0.02, 0]} receiveShadow={temSombraReal}>
        <circleGeometry args={[130, 32]} />
        <meshLambertMaterial map={grama} />
      </mesh>

      {/* sombra estática (médio/baixo) — grounding sem passe de shadow map */}
      {blob && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY + 0.015, 0]} renderOrder={1}>
          <planeGeometry args={[13, 13]} />
          <meshBasicMaterial map={blob} transparent depthWrite={false} />
        </mesh>
      )}
    </>
  )
}

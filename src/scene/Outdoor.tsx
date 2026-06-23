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

/** Textura de BRITA (pedrisco) — CINZA GRANITO, camada fina no piso da subestação. */
function gerarBrita(): THREE.CanvasTexture {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#83868a'
  ctx.fillRect(0, 0, s, s)
  const tons = ['#6f7276', '#9a9da1', '#62656a', '#aeb1b5', '#7b7e82', '#54575c', '#c0c3c6']
  for (let i = 0; i < 3600; i++) {
    ctx.fillStyle = tons[(Math.random() * tons.length) | 0]
    ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(6, 5)
  t.anisotropy = 4
  return t
}

type FachadaTipo = 'predio' | 'galpao' | 'bloco'

/** Texturas de FACHADA (leves, canvas 128², tileáveis) — variações p/ as
 *  edificações de fundo: prédio (janelas), galpão (chapa) e bloco (painéis). */
function gerarFachada(tipo: FachadaTipo): THREE.CanvasTexture {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!

  if (tipo === 'predio') {
    ctx.fillStyle = '#d6d9dd'
    ctx.fillRect(0, 0, s, s)
    // grade de janelas (escuras) com peitoril claro
    const jw = 22, jh = 16, gx = 14, gy = 14
    for (let r = 0; r < 3; r++)
      for (let col = 0; col < 3; col++) {
        const x = gx + col * (jw + 8)
        const y = gy + r * (jh + 10)
        ctx.fillStyle = '#54677b'
        ctx.fillRect(x, y, jw, jh)
        ctx.strokeStyle = 'rgba(38,46,54,0.6)'
        ctx.lineWidth = 1.5
        ctx.strokeRect(x, y, jw, jh)
      }
  } else if (tipo === 'galpao') {
    ctx.fillStyle = '#cfd3d6'
    ctx.fillRect(0, 0, s, s)
    // chapa metálica trapezoidal: faixas horizontais claras/escuras
    for (let y = 0; y < s; y += 8) {
      ctx.fillStyle = (y / 8) % 2 ? 'rgba(120,128,136,0.18)' : 'rgba(255,255,255,0.10)'
      ctx.fillRect(0, y, s, 4)
    }
    // emendas verticais das chapas
    ctx.strokeStyle = 'rgba(110,118,126,0.35)'
    ctx.lineWidth = 1
    for (let x = 0; x <= s; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, s)
      ctx.stroke()
    }
  } else {
    // bloco: painéis de concreto (emendas) + janelas esparsas
    ctx.fillStyle = '#cccfd2'
    ctx.fillRect(0, 0, s, s)
    ctx.strokeStyle = 'rgba(120,126,132,0.4)'
    ctx.lineWidth = 1
    for (let x = 0; x <= s; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke()
    }
    for (let y = 0; y <= s; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke()
    }
    ctx.fillStyle = '#5d6f80'
    for (let r = 0; r < 2; r++)
      for (let col = 0; col < 2; col++) ctx.fillRect(20 + col * 64, 14 + r * 56, 16, 22)
  }

  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

// Cenário de fundo (leve, sem texturas/sombras) — fica LONGE da área de
// trabalho (terrômetro/estacas/cabos, à frente-direita ~x[2,7] z[-1,4]).
const EDIFICIOS: { x: number; z: number; w: number; h: number; d: number; cor: string; tipo: FachadaTipo }[] = [
  // edificações próximas (enquadram a área — atrás e nas laterais)
  { x: -18, z: -15, w: 8, h: 6, d: 7, cor: '#c6c9cd', tipo: 'galpao' },
  { x: -28, z: -22, w: 10, h: 8, d: 8, cor: '#cdd0d4', tipo: 'predio' },
  { x: -6, z: -26, w: 11, h: 7, d: 9, cor: '#c2c5c9', tipo: 'galpao' },
  { x: 14, z: -24, w: 9, h: 9, d: 8, cor: '#cacdd2', tipo: 'bloco' },
  { x: 26, z: -16, w: 8, h: 7, d: 8, cor: '#c4c7cb', tipo: 'predio' },
  { x: -34, z: -6, w: 9, h: 6, d: 10, cor: '#c0c3c8', tipo: 'galpao' },
  { x: -26, z: 14, w: 8, h: 5, d: 8, cor: '#c2c5ca', tipo: 'bloco' },
  // skyline distante (profundidade no horizonte)
  { x: -10, z: -42, w: 14, h: 11, d: 10, cor: '#d2d5d9', tipo: 'predio' },
  { x: 18, z: -40, w: 11, h: 13, d: 9, cor: '#d0d3d7', tipo: 'predio' },
  { x: -34, z: -34, w: 10, h: 9, d: 9, cor: '#cbced2', tipo: 'bloco' },
]
const ARVORES: [number, number][] = [
  [-22, -8], [-30, 4], [-26, 16], [-16, 24], [-6, 30], [9, 30], [20, 26], [28, 14],
  [33, -4], [-12, -26], [11, -30], [24, -22], [-36, -4], [-34, -22], [35, 4], [-20, 28],
]
const POSTES: [number, number][] = [[-40, -25], [40, -20], [-42, 9]]

/** Cenário de fundo: edificações com fachada + árvores + postes distantes. Leve. */
function CenarioFundo({ baseY, detail }: { baseY: number; detail: boolean }) {
  // 3 fachadas base (por tipo), clonadas por prédio com repeat conforme o
  // tamanho. Clones compartilham a imagem → custo desprezível.
  const bases = useMemo(
    () => ({ predio: gerarFachada('predio'), galpao: gerarFachada('galpao'), bloco: gerarFachada('bloco') }),
    [],
  )
  const texFachada = useMemo(
    () =>
      EDIFICIOS.map((b) => {
        const t = bases[b.tipo].clone()
        t.needsUpdate = true
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(Math.max(1, Math.round(b.w / 3.5)), Math.max(1, Math.round(b.h / 3.2)))
        return t
      }),
    [bases],
  )
  useEffect(() => () => {
    Object.values(bases).forEach((t) => t.dispose())
    texFachada.forEach((t) => t.dispose())
  }, [bases, texFachada])

  return (
    <group position={[0, baseY, 0]}>
      {EDIFICIOS.map((b, i) => (
        <mesh key={`e${i}`} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshLambertMaterial map={texFachada[i]} color={b.cor} />
        </mesh>
      ))}
      {detail && (
        <>
          {ARVORES.map(([x, z], i) => (
            <group key={`a${i}`} position={[x, 0, z]}>
              <mesh position={[0, 1.1, 0]}>
                <cylinderGeometry args={[0.16, 0.2, 2.2, 5]} />
                <meshLambertMaterial color="#6b5a3e" />
              </mesh>
              <mesh position={[0, 3, 0]}>
                <coneGeometry args={[1.5, 3.2, 6]} />
                <meshLambertMaterial color="#4f6e3c" />
              </mesh>
            </group>
          ))}
          {POSTES.map(([x, z], i) => (
            <mesh key={`p${i}`} position={[x, 5, z]}>
              <cylinderGeometry args={[0.12, 0.16, 10, 5]} />
              <meshLambertMaterial color="#9aa1a8" />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
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
  const brita = useMemo(() => gerarBrita(), [])
  const blob = useMemo(() => (temSombraReal ? null : gerarBlob()), [temSombraReal])

  // libera a VRAM das texturas ao trocar de ensaio.
  useEffect(() => () => {
    grama.dispose()
    brita.dispose()
    blob?.dispose()
  }, [grama, brita, blob])

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

      {/* BRITA (pedrisco granito) no piso da subestação — camada fina, sobre a grama */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, groundY + 0.004, 0]} receiveShadow={temSombraReal}>
        <planeGeometry args={[8.5, 7]} />
        <meshLambertMaterial map={brita} />
      </mesh>

      {/* contexto de fundo (paisagem) — leve, fora da área de trabalho */}
      <CenarioFundo baseY={groundY} detail={detail} />


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

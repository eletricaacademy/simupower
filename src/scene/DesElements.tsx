import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useSim } from '../sim/store'
import { color } from '../design/tokens'
import type { Vec3 } from '../catalog/types'

/**
 * DesElements — elementos interativos do procedimento de desenergização:
 * um MARCADOR clicável no ponto do passo atual (executa a ação) e os PROPS
 * persistentes (cadeado, aterramento, proteção, placa) conforme o estado.
 */
export function DesElements() {
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const cumpridos = useSim((s) => s.cumpridos)
  const marcarPasso = useSim((s) => s.marcarPasso)
  const setConfirmando = useSim((s) => s.setConfirmando)
  const pickMode = useSim((s) => s.pickMode)

  const anchor = (id?: string): Vec3 | undefined =>
    id ? equipamento.anchors.find((a) => a.id === id)?.pos : undefined

  const passo = ensaio.steps[passoIndex]
  const ehTestar = passo?.acaoTipo === 'testar'
  const ehDisjuntor =
    passo?.acaoTipo === 'seccionar' || passo?.acaoTipo === 'religar' || passo?.acaoTipo === 'carregar-mola'
  // durante a calibração (pickMode) escondemos marcador/vara p/ o clique acertar o modelo
  const markerPos =
    !pickMode && passo && passo.acaoTipo && passo.acaoTipo !== 'confirmar' && !ehTestar && !ehDisjuntor
      ? anchor(passo.focoAnchorId)
      : undefined
  const testePos = !pickMode && ehTestar ? anchor('teste') : undefined
  const disjuntorPos = !pickMode && ehDisjuntor ? anchor('disjuntor') : undefined
  const disjAnchor = anchor('disjuntor')

  // Props aparecem AO ENTRAR na etapa (id atual) ou após concluída, e somem ao
  // serem removidos na reenergização.
  const id = passo?.id
  const seccionado = !!cumpridos['des-seccionar'] && !cumpridos['reen-religar']
  const bloqueado =
    (id === 'des-bloquear' || !!cumpridos['des-bloquear']) && !cumpridos['reen-rem-bloquear']
  const aterrado =
    (id === 'des-aterrar' || !!cumpridos['des-aterrar']) && !cumpridos['reen-rem-aterrar']
  const protegido =
    (id === 'des-proteger' || !!cumpridos['des-proteger']) && !cumpridos['reen-rem-proteger']
  const sinalizado =
    (id === 'des-sinalizar' || !!cumpridos['des-sinalizar']) && !cumpridos['reen-rem-sinalizar']

  return (
    <group>
      {bloqueado && <Loto pos={anchor('bloqueio')!} />}
      {aterrado && <Aterramento pos={anchor('aterramento')!} />}
      {protegido && <Barreira pos={anchor('protecao')!} />}
      {sinalizado && <Placa pos={anchor('sinalizacao')!} />}

      {markerPos && <Marcador pos={markerPos} onClick={() => passo && marcarPasso(passo.id)} />}
      {testePos && <VaraDeteccao pos={testePos} onClick={() => passo && marcarPasso(passo.id)} />}

      {/* luz de estado do disjuntor: vermelho = fechado/energizado, verde = aberto */}
      {disjAnchor && <LuzDisjuntor pos={disjAnchor} seccionado={seccionado} />}
      {/* botão + luva apertando — pede confirmação "Preparado?" antes da manobra */}
      {disjuntorPos && <BotaoDisjuntor pos={disjuntorPos} onClick={() => passo && setConfirmando(passo.id)} />}
    </group>
  )
}

/** Luz de sinalização do disjuntor (IEC 60073): vermelho fechado, verde aberto. */
function LuzDisjuntor({ pos, seccionado }: { pos: Vec3; seccionado: boolean }) {
  const cor = seccionado ? color.status.pass : color.status.fail
  return (
    <group position={[pos[0] + 0.16, pos[1] + 0.16, pos[2]]}>
      <mesh>
        <boxGeometry args={[0.07, 0.05, 0.03]} />
        <meshStandardMaterial color="#16181c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.017, 14, 14]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={1.5} />
      </mesh>
    </group>
  )
}

/** Botão do disjuntor + luva de vaqueta apertando. Clicável. */
function BotaoDisjuntor({ pos, onClick }: { pos: Vec3; onClick: () => void }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (ring.current) {
      const s = 1 + 0.15 * (0.5 + 0.5 * Math.sin(performance.now() / 320))
      ring.current.scale.setScalar(s)
    }
  })
  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* botão */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.034, 0.03, 18]} />
        <meshStandardMaterial color="#c0282d" metalness={0.3} roughness={0.45} />
      </mesh>
      {/* anel pulsante (clicável) */}
      <mesh ref={ring} position={[0, 0, 0.02]}>
        <torusGeometry args={[0.05, 0.008, 10, 24]} />
        <meshStandardMaterial color={color.accent} emissive={color.accent} emissiveIntensity={1.4} />
      </mesh>
      {/* luva de vaqueta apertando o botão (vem da frente) */}
      <LuvaVaqueta position={[0.14, 0.0, 0.18]} rotation={[0.5, -0.6, 0]} />
    </group>
  )
}

/**
 * VaraDeteccao — vara de manobra (laranja) com detector de tensão (vermelho,
 * losango) na ponta e luva segurando a base. A ponta encosta no barramento de
 * MT (anchor 'teste'); o LED pisca enquanto se testa. Clicável para concluir.
 */
function VaraDeteccao({ pos, onClick }: { pos: Vec3; onClick: () => void }) {
  const led = useRef<THREE.MeshStandardMaterial>(null)
  const movel = useRef<THREE.Group>(null)
  const prog = useRef(0) // 0 = embaixo, 1 = encostado no barramento
  const SOBE = 0.75 // quanto a vara sobe (m)
  const DUR = 1.3

  // sobe e encosta ao aparecer; bombeia quadros (funciona em modo demand)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    prog.current = 0
    let raf = 0
    const start = performance.now()
    const tick = () => {
      invalidate()
      if (performance.now() - start < DUR * 1000 + 200) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [invalidate])

  useFrame((_, dt) => {
    if (prog.current < 1) prog.current = Math.min(1, prog.current + dt / DUR)
    const k = 1 - Math.pow(1 - prog.current, 3) // easeOut
    if (movel.current) movel.current.position.y = -SOBE * (1 - k)
    if (led.current) {
      // pisca só depois de encostar
      const piscando = prog.current >= 0.98
      const t = performance.now() / 160
      led.current.emissiveIntensity = piscando ? 1.0 + 1.2 * (0.5 + 0.5 * Math.sin(t)) : 0.15
    }
  })

  // ponta (detector) na origem; base (luva) para baixo/à frente
  const base = new THREE.Vector3(0.25, -1.1, 0.55)
  const len = base.length()
  const dir = base.clone().normalize()
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  const meio = base.clone().multiplyScalar(0.5)
  const bandaPos = dir.clone().multiplyScalar(0.16)

  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onClick() }}>
     <group ref={movel}>
      {/* haste da vara (laranja) */}
      <mesh position={meio} quaternion={quat} castShadow>
        <cylinderGeometry args={[0.018, 0.024, len, 12]} />
        <meshStandardMaterial color="#e8731c" metalness={0.2} roughness={0.5} />
      </mesh>
      {/* banda amarela de limite (perto da ponta) */}
      <mesh position={bandaPos} quaternion={quat}>
        <cylinderGeometry args={[0.025, 0.025, 0.05, 12]} />
        <meshStandardMaterial color="#f3cb2c" roughness={0.5} />
      </mesh>

      {/* detector de tensão (losango vermelho) na ponta */}
      <group>
        <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.085, 0.085, 0.05]} />
          <meshStandardMaterial color="#d63b3b" metalness={0.3} roughness={0.45} />
        </mesh>
        {/* face escura */}
        <mesh position={[0, 0, 0.027]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.055, 0.055, 0.006]} />
          <meshStandardMaterial color="#16181c" roughness={0.4} />
        </mesh>
        {/* LED pisca-pisca */}
        <mesh position={[0, 0.018, 0.032]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial ref={led} color="#ffd24a" emissive="#ffcc33" emissiveIntensity={1.4} />
        </mesh>
      </group>

      {/* luva segurando a base */}
      <Luva pos={base} />
     </group>
    </group>
  )
}

/** Luva isolante (mão estilizada) — cinza. */
function Luva({ pos }: { pos: THREE.Vector3 }) {
  const COR = '#8b9099'
  return (
    <group position={pos}>
      {/* palma */}
      <mesh castShadow>
        <boxGeometry args={[0.09, 0.11, 0.07]} />
        <meshStandardMaterial color={COR} roughness={0.7} />
      </mesh>
      {/* punho da luva */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 0.12, 12]} />
        <meshStandardMaterial color={COR} roughness={0.75} />
      </mesh>
      {/* dedos (envolvendo a haste) */}
      {[-0.03, 0, 0.03].map((x, i) => (
        <mesh key={i} position={[x, 0.07, 0.02]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.022, 0.07, 0.03]} />
          <meshStandardMaterial color={COR} roughness={0.7} />
        </mesh>
      ))}
      {/* polegar */}
      <mesh position={[0.05, 0.02, 0.02]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.022, 0.06, 0.03]} />
        <meshStandardMaterial color={COR} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** Marcador clicável (anel + esfera pulsante) no ponto da ação atual. */
function Marcador({ pos, onClick }: { pos: Vec3; onClick: () => void }) {
  const ring = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(() => {
    const t = performance.now() / 350
    const s = 1 + 0.18 * (0.5 + 0.5 * Math.sin(t))
    if (ring.current) ring.current.scale.setScalar(s)
    if (mat.current) mat.current.emissiveIntensity = 1.2 + 0.8 * (0.5 + 0.5 * Math.sin(t))
  })
  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* alvo invisível maior p/ clique fácil */}
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.012, 12, 28]} />
        <meshStandardMaterial ref={mat} color={color.accent} emissive={color.accent} emissiveIntensity={1.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.022, 14, 14]} />
        <meshStandardMaterial color={color.accent} emissive={color.accent} emissiveIntensity={1.6} />
      </mesh>
    </group>
  )
}

/** Dispositivo LOTO (lockout) na manopla: garra vermelha + cadeado + etiqueta. */
function Loto({ pos }: { pos: Vec3 }) {
  return (
    <group position={pos}>
      {/* garra/hasp vermelha (trava de bloqueio múltiplo) */}
      <mesh castShadow>
        <torusGeometry args={[0.035, 0.012, 10, 24]} />
        <meshStandardMaterial color="#c0282d" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.06, 0]} castShadow>
        <boxGeometry args={[0.05, 0.07, 0.018]} />
        <meshStandardMaterial color="#c0282d" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* furos da garra (3 cadeados) */}
      {[-0.014, 0, 0.014].map((x, i) => (
        <mesh key={i} position={[x, -0.06, 0.012]}>
          <cylinderGeometry args={[0.005, 0.005, 0.03, 8]} />
          <meshStandardMaterial color="#16181c" />
        </mesh>
      ))}
      {/* cadeado pendurado */}
      <group position={[0, -0.12, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.06, 0.025]} />
          <meshStandardMaterial color={color.accent} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.018, 0.006, 10, 20, Math.PI]} />
          <meshStandardMaterial color="#cdd0d3" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
      {/* etiqueta */}
      <mesh position={[0.07, -0.06, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.05, 0.07, 0.003]} />
        <meshStandardMaterial color="#f4f4f4" />
      </mesh>
    </group>
  )
}

/** Luva de vaqueta (couro) — usa caixas arredondadas p/ ficar mais realista. */
function LuvaVaqueta({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const COR = '#c79a5e'
  const mat = <meshStandardMaterial color={COR} roughness={0.85} metalness={0} />
  return (
    <group position={position} rotation={rotation}>
      {/* dorso da mão */}
      <RoundedBox args={[0.085, 0.1, 0.055]} radius={0.022} smoothness={3} castShadow>
        {mat}
      </RoundedBox>
      {/* dedos (curvados p/ frente) */}
      {[-0.028, -0.0095, 0.0095, 0.028].map((x, i) => (
        <RoundedBox
          key={i}
          args={[0.016, 0.072, 0.022]}
          radius={0.009}
          smoothness={3}
          position={[x, 0.07, 0.02]}
          rotation={[0.7, 0, 0]}
        >
          {mat}
        </RoundedBox>
      ))}
      {/* polegar */}
      <RoundedBox args={[0.018, 0.055, 0.022]} radius={0.009} smoothness={3} position={[0.05, 0.02, 0.02]} rotation={[0.3, 0, -0.7]}>
        {mat}
      </RoundedBox>
      {/* punho (vaqueta) flarado */}
      <mesh position={[0, -0.085, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.11, 14]} />
        <meshStandardMaterial color="#b9893f" roughness={0.9} />
      </mesh>
    </group>
  )
}

/**
 * Aterramento temporário trifásico — conector central + 3 cabos de cobre com
 * grampos de latão + cabo de terra até o piso. Cabos como tubos com flecha
 * (catenária), cor cobre. Posição = ponto do barramento central.
 */
function Aterramento({ pos }: { pos: Vec3 }) {
  const COBRE = '#b5763e'
  const LATAO = '#bfa23a'
  const floorY = -pos[1] // chão (y=0 mundo) em coords locais

  // grampos nas 3 fases (offsets locais = pontos exatos − ponto do meio/anchor)
  const fases: [number, number, number][] = [
    [-0.26, 0.02, 0], // esquerda  (-2.63, 1.55, 0.57)
    [0.0, 0.0, 0], // meio      (-2.37, 1.53, 0.57)
    [0.27, 0.01, 0], // direita   (-2.10, 1.54, 0.57)
  ]
  // conector (cluster) pendurado abaixo do barramento
  const conector: [number, number, number] = [0, -0.5, 0.16]
  const terraEnd: [number, number, number] = [0.3, floorY, 0.42]

  // cabo de cobre com flecha entre dois pontos locais
  const cabo = (a: [number, number, number], b: [number, number, number], flecha: number): THREE.TubeGeometry => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const mid = va.clone().lerp(vb, 0.5)
    mid.y -= va.distanceTo(vb) * flecha
    mid.z += 0.08
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([va, mid, vb]), 28, 0.011, 8, false)
  }

  const geos = useMemo(() => {
    const fase = fases.map((f) => cabo(conector, f, 0.45))
    const terra = cabo(conector, terraEnd, 0.15)
    return { fase, terra }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos[0], pos[1], pos[2]])

  return (
    <group position={pos}>
      {/* conector central (cluster) de latão, pendurado abaixo */}
      <mesh position={conector} castShadow>
        <boxGeometry args={[0.09, 0.05, 0.05]} />
        <meshStandardMaterial color={LATAO} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* 3 cabos de fase (do conector até cada grampo) + grampos nas fases */}
      {geos.fase.map((g, i) => (
        <group key={i}>
          <mesh geometry={g} castShadow>
            <meshStandardMaterial color={COBRE} metalness={0.6} roughness={0.45} />
          </mesh>
          <Grampo pos={fases[i]} cor={LATAO} />
        </group>
      ))}

      {/* cabo de terra até o piso + grampo */}
      <mesh geometry={geos.terra} castShadow>
        <meshStandardMaterial color={COBRE} metalness={0.6} roughness={0.45} />
      </mesh>
      <Grampo pos={terraEnd} cor={LATAO} />
    </group>
  )
}

/** Grampo (garra) de aterramento em latão. */
function Grampo({ pos, cor }: { pos: [number, number, number]; cor: string }) {
  const mat = <meshStandardMaterial color={cor} metalness={0.7} roughness={0.35} />
  return (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={[0.05, 0.045, 0.03]} />
        {mat}
      </mesh>
      {/* mandíbula em C */}
      <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.022, 0.006, 8, 18, Math.PI * 1.4]} />
        {mat}
      </mesh>
      {/* parafuso borboleta */}
      <mesh position={[0, -0.035, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.035, 8]} />
        {mat}
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.006, 0.03, 0.012]} />
        {mat}
      </mesh>
    </group>
  )
}

/** Barreira/cobertura isolante (faixas). */
function Barreira({ pos }: { pos: Vec3 }) {
  return (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.5, 0.02]} />
        <meshStandardMaterial color="#e8b81c" transparent opacity={0.55} roughness={0.5} side={2} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <boxGeometry args={[0.5, 0.06, 0.022]} />
        <meshStandardMaterial color="#1a1d22" />
      </mesh>
    </group>
  )
}

/** Placa de sinalização "PROIBIDO OPERAR A CHAVE" (textura desenhada). */
function Placa({ pos }: { pos: Vec3 }) {
  const tex = useMemo(() => placaTexture(), [])
  return (
    <group position={pos}>
      {/* moldura */}
      <mesh castShadow>
        <boxGeometry args={[0.26, 0.34, 0.012]} />
        <meshStandardMaterial color="#1a1d22" roughness={0.6} />
      </mesh>
      {/* face com a textura */}
      <mesh position={[0, 0, 0.0075]}>
        <planeGeometry args={[0.24, 0.32]} />
        {tex ? (
          <meshStandardMaterial map={tex} roughness={0.6} />
        ) : (
          <meshStandardMaterial color="#f4f4f4" />
        )}
      </mesh>
    </group>
  )
}

/** Desenha a placa de proibição em canvas → textura. */
function placaTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const w = 300
  const h = 400
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#c0282d'
  ctx.lineWidth = 16
  ctx.strokeRect(8, 8, w - 16, h - 16)

  // símbolo de proibição (círculo vermelho + diagonal) sobre uma "chave/alavanca"
  const cx = w / 2
  const cy = 120
  const r = 70
  // ícone da chave (alavanca) em preto
  ctx.strokeStyle = '#16181c'
  ctx.lineWidth = 12
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 26, cy + 34)
  ctx.lineTo(cx + 18, cy - 30)
  ctx.stroke()
  ctx.fillStyle = '#16181c'
  ctx.beginPath()
  ctx.arc(cx + 18, cy - 30, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(cx - 40, cy + 30, 80, 14)
  // círculo de proibição + diagonal
  ctx.strokeStyle = '#c0282d'
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.71, cy + r * 0.71)
  ctx.lineTo(cx + r * 0.71, cy - r * 0.71)
  ctx.stroke()

  // texto
  ctx.fillStyle = '#c0282d'
  ctx.font = 'bold 40px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('PROIBIDO', cx, 250)
  ctx.fillStyle = '#16181c'
  ctx.font = 'bold 34px Arial'
  ctx.fillText('OPERAR', cx, 296)
  ctx.fillText('A CHAVE', cx, 336)
  ctx.fillStyle = '#5b6675'
  ctx.font = '18px Arial'
  ctx.fillText('Homens trabalhando', cx, 372)

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

import { Suspense, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  AdaptiveDpr,
  AdaptiveEvents,
  PerformanceMonitor,
  Loader,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Equipment3D } from './Equipment3D'
import { Megger } from './Megger'
import { Leads } from './Leads'
import { Workbench, BENCH_TOP_Y } from './Workbench'
import { LabRoom } from './LabRoom'
import { Substation, ROOM } from './Substation'
import { Room, TEMA_BT, TEMA_SUB } from './Room'
import { ArcPlate } from './ArcPlate'
import { Colaborador } from './Colaborador'
import { DesElements } from './DesElements'
import { MotorElements } from './MotorElements'
import { Terrometro3D } from './Terrometro'
import { Outdoor } from './Outdoor'
import { ViewCommands } from './ViewCommands'
import { useSim } from '../sim/store'
import { useInsp } from '../sim/inspStore'
import { usePose } from '../sim/poseStore'
import { color } from '../design/tokens'
import { resolverQualidade, type QualidadeConfig } from './quality'

/** Sala do laboratório de Baixa Tensão (motor). */
const LAB_ROOM = { size: 10, height: 4.5 }

/** Direção do sol no ensaio externo de aterramento (luz direcional + céu). */
const SUN_POS: [number, number, number] = [14, 20, 9]

/** Altura do gramado no pátio de aterramento — alinha com a base visível do
 *  modelo (que tem geometria enterrada: postes/hastes abaixo da superfície). */
const ATER_GROUND_Y = 0.8

/**
 * Stage — o palco. Adapta o custo gráfico ao dispositivo via preset de
 * qualidade (Bloom, DPR, sombras e frameloop). Em aparelhos fracos, roda
 * em "render sob demanda" (só desenha quando há mudança) e sem postprocessing.
 */
export function Stage() {
  const reduced = useSim((s) => s.reducedMotion)
  const marcarInteragiu = useSim((s) => s.marcarInteragiu)
  const pref = useSim((s) => s.qualidadePref)
  const cenario = useSim((s) => s.equipamento.cenario ?? 'bancada-lab')
  const modo = useSim((s) => s.ensaio.modo)

  const cfg = useMemo(() => resolverQualidade(pref), [pref])
  const detail = cfg.tier !== 'baixo'

  const ehArc = cenario === 'subestacao' // sala branca + painel (arco)
  const ehEnv = cenario === 'subestacao-3d' // modelo walk-in (inspeção)
  const ehAter = ehEnv && modo === 'aterramento' // pátio externo a céu aberto

  // abertura: inspeção = vista aérea 3/4 (ajustável por captura); demais = dentro
  const camPos: [number, number, number] = ehEnv ? [5.5, 5, 6.5] : ehArc ? [4.5, 2.8, 6.5] : [2.8, 2.0, 3.2]
  const focusBaseY = ehArc || ehEnv ? 0 : BENCH_TOP_Y
  const defaultTarget: [number, number, number] = ehEnv
    ? [0, 1.0, -0.5]
    : ehArc
      ? [0, 1.3, 0.4]
      : [0, BENCH_TOP_Y + 0.35, 0]
  const bg = ehAter ? '#bcdcff' : ehEnv ? '#1b2026' : ehArc ? TEMA_SUB.bg : TEMA_BT.bg
  // limites de confinamento da câmera (AABB)
  const halfX = ehEnv ? 3.0 : ehArc ? ROOM.size / 2 : LAB_ROOM.size / 2
  const halfZ = ehEnv ? 2.6 : ehArc ? ROOM.size / 2 : LAB_ROOM.size / 2
  const roomH = ehEnv ? 4.4 : ehArc ? ROOM.height : LAB_ROOM.height

  return (
    <>
    {/* key={cfg.tier}: troca de nível reinicializa o renderer com as flags certas. */}
    <Canvas
      key={cfg.tier}
      frameloop={cfg.frameloop}
      shadows={cfg.shadows}
      dpr={[1, cfg.dprMax]}
      gl={{
        // SEMPRE high-performance: em notebook híbrido isto pede a GPU dedicada
        // (NVIDIA/AMD) em vez da integrada. 'low-power' forçaria a integrada.
        antialias: cfg.antialias,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        // reduz exposição na subestação branca (estava estourando); externo
        // ensolarado pede um pouco mais de brilho.
        gl.toneMappingExposure = ehAter ? 0.92 : ehEnv ? 0.78 : 1.0
      }}
      camera={{ position: camPos, fov: 42, near: 0.1, far: 100 }}
      onPointerDown={marcarInteragiu}
      onWheel={marcarInteragiu}
      style={{ position: 'absolute', inset: 0, background: color.viewport }}
    >
      <color attach="background" args={[bg]} />

      {/* iluminação */}
      <ambientLight intensity={ehAter ? 0.55 : ehArc ? 0.8 : ehEnv ? 0.4 : 0.45} />
      <hemisphereLight
        args={
          ehAter
            ? ['#cfe7ff', '#5f7f43', 0.95] // céu azul / reflexo da grama
            : ehArc
              ? ['#f2f4f7', '#c8cacd', 0.7]
              : ehEnv
                ? ['#cfd6df', '#33383f', 0.3]
                : ['#aeb9c9', '#2a2f37', 0.6]
        }
      />
      <directionalLight
        position={ehAter ? SUN_POS : [4, 7, 3]}
        intensity={ehAter ? 1.9 : ehArc ? 1.0 : ehEnv ? 0.55 : 1.2}
        color={ehAter ? '#fff3df' : '#ffffff'}
        // sombra real do sol SÓ no nível 'alto' (GPU dedicada); médio/baixo usam
        // o blob estático do Outdoor — evita o passe de shadow map por quadro.
        castShadow={cfg.shadows && (!ehEnv || (ehAter && cfg.tier === 'alto'))}
        shadow-mapSize={[cfg.shadowMapSize, cfg.shadowMapSize]}
        shadow-bias={-0.0002}
      >
        {/* frustum de sombra largo no pátio (modelo grande, escala ~8) */}
        <orthographicCamera
          attach="shadow-camera"
          args={ehAter ? [-18, 18, 18, -18, 0.1, 90] : [-7, 7, 7, -7, 0.1, 40]}
        />
      </directionalLight>
      {!ehEnv && <directionalLight position={[-5, 3, -2]} intensity={0.35} color="#9fb4d0" />}
      {ehAter && <Outdoor sun={SUN_POS} tier={cfg.tier} groundY={ATER_GROUND_Y} />}

      {ehEnv ? null : ehArc ? (
        <Substation detail={detail} />
      ) : (
        <>
          <Room theme={TEMA_BT} size={LAB_ROOM.size} height={LAB_ROOM.height} detail={detail} />
          <LabRoom detail={detail} />
          <Workbench detail={detail} />
        </>
      )}

      <Suspense fallback={null}>
        {ehEnv ? (
          <EnvScene />
        ) : ehArc ? (
          <SubScene />
        ) : (
          <group position={[0, BENCH_TOP_Y, 0]}>
            <SceneContent />
          </group>
        )}
        <Environment resolution={cfg.envResolution} frames={1}>
          <Lightformer intensity={1.1} position={[0, 4, 2]} scale={[8, 3, 1]} color="#dfeaff" />
          <Lightformer intensity={0.7} position={[-4, 1, -2]} scale={[5, 5, 1]} color="#ffffff" />
          <Lightformer form="ring" intensity={1.4} position={[3, 2, 1]} scale={2} color={color.accent} />
        </Environment>
      </Suspense>

      {cfg.contactShadows && !ehEnv && (
        <ContactShadows
          position={[0, (ehArc ? 0 : BENCH_TOP_Y) + 0.02, 0]}
          opacity={ehArc ? 0.5 : 0.45}
          scale={ehArc ? 8 : 6}
          blur={2.4}
          far={ehArc ? 5 : 3}
          resolution={cfg.contactRes}
          color="#000000"
        />
      )}

      <OrbitControls
        makeDefault
        enablePan
        screenSpacePanning
        panSpeed={1}
        enableDamping={cfg.damping}
        dampingFactor={0.08}
        minDistance={ehEnv ? 0.6 : ehArc ? 2.5 : 1.4}
        maxDistance={ehEnv ? 28 : ehArc ? 9 : 8}
        maxPolarAngle={Math.PI / 2.05}
        target={defaultTarget}
      />

      <CameraRig cfg={cfg} reduced={reduced} baseY={focusBaseY} defaultTarget={defaultTarget} tourMode={ehEnv} />
      {/* inspeção (walk-in): câmera livre p/ sair da subestação; demais salas confinam */}
      {!ehEnv && <ConfineToRoom halfX={halfX} halfZ={halfZ} height={roomH} />}
      <ViewCommands defaultPos={camPos} defaultTarget={defaultTarget} half={Math.min(halfX, halfZ)} height={roomH} />
      <PoseCapturer />
      <InitialPose />
      <ActivityDriver fpsCap={cfg.fpsCap} />
      <AutoDegrade maxDpr={cfg.dprMax} />

      {cfg.postprocessing && (
        <EffectComposer enableNormalPass={false} multisampling={cfg.antialias ? 2 : 0}>
          {cfg.bloom ? (
            <Bloom
              intensity={0.7}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.2}
              mipmapBlur
            />
          ) : (
            <></>
          )}
          <Vignette eskil={false} offset={0.25} darkness={0.7} />
        </EffectComposer>
      )}

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
    <Loader
      containerStyles={{ background: color.viewport }}
      barStyles={{ background: color.accent, height: 3 }}
      dataStyles={{ color: '#8A97A6', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
      dataInterpolation={(p) => `Carregando modelo ${p.toFixed(0)}%`}
    />
    </>
  )
}

function SceneContent() {
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const pickMode = useSim((s) => s.pickMode)
  const setPeca = useSim((s) => s.setPeca)
  const passo = ensaio.steps[passoIndex]

  return (
    <>
      <Equipment3D
        equipment={equipamento}
        highlightAnchorId={passo?.focoAnchorId}
        pickMode={pickMode}
        onPick={(i) => {
          const c = `${i.raw[0].toFixed(3)}, ${i.raw[1].toFixed(3)}, ${i.raw[2].toFixed(3)}`
          setPeca(`${c}  [${i.mat}]`)
          navigator.clipboard?.writeText(c)
        }}
      />
      <Megger />
      <Leads />
      <MotorElements />
      <TickDriver />
    </>
  )
}

/** Cena da subestação: o painel no piso + a etiqueta de arco (quando definida). */
function SubScene() {
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const passo = ensaio.steps[passoIndex]
  return (
    <>
      <Equipment3D equipment={equipamento} highlightAnchorId={passo?.focoAnchorId} />
      <ArcPlate />
      <Colaborador />
    </>
  )
}

/** Cena walk-in: o próprio modelo da subestação É o ambiente (inspeção). */
function EnvScene() {
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const mostrarGrade = useInsp((s) => s.mostrarGrade)
  const mostrarParedes = useInsp((s) => s.mostrarParedes)
  const pickMode = useSim((s) => s.pickMode)
  const setPeca = useSim((s) => s.setPeca)
  const passo = ensaio.steps[passoIndex]
  const ehDesen = ensaio.modo === 'desenergizacao'
  const ehAter = ensaio.modo === 'aterramento'
  return (
    <>
      <Equipment3D
        equipment={equipamento}
        highlightAnchorId={passo?.focoAnchorId}
        ocultarTela={!mostrarGrade}
        ocultarParedes={!mostrarParedes}
        envIntensity={ehAter ? 0.7 : 0.35}
        pickMode={pickMode}
        onPick={(i) => {
          const c = `${i.raw[0].toFixed(2)}, ${i.raw[1].toFixed(2)}, ${i.raw[2].toFixed(2)}`
          setPeca(`${c}  [${i.mat}]`)
          navigator.clipboard?.writeText(c)
        }}
      />
      {ehDesen && <DesElements />}
      {ehAter && <Terrometro3D />}
      {/* plano invisível p/ calibrar pontos no CHÃO (terrômetro, direção das
          hastes) — o pick do modelo só pega as malhas; o chão precisa deste. */}
      {ehAter && pickMode && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, ATER_GROUND_Y, 0]}
          onClick={(e) => {
            e.stopPropagation()
            const c = `${e.point.x.toFixed(2)}, ${e.point.y.toFixed(2)}, ${e.point.z.toFixed(2)}`
            setPeca(`${c}  [chão]`)
            navigator.clipboard?.writeText(c)
          }}
        >
          <planeGeometry args={[60, 60]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {/* piso sintético no nível do piso dos equipamentos (y=0), quando as
          paredes — que incluem o piso real — estão ocultas */}
      {!mostrarParedes && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <meshStandardMaterial color="#cfd0d3" roughness={0.95} metalness={0} />
        </mesh>
      )}
    </>
  )
}

/**
 * ConfineToRoom — mantém a câmera e o alvo DENTRO da sala (o usuário não sai).
 * Clampa posição/alvo à caixa da sala a cada quadro.
 */
function ConfineToRoom({ halfX, halfZ, height }: { halfX: number; halfZ: number; height: number }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3 } | null
  const m = 0.7
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
  useFrame(() => {
    camera.position.x = clamp(camera.position.x, -halfX + m, halfX - m)
    camera.position.z = clamp(camera.position.z, -halfZ + m, halfZ - m)
    camera.position.y = clamp(camera.position.y, 0.6, height - 0.4)
    if (controls?.target) {
      controls.target.x = clamp(controls.target.x, -halfX + 1.2, halfX - 1.2)
      controls.target.z = clamp(controls.target.z, -halfZ + 1.2, halfZ - 1.2)
      controls.target.y = clamp(controls.target.y, 0.4, height - 0.8)
    }
  })
  return null
}

/** Aciona o relógio do ensaio a partir do loop de render (fonte única de tempo). */
function TickDriver() {
  const tickTeste = useSim((s) => s.tickTeste)
  useFrame((_, dt) => tickTeste(Math.min(dt, 0.05)))
  return null
}

/**
 * ActivityDriver — em frameloop 'demand', garante renderização contínua só
 * enquanto o ensaio roda (curva ao vivo) e um quadro pontual a cada mudança
 * discreta (passo, interação). Em 'always' é inócuo.
 */
function ActivityDriver({ fpsCap }: { fpsCap: number }) {
  const invalidate = useThree((s) => s.invalidate)
  const fase = useSim((s) => s.fase)
  const passoIndex = useSim((s) => s.passoIndex)
  const interagiu = useSim((s) => s.interagiu)
  const earth = useSim((s) => s.earthConectado)
  const line = useSim((s) => s.lineConectado)

  useEffect(() => {
    invalidate()
  }, [passoIndex, interagiu, earth, line, invalidate])

  useEffect(() => {
    if (fase !== 'rodando') return
    // bombeia quadros durante o ensaio, com teto de FPS (corta GPU na integrada).
    const minMs = 1000 / Math.max(1, fpsCap)
    let raf = 0
    let last = -Infinity
    const tick = (t: number) => {
      if (t - last >= minMs) {
        invalidate()
        last = t
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [fase, invalidate, fpsCap])

  return null
}

/**
 * AutoDegrade — se o FPS cair de forma sustentada (máquina mais fraca que a
 * detecção previu), reduz o DPR automaticamente para recuperar fluidez.
 */
function AutoDegrade({ maxDpr }: { maxDpr: number }) {
  const setDpr = useThree((s) => s.setDpr)
  return (
    <PerformanceMonitor
      // queda de FPS sustentada → reduz resolução abaixo do teto do nível.
      onDecline={() => setDpr(Math.max(0.5, maxDpr / 2))}
      onIncline={() => setDpr(maxDpr)}
      flipflops={3}
    />
  )
}

/**
 * CameraRig — reenquadra o alvo da câmera para a âncora do passo APENAS na troca
 * de passo (transição curta). Entre passos, não toca no alvo, para que o arraste
 * (pan) do usuário permaneça. Também controla a auto-rotação conforme o preset.
 */
const TRANS_DUR = 0.8

function CameraRig({
  cfg,
  reduced,
  baseY,
  defaultTarget,
  tourMode = false,
}: {
  cfg: QualidadeConfig
  reduced: boolean
  baseY: number
  defaultTarget: [number, number, number]
  tourMode?: boolean
}) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as
    | (THREE.EventDispatcher & { target: THREE.Vector3; autoRotate: boolean; update: () => void })
    | null
  const invalidate = useThree((s) => s.invalidate)
  const interagiu = useSim((s) => s.interagiu)
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const tourAtivo = useSim((s) => s.tourAtivo)

  const passo = ensaio.steps[passoIndex]
  const anchor = passo?.focoAnchorId
    ? equipamento.anchors.find((a) => a.id === passo.focoAnchorId)
    : undefined

  // alvo p/ foco simples (motor/arco): puxa um pouco ao centro.
  const alvoFoco = useMemo(
    () =>
      anchor
        ? new THREE.Vector3(anchor.pos[0] * 0.5, baseY + anchor.pos[1], anchor.pos[2] * 0.5)
        : new THREE.Vector3(...defaultTarget),
    [anchor, baseY, defaultTarget],
  )
  // alvo exato (visita guiada).
  const alvoTour = useMemo(
    () =>
      anchor
        ? new THREE.Vector3(anchor.pos[0], baseY + anchor.pos[1], anchor.pos[2])
        : new THREE.Vector3(...defaultTarget),
    [anchor, baseY, defaultTarget],
  )
  // posição de observação p/ a visita: SEMPRE pela FRENTE (+Z), centrada no
  // ponto e levemente acima. A frente do modelo é o lado +Z (lado do operador).
  const posTourCalc = useMemo(() => {
    const t = alvoTour
    return new THREE.Vector3(t.x, Math.max(1.0, t.y + 0.35), t.z + 2.0)
  }, [alvoTour])

  // Prioridade da vista: gravada no código (passo.vista) → captura local →
  // cálculo automático pela âncora. O código é o padrão.
  const poses = usePose((s) => s.poses)
  const capturada = passo ? poses[`${equipamento.id}:${passo.id}`] : undefined
  const fonte = passo?.vista ?? capturada
  const alvoTourFinal = useMemo(
    () => (fonte ? new THREE.Vector3(...fonte.target) : alvoTour),
    [fonte, alvoTour],
  )
  const posTour = useMemo(
    () => (fonte ? new THREE.Vector3(...fonte.pos) : posTourCalc),
    [fonte, posTourCalc],
  )

  // sem vista calibrada (ex.: desenergização) → arco "afasta e reaproxima"
  const arco = tourMode && !fonte

  const fromT = useRef(new THREE.Vector3())
  const fromP = useRef(new THREE.Vector3())
  const ctrl = useRef(new THREE.Vector3())
  const trans = useRef(0)
  const DUR = arco ? 1.2 : TRANS_DUR

  // Dispara a transição quando o passo muda OU quando a visita começa; bombeia
  // quadros durante a animação (necessário no frameloop 'demand').
  useEffect(() => {
    if (!controls) return
    if (tourMode && !tourAtivo) return // visita não iniciada → câmera livre
    fromT.current.copy(controls.target)
    fromP.current.copy(camera.position)
    // ponto de controle do arco: meio do caminho, recuado p/ trás (+Z) e acima →
    // a câmera afasta e depois reaproxima pela frente.
    ctrl.current
      .copy(fromP.current)
      .lerp(posTour, 0.5)
      .add(new THREE.Vector3(0, 1.0, 1.6))
    trans.current = reduced ? 0.0001 : DUR
    let raf = 0
    const start = performance.now()
    const tick = () => {
      invalidate()
      if (performance.now() - start < DUR * 1000 + 150) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passoIndex, tourAtivo])

  useFrame((_, dt) => {
    if (!controls) return
    controls.autoRotate = cfg.autoRotate && !interagiu && !reduced && !tourMode
    if (tourMode && !tourAtivo) return // livre antes da visita
    if (trans.current > 0) {
      trans.current = Math.max(0, trans.current - dt)
      const k = easeOut(1 - trans.current / DUR)
      controls.target.lerpVectors(fromT.current, tourMode ? alvoTourFinal : alvoFoco, k)
      if (tourMode) {
        if (arco) {
          // bezier quadrática: from → ctrl (recuado) → posTour (frente)
          const u = 1 - k
          camera.position
            .copy(fromP.current)
            .multiplyScalar(u * u)
            .addScaledVector(ctrl.current, 2 * u * k)
            .addScaledVector(posTour, k * k)
        } else {
          camera.position.lerpVectors(fromP.current, posTour, k)
        }
      }
      controls.update()
    }
  })

  return null
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3)
}

/** PoseCapturer — atende pedidos de captura: grava posição+alvo atuais da câmera. */
function PoseCapturer() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3 } | null
  const capturar = usePose((s) => s.capturar)
  const salvar = usePose((s) => s.salvar)
  const nonce = capturar?.nonce
  useEffect(() => {
    if (!capturar || !controls) return
    salvar(capturar.key, {
      pos: [camera.position.x, camera.position.y, camera.position.z],
      target: [controls.target.x, controls.target.y, controls.target.z],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce])
  return null
}

/** InitialPose — aplica a vista de abertura (captura local ou gravada) ao montar. */
function InitialPose() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null
  const invalidate = useThree((s) => s.invalidate)
  const equipamento = useSim((s) => s.equipamento)
  useEffect(() => {
    const p = equipamento.vistaInicial ?? usePose.getState().poses[`${equipamento.id}:inicial`]
    if (p && controls) {
      camera.position.set(...p.pos)
      controls.target.set(...p.target)
      controls.update()
      invalidate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

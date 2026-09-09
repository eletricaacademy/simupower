import { useEffect, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpda } from '../sim/spdaStore'
import { useSim } from '../sim/store'
import { useView } from '../sim/viewStore'
import { SPDA_PONTOS, PREDIO, type PontoSPDA } from '../catalog/spdaPontos'
import { color } from '../design/tokens'

/**
 * SpdaElements — elementos 3D do ensaio de continuidade do SPDA.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ CONTRATO CLAUDE × CODEX                                                   ║
 * ║                                                                          ║
 * ║ CLAUDE mantém: `Marcadores` (pontos de teste clicáveis, cor pelo          ║
 * ║   resultado) e a leitura do estado (`useSpda`). NÃO mexer sem alinhar.    ║
 * ║ CODEX substitui: `PredioProcedural` — o prédio, o anel de captação, as    ║
 * ║   descidas, as caixas de inspeção e o entorno. Ao entregar o GLB, ponha   ║
 * ║   `PREDIO_PROCEDURAL = false` (o Equipment3D passa a desenhar o modelo    ║
 * ║   real via `catalog/equipment/spdaPredio.ts`) e recalibre as posições em  ║
 * ║   `catalog/spdaPontos.ts`.                                                ║
 * ║                                                                          ║
 * ║ Marcadores usam deslocamento visual lateral solicitado pelo Pablo.       ║
 * ║ `ponto.pos` continua sendo o contato real das garras e dos trechos.        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/** Fallback de autoria; modelPath vazio também habilita a geometria simplificada. */
export const PREDIO_PROCEDURAL = false

const COR_CONDUTOR = color.spda.cobre // cobre nu
const COR_PREDIO = color.spda.concreto
const COR_LAJE = color.spda.cobertura

/** Cor do marcador conforme o estado do trecho no ensaio. */
const CORES: Record<string, string> = {
  pass: color.status.pass,
  marginal: color.status.marginal,
  fail: color.status.fail,
}

export function SpdaElements() {
  const modo = useSim((s) => s.ensaio.modo)
  const modelPath = useSim((s) => s.equipamento.modelPath)
  const pickMode = useSim((s) => s.pickMode)
  const passo = useSim(s => s.ensaio.steps[s.passoIndex]?.id)
  const [mostrarPontos, setMostrarPontos] = useState(true)
  const medindo = passo === 'spda-medir'
  if (modo !== 'spda') return null
  return (
    <>
      {(PREDIO_PROCEDURAL || !modelPath) && <PredioProcedural />}
      {!pickMode && (!medindo || mostrarPontos) && <Marcadores />}
      {!pickMode && medindo && <Html fullscreen calculatePosition={(_objeto, _camera, tamanho) => [tamanho.width / 2, tamanho.height / 2]} style={{ pointerEvents: 'none' }}>
        <button type="button" onClick={() => setMostrarPontos(v => !v)}
          aria-pressed={mostrarPontos}
          style={{ pointerEvents: 'auto', position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', padding: '7px 12px', borderRadius: 8, background: color.inbrat.borracha, color: color.inbrat.tecla, border: 'none', cursor: 'pointer', fontSize: 12 }}>
          {mostrarPontos ? 'Ocultar marcadores' : 'Mostrar marcadores'}
        </button>
      </Html>}
      <FocoSpda />
      <SalaEletrica />
      <EnquadramentoSpda />
      {modelPath && <DefeitosVisuais />}
    </>
  )
}

/** Em retrato, preserva o campo horizontal para não cortar o prédio nas laterais. */
function EnquadramentoSpda() {
  const interno = useSpda(s => s.pontoAtivo === 'eq-bep')
  const camera = useThree(s => s.camera)
  const largura = useThree(s => s.size.width)
  const altura = useThree(s => s.size.height)
  const invalidate = useThree(s => s.invalidate)
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    const aspecto = largura / Math.max(1, altura)
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad((interno ? 55 : 42) / 2)) / Math.min(1, aspecto)))
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, largura, altura, invalidate, interno])
  return null
}

/** Selecionar um trecho leva a câmera à conexão, inclusive nas fachadas ocultas. */
function FocoSpda() {
  const id = useSpda(s => s.pontoAtivo)
  const camera = useThree(s => s.camera)
  const controls = useThree(s => s.controls) as { target: THREE.Vector3; update: () => void } | null
  const invalidate = useThree(s => s.invalidate)
  const anterior = useRef(id)
  const entrada = useRef<{ tempo: number; origem: THREE.Vector3 } | null>(null)
  useEffect(() => {
    if (anterior.current === id || !controls) return
    anterior.current = id
    const ponto = SPDA_PONTOS.find(p => p.id === id)
    if (!ponto?.vista) return
    if (id === 'eq-bep') {
      // Entrada guiada pelo vão aberto, à altura do observador.
      camera.position.set(-3.7, 1.7, -5.8)
      controls.target.set(-3.7, 1.5, -1.5)
      entrada.current = { tempo: 0, origem: camera.position.clone() }
      controls.update(); invalidate(); return
    }
    entrada.current = null
    camera.position.set(...ponto.vista.pos)
    controls.target.set(...ponto.vista.target)
    controls.update()
    invalidate()
  }, [id, camera, controls, invalidate])
  useFrame((_estado, dt) => {
    if (!entrada.current || !controls) return
    entrada.current.tempo += dt
    const t = Math.min(1, entrada.current.tempo / 2.4)
    const suave = t * t * (3 - 2 * t)
    camera.position.lerpVectors(entrada.current.origem, new THREE.Vector3(-3.7, 1.8, -3.4), suave)
    controls.target.set(-3.7, 1.5 - 0.2 * suave, -1.5 + 2 * suave)
    controls.update(); invalidate()
    if (t === 1) entrada.current = null
  })
  return null
}

/** Identificação da sala e luz local; QGBT permanece fechado durante a continuidade. */
function SalaEletrica() {
  return <group>
    <pointLight position={[-3.4, 2.7, -1.3]} intensity={6} distance={7} decay={2} color={color.inbrat.tecla} />
    <Html position={[-3.7, 2.55, -4.08]} center occlude>
      <button style={{ background: color.inbrat.borracha, color: color.inbrat.tecla, padding: '6px 10px', borderRadius: 5, whiteSpace: 'nowrap', fontSize: 12 }} onClick={() => { if (useSpda.getState().pontoAtivo === 'eq-bep') useView.getState().pedir('quadro'); else useSpda.getState().setPontoAtivo('eq-bep') }}>Entrar · Sala elétrica</button>
    </Html>
    {[['QGBT', -2.6, 2.55, -0.05], ['BEP', -4.8, 1.67, 0.48]].map(([texto, x, y, z]) =>
      <Html key={texto} position={[Number(x), Number(y), Number(z)]} center occlude>
        <span style={{ background: color.inbrat.borracha, color: color.inbrat.tecla, padding: '3px 9px', fontSize: 12 }}>{texto}</span>
      </Html>)}
  </group>
}

/** Defeitos acompanham o cenário elétrico; nunca aparecem na instalação íntegra. */
function DefeitosVisuais() {
  const defeitos = useSpda(s => s.cenario === 'com-defeitos')
  if (!defeitos) return null
  return <group>
    <group position={[6.25, 4.5, 4.25]}>
      <mesh rotation={[0, 0, 0.22]} castShadow>
        <boxGeometry args={[0.14, 0.32, 0.1]} />
        <meshStandardMaterial color={color.spda.cobre} metalness={0.65} roughness={0.5} />
      </mesh>
      {/* Cabeça afastada da chapa evidencia o parafuso sem aperto. */}
      <mesh position={[0.04, 0.09, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.16, 6]} />
        <meshStandardMaterial color={color.spda.aluminio} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
    <mesh position={[-6.25, 0.56, 4.353]}>
      <boxGeometry args={[0.17, 0.22, 0.012]} />
      <meshStandardMaterial color={color.spda.oxidacao} roughness={0.95} />
    </mesh>
  </group>
}

// ─────────────────────────────────────────────────────────────────────────────
// MARCADORES — propriedade do CLAUDE (ligados ao estado do ensaio)
// ─────────────────────────────────────────────────────────────────────────────

/** Pontos de teste: clicáveis, pintados pelo resultado da medição. */
function Marcadores() {
  const pontoAtivo = useSpda((s) => s.pontoAtivo)
  const medicoes = useSpda((s) => s.medicoes)
  const setPontoAtivo = useSpda((s) => s.setPontoAtivo)

  return (
    <>
      {SPDA_PONTOS.filter(p => p.id === pontoAtivo).map((p) => {
        const leitura = medicoes[p.id]
        const cor = leitura ? CORES[leitura.cor] : color.accentCool
        const ativo = p.id === pontoAtivo
        return (
          <group key={p.id}>
            <Marcador ponto={p} cor={cor} ativo={ativo} onClick={() => setPontoAtivo(p.id)} />
            <Marcador ponto={{ ...p, id: `${p.id}-origem`, pos: p.posOrigem }} cor={cor} ativo={ativo} onClick={() => setPontoAtivo(p.id)} />
          </group>
        )
      })}
    </>
  )
}

function Marcador({
  ponto,
  cor,
  ativo,
  onClick,
}: {
  ponto: PontoSPDA
  cor: string
  ativo: boolean
  onClick: () => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  // Pedido do Pablo: deixar o conector aparente, sem mover o contato calibrado.
  const posMarcador: [number, number, number] = ponto.id === 'capt-anel'
    ? ponto.pos
    : ponto.id === 'eq-bep'
      ? [ponto.pos[0] - 0.65, ponto.pos[1], ponto.pos[2] - 0.3]
      : [ponto.pos[0] + Math.sign(ponto.pos[0]) * 0.65, ponto.pos[1], ponto.pos[2] + Math.sign(ponto.pos[2]) * 0.35]
  // pulso suave no ponto selecionado (chama o olho sem poluir a cena)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const s = ativo ? 1 + Math.sin(clock.elapsedTime * 3) * 0.12 : 1
    ref.current.scale.setScalar(s)
  })
  return (
    <mesh
      ref={ref}
      position={posMarcador}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <sphereGeometry args={[ativo ? 0.16 : 0.12, 16, 16]} />
      <meshStandardMaterial
        color={cor}
        emissive={cor}
        emissiveIntensity={ativo ? 0.9 : 0.45}
        roughness={0.35}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉDIO PROCEDURAL — placeholder do CODEX (substituir por GLB)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prédio de referência com SPDA completo em geometria pura: caixa, laje, anel
 * de captação com captores, 4 descidas nas quinas, caixas de inspeção e BEP.
 * Existe só para o módulo rodar antes do modelo real.
 */
function PredioProcedural() {
  const { largura: L, profundidade: P, altura: H, alturaCaixa } = PREDIO
  const hx = L / 2 + 0.25
  const hz = P / 2 + 0.25
  const quinas: [number, number][] = [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
  ]

  return (
    <group>
      {/* corpo do prédio */}
      <mesh position={[0, (H + 3) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[L, H - 3, P]} />
        <meshStandardMaterial color={COR_PREDIO} roughness={0.9} metalness={0} />
      </mesh>
      {/* Sala simplificada também fica acessível quando o GLB está indisponível. */}
      {[
        { pos: [-5.9, 1.5, 0], tamanho: [0.2, 3, 8] },
        { pos: [5.9, 1.5, 0], tamanho: [0.2, 3, 8] },
        { pos: [0, 1.5, 3.9], tamanho: [12, 3, 0.2] },
        { pos: [-5.15, 1.5, -3.9], tamanho: [1.7, 3, 0.2] },
        { pos: [1.45, 1.5, -3.9], tamanho: [9.1, 3, 0.2] },
        { pos: [-3.3, 1.5, 0.8], tamanho: [5, 3, 0.16] },
        { pos: [-3.3, 0.33, -1.5], tamanho: [5, 0.04, 4.5] },
      ].map((b, i) => <mesh key={i} position={b.pos as [number, number, number]}>
        <boxGeometry args={b.tamanho as [number, number, number]} />
        <meshStandardMaterial color={COR_PREDIO} roughness={0.9} />
      </mesh>)}
      <mesh position={[-2.6, 1.4, 0.33]}><boxGeometry args={[1.6, 2.1, 0.6]} /><meshStandardMaterial color={color.spda.metal} /></mesh>
      <mesh position={[-4.8, 1.2, 0.67]}><boxGeometry args={[1.15, 0.65, 0.1]} /><meshStandardMaterial color={color.spda.metal} /></mesh>

      {/* platibanda / laje de cobertura */}
      <mesh position={[0, H + 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[L + 0.4, 0.3, P + 0.4]} />
        <meshStandardMaterial color={COR_LAJE} roughness={0.95} metalness={0} />
      </mesh>

      {/* anel de captação (condutor nu no perímetro da cobertura) */}
      <AnelCaptacao largura={L + 0.5} profundidade={P + 0.5} y={H + 0.35} />

      {/* captores (mini-hastes) nas quinas e no meio dos lados maiores */}
      {[...quinas, [0, -hz] as [number, number], [0, hz] as [number, number]].map(([x, z], i) => (
          <Captor key={i} pos={[x, H + 0.35, z]} />
      ))}

      {/* descidas nas 4 quinas + caixa de inspeção na base */}
      {quinas.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, (H + 0.35 + 0.79) / 2, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, H + 0.35 - 0.79, 8]} />
            <meshStandardMaterial color={COR_CONDUTOR} metalness={0.75} roughness={0.4} />
          </mesh>
          <mesh position={[x, 0.305, z]}><cylinderGeometry args={[0.035, 0.035, 0.61, 8]} /><meshStandardMaterial color={COR_CONDUTOR} /></mesh>
          <CaixaInspecao pos={[x, alturaCaixa, z]} />
        </group>
      ))}

      <mesh position={[-4.8, 1.2, 0.57]} castShadow>
        <boxGeometry args={[0.95, 0.14, 0.07]} />
        <meshStandardMaterial color={COR_CONDUTOR} roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  )
}

function AnelCaptacao({
  largura,
  profundidade,
  y,
}: {
  largura: number
  profundidade: number
  y: number
}) {
  const hx = largura / 2
  const hz = profundidade / 2
  const lados: { pos: [number, number, number]; comp: number; eixoX: boolean }[] = [
    { pos: [0, y, -hz], comp: largura, eixoX: true },
    { pos: [0, y, hz], comp: largura, eixoX: true },
    { pos: [-hx, y, 0], comp: profundidade, eixoX: false },
    { pos: [hx, y, 0], comp: profundidade, eixoX: false },
  ]
  return (
    <>
      {lados.map((l, i) => (
        <mesh
          key={i}
          position={l.pos}
          rotation={l.eixoX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.03, 0.03, l.comp, 8]} />
          <meshStandardMaterial color={COR_CONDUTOR} metalness={0.75} roughness={0.4} />
        </mesh>
      ))}
    </>
  )
}

/** Captor tipo Franklin simplificado (haste vertical). */
function Captor({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.6, 8]} />
        <meshStandardMaterial color={color.spda.aluminio} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <coneGeometry args={[0.035, 0.1, 8]} />
        <meshStandardMaterial color={color.spda.isolador} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

/** Caixa de inspeção com conector desconectável (ponto de medição da descida). */
function CaixaInspecao({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0, -Math.sign(pos[2]) * 0.06]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.58, 0.1]} />
        <meshStandardMaterial color={color.spda.metal} roughness={0.7} metalness={0.35} />
      </mesh>
      {[-0.14, 0.14].map(y => <mesh key={y} position={[0, y, Math.sign(pos[2]) * 0.065]}>
        <boxGeometry args={[0.17, 0.1, 0.065]} />
        <meshStandardMaterial color={COR_CONDUTOR} roughness={0.5} metalness={0.2} />
      </mesh>)}
    </group>
  )
}

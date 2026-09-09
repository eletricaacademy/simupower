import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpda } from '../sim/spdaStore'
import { useSim } from '../sim/store'
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
 * ║ Os marcadores leem SOMENTE `ponto.pos` — se as posições estiverem         ║
 * ║ calibradas, eles caem sozinhos no lugar certo do modelo novo.             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/** Enquanto não há GLB do prédio, a cena é desenhada em geometria pura. */
export const PREDIO_PROCEDURAL = true

const COR_CONDUTOR = '#b87333' // cobre nu
const COR_PREDIO = '#c9c5bd'
const COR_LAJE = '#a9a49b'

/** Cor do marcador conforme o estado do trecho no ensaio. */
const CORES: Record<string, string> = {
  pass: color.status.pass,
  marginal: color.status.marginal,
  fail: color.status.fail,
}

export function SpdaElements() {
  const modo = useSim((s) => s.ensaio.modo)
  if (modo !== 'spda') return null
  return (
    <>
      {PREDIO_PROCEDURAL && <PredioProcedural />}
      <Marcadores />
    </>
  )
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
      {SPDA_PONTOS.map((p) => {
        const leitura = medicoes[p.id]
        const cor = leitura ? CORES[leitura.cor] : color.accentCool
        const ativo = p.id === pontoAtivo
        return (
          <group key={p.id}>
            <Marcador ponto={p} cor={cor} ativo={ativo} onClick={() => setPontoAtivo(p.id)} />
            {/* traço do trecho medido (da garra fixa à ponta de prova) */}
            <Trecho de={p.posOrigem} para={p.pos} cor={leitura ? cor : COR_CONDUTOR} destacado={ativo} />
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
  // pulso suave no ponto selecionado (chama o olho sem poluir a cena)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const s = ativo ? 1 + Math.sin(clock.elapsedTime * 3) * 0.12 : 1
    ref.current.scale.setScalar(s)
  })
  return (
    <mesh
      ref={ref}
      position={ponto.pos}
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

/** Linha do trecho ensaiado entre as duas extremidades. */
function Trecho({
  de,
  para,
  cor,
  destacado,
}: {
  de: [number, number, number]
  para: [number, number, number]
  cor: string
  destacado: boolean
}) {
  const geo = useMemo(() => {
    const a = new THREE.Vector3(...de)
    const b = new THREE.Vector3(...para)
    return new THREE.BufferGeometry().setFromPoints([a, b])
  }, [de, para])
  return (
    <line>
      <primitive object={geo} attach="geometry" />
      <lineBasicMaterial color={cor} transparent opacity={destacado ? 0.95 : 0.35} />
    </line>
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
  const hx = L / 2
  const hz = P / 2
  const quinas: [number, number][] = [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
  ]

  return (
    <group>
      {/* corpo do prédio */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[L, H, P]} />
        <meshStandardMaterial color={COR_PREDIO} roughness={0.9} metalness={0} />
      </mesh>

      {/* platibanda / laje de cobertura */}
      <mesh position={[0, H + 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[L + 0.4, 0.3, P + 0.4]} />
        <meshStandardMaterial color={COR_LAJE} roughness={0.95} metalness={0} />
      </mesh>

      {/* anel de captação (condutor nu no perímetro da cobertura) */}
      <AnelCaptacao largura={L} profundidade={P} y={H + 0.4} />

      {/* captores (mini-hastes) nas quinas e no meio dos lados maiores */}
      {[...quinas, [0, -hz] as [number, number], [0, hz] as [number, number]].map(([x, z], i) => (
        <Captor key={i} pos={[x, H + 0.4, z]} />
      ))}

      {/* descidas nas 4 quinas + caixa de inspeção na base */}
      {quinas.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, H / 2 + 0.2, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, H + 0.4, 8]} />
            <meshStandardMaterial color={COR_CONDUTOR} metalness={0.75} roughness={0.4} />
          </mesh>
          <CaixaInspecao pos={[x, alturaCaixa, z]} />
        </group>
      ))}

      {/* BEP — barramento de equipotencialização principal (parede externa) */}
      <mesh position={[-hx - 0.8, 0.9, 2.2]} castShadow>
        <boxGeometry args={[0.28, 0.36, 0.12]} />
        <meshStandardMaterial color="#2f6f3f" roughness={0.6} metalness={0.2} />
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
        <meshStandardMaterial color="#cfd4da" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <coneGeometry args={[0.035, 0.1, 8]} />
        <meshStandardMaterial color="#e6ebf0" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

/** Caixa de inspeção com conector desconectável (ponto de medição da descida). */
function CaixaInspecao({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.4, 0.16]} />
        <meshStandardMaterial color="#4a5058" roughness={0.7} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[0.22, 0.3, 0.02]} />
        <meshStandardMaterial color={color.accent} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  )
}

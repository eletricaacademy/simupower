import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Html, Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  MESAS_FV,
  MESA,
  MODULO,
  USINA,
  CERCA,
  PORTAO,
  SKID,
  TRAFO,
  SE,
  POSTE_MT,
  AREA_BRITA,
  BEP_SKID,
  MALHA_FV,
  HASTES_FV,
  COMPRIMENTO_HASTE,
  ESTACAS_FV,
  PONTOS_CONTINUIDADE_FV,
  PONTOS_TOQUE_PASSO_FV,
} from '../catalog/usinaFvPontos'
import type { Vec3 } from '../catalog/types'
import { useUsinaFv } from '../sim/usinaFvStore'
import { useSim } from '../sim/store'
import { color } from '../design/tokens'
import { resolverQualidade } from './quality'
import { Equipment3D } from './Equipment3D'

/**
 * UsinaFvElements — cena do módulo ATERRAMENTO EM USINA FOTOVOLTAICA.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ PLACEHOLDER PROCEDURAL (Claude) — o ambiente definitivo é do CODEX.       ║
 * ║ Tudo aqui deriva de `catalog/usinaFvPontos.ts`. Ao entrar o GLB:          ║
 * ║  • `usinaFv.modelPath` preenchido → o Equipment3D desenha o modelo;       ║
 * ║  • USINA_PROCEDURAL = false desliga mesas/skid/trafo/SE/cerca daqui;      ║
 * ║  • malha enterrada, estacas e marcadores dos ensaios CONTINUAM daqui      ║
 * ║    (são a camada didática, lida do store).                                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
export const USINA_PROCEDURAL = true

const CU = color.usinaFv
const TILT = THREE.MathUtils.degToRad(USINA.inclinacaoGraus)
/** Altura do centro da mesa (borda baixa + meia profundidade inclinada). */
const Y_MESA = MESA.alturaBorda + (MESA.profundidade / 2) * Math.sin(TILT)
/** Rotação da mesa: normal para o norte (−Z) e para cima; borda sul mais alta. */
const Q_MESA = new THREE.Quaternion().setFromEuler(new THREE.Euler(-TILT, 0, 0))

export function UsinaFvElements() {
  const equipamento = useSim((s) => s.equipamento)
  const pickMode = useSim((s) => s.pickMode)
  const setPeca = useSim((s) => s.setPeca)
  const pref = useSim((s) => s.qualidadePref)
  const detail = resolverQualidade(pref).tier !== 'baixo'
  const etapa = useSim((s) => s.ensaio.steps[s.passoIndex]?.id)
  const mostrarMalha = useUsinaFv((s) => s.mostrarMalha)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const tamanho = useThree((s) => s.size)

  // a linha das estacas chega a 300 m: amplia o plano de corte só nesta cena
  useEffect(() => {
    const farAntes = camera.far
    camera.far = 1500
    camera.updateProjectionMatrix()
    invalidate()
    return () => {
      camera.far = farAntes
      camera.updateProjectionMatrix()
    }
  }, [camera, invalidate])
  // celular em retrato: FOV maior para caber a planta
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = tamanho.width < tamanho.height ? 62 : 42
      camera.updateProjectionMatrix()
      invalidate()
    }
  }, [camera, tamanho.width, tamanho.height, invalidate])

  const reportar = (p: THREE.Vector3, rotulo: string) => {
    const c = `${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`
    setPeca(`${c}  [${rotulo}]`)
    navigator.clipboard?.writeText(c).catch(() => { /* A coordenada continua visível no HUD. */ })
  }

  return (
    <group>
      {equipamento.modelPath !== '' && (
        <Equipment3D
          equipment={equipamento}
          envIntensity={0.7}
          pickMode={pickMode}
          onPick={(i) => reportar(new THREE.Vector3(...i.raw), i.mat)}
        />
      )}
      <Terreno />
      {USINA_PROCEDURAL && (
        <>
          <Mesas detail={detail} />
          <Skid />
          <Transformador detail={detail} />
          <Subestacao />
          <Cerca />
          {detail && <Rotulos />}
        </>
      )}
      <BepSkid />
      <MalhaEnterrada visivel={mostrarMalha} />
      {etapa === 'fv-continuidade' && <EnsaioContinuidade />}
      {etapa === 'fv-resistencia' && <EnsaioQuedaPotencial />}
      {etapa === 'fv-toque-passo' && <EnsaioToquePasso />}
      {pickMode && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.001, 0]}
          onClick={(e) => {
            e.stopPropagation()
            reportar(e.point, 'chão')
          }}
        >
          <planeGeometry args={[800, 800]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

// ─── Primitivas ──────────────────────────────────────────────────────────────

function Caixa({ pos, dim, cor, rough = 0.8, metal = 0, opacidade = 1, sombra = true }: { pos: Vec3; dim: Vec3; cor: string; rough?: number; metal?: number; opacidade?: number; sombra?: boolean }) {
  return (
    <mesh position={pos} castShadow={sombra && opacidade === 1} receiveShadow>
      <boxGeometry args={dim} />
      <meshStandardMaterial color={cor} roughness={rough} metalness={metal} transparent={opacidade < 1} opacity={opacidade} depthWrite={opacidade === 1} />
    </mesh>
  )
}

/** Cilindro entre dois pontos (condutor, tubo, haste). */
function Barra({ a, b, raio, cor, atravessaSolo = false }: { a: Vec3; b: Vec3; raio: number; cor: string; atravessaSolo?: boolean }) {
  const { meio, comprimento, quat } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const d = vb.clone().sub(va)
    return {
      meio: va.clone().add(vb).multiplyScalar(0.5),
      comprimento: d.length(),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()),
    }
  }, [a, b])
  return (
    <mesh position={meio} quaternion={quat} renderOrder={atravessaSolo ? 20 : 0}>
      <cylinderGeometry args={[raio, raio, comprimento, 6]} />
      <meshStandardMaterial color={cor} metalness={0.5} roughness={0.5} depthTest={!atravessaSolo} transparent={atravessaSolo} opacity={atravessaSolo ? 0.9 : 1} />
    </mesh>
  )
}

function Etiqueta({ pos, texto, destaque = false }: { pos: Vec3; texto: string; destaque?: boolean }) {
  return (
    // tamanho fixo em pixels (com escala por distância o rótulo tomava a tela de
    // perto) e camada zero, para ficar sob os painéis e o laudo do HUD
    <Html position={pos} center zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
      <span
        style={{
          display: 'block',
          whiteSpace: 'nowrap',
          background: color.surface,
          color: destaque ? color.accent : color.text,
          border: `1px solid ${destaque ? color.accent : color.hairline}`,
          padding: '3px 8px',
          borderRadius: 5,
          fontSize: 12,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {texto}
      </span>
    </Html>
  )
}

// ─── Ambiente ────────────────────────────────────────────────────────────────

/** Gramado, estrada de acesso (onde vão as estacas) e brita do skid/trafo. */
function Terreno() {
  const comprimentoEstrada = 340
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshLambertMaterial color={CU.grama} />
      </mesh>
      {/* estrada de terra: do portão para o sul, por onde as estacas são levadas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ESTACAS_FV.e[0], -0.01, CERCA.zMax + comprimentoEstrada / 2]} receiveShadow>
        <planeGeometry args={[5, comprimentoEstrada]} />
        <meshLambertMaterial color={CU.terra} />
      </mesh>
      {/* acesso interno do portão ao skid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(PORTAO.x + AREA_BRITA.xMin) / 2, -0.01, (CERCA.zMax + AREA_BRITA.zMax) / 2]} receiveShadow>
        <planeGeometry args={[Math.abs(AREA_BRITA.xMin - PORTAO.x) + 4, Math.abs(CERCA.zMax - AREA_BRITA.zMax) + 1]} />
        <meshLambertMaterial color={CU.terra} />
      </mesh>
      {/* camada de brita sob skid e trafo (eleva o limite de toque/passo) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(AREA_BRITA.xMin + AREA_BRITA.xMax) / 2, 0.005, (AREA_BRITA.zMin + AREA_BRITA.zMax) / 2]} receiveShadow>
        <planeGeometry args={[AREA_BRITA.xMax - AREA_BRITA.xMin, AREA_BRITA.zMax - AREA_BRITA.zMin]} />
        <meshLambertMaterial color={CU.brita} />
      </mesh>
    </group>
  )
}

// ─── Mesas e módulos ─────────────────────────────────────────────────────────

/** Posição no mundo de um ponto local da mesa (x ao longo, z na inclinação). */
function pontoMesa(centro: Vec3, xl: number, zl: number, yl = 0): THREE.Vector3 {
  return new THREE.Vector3(xl, yl, zl).applyQuaternion(Q_MESA).add(new THREE.Vector3(centro[0], Y_MESA, centro[2]))
}

function Mesas({ detail }: { detail: boolean }) {
  const modulos = useRef<THREE.InstancedMesh>(null)
  const pilares = useRef<THREE.InstancedMesh>(null)
  const nModulos = MESAS_FV.length * USINA.modulosPorFileira * USINA.fileirasPorMesa
  const xsPilar = useMemo(() => Array.from({ length: 6 }, (_, i) => -MESA.comprimento / 2 + 0.6 + (i * (MESA.comprimento - 1.2)) / 5), [])
  const zsPilar = [-(MESA.profundidade / 2 - 0.5), MESA.profundidade / 2 - 0.5]
  const nPilares = MESAS_FV.length * xsPilar.length * zsPilar.length

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const um = new THREE.Vector3(1, 1, 1)
    let i = 0
    for (const mesa of MESAS_FV) {
      for (let f = 0; f < USINA.fileirasPorMesa; f++) {
        for (let c = 0; c < USINA.modulosPorFileira; c++) {
          const xl = -MESA.comprimento / 2 + MODULO.largura / 2 + c * (MODULO.largura + MODULO.folga)
          const zl = -MESA.profundidade / 2 + MODULO.comprimento / 2 + f * (MODULO.comprimento + MODULO.folga)
          m.compose(pontoMesa(mesa.centro, xl, zl, 0.06), Q_MESA, um)
          modulos.current?.setMatrixAt(i++, m)
        }
      }
    }
    if (modulos.current) modulos.current.instanceMatrix.needsUpdate = true

    let j = 0
    const q = new THREE.Quaternion()
    for (const mesa of MESAS_FV) {
      for (const xl of xsPilar) {
        for (const zl of zsPilar) {
          const topo = pontoMesa(mesa.centro, xl, zl, -0.08)
          m.compose(new THREE.Vector3(topo.x, topo.y / 2, topo.z), q, new THREE.Vector3(1, topo.y, 1))
          pilares.current?.setMatrixAt(j++, m)
        }
      }
    }
    if (pilares.current) pilares.current.instanceMatrix.needsUpdate = true
  }, [xsPilar])

  return (
    <group>
      <instancedMesh ref={modulos} args={[undefined, undefined, nModulos]} castShadow receiveShadow>
        <boxGeometry args={[MODULO.largura, MODULO.espessura, MODULO.comprimento]} />
        <meshStandardMaterial color={CU.modulo} roughness={0.28} metalness={0.35} />
      </instancedMesh>
      <instancedMesh ref={pilares} args={[undefined, undefined, nPilares]} castShadow>
        <boxGeometry args={[0.1, 1, 0.1]} />
        <meshStandardMaterial color={CU.estrutura} roughness={0.5} metalness={0.6} />
      </instancedMesh>
      {/* longarinas sob os módulos (terças) */}
      {detail &&
        MESAS_FV.flatMap((mesa) =>
          zsPilar.map((zl) => {
            const a = pontoMesa(mesa.centro, -MESA.comprimento / 2, zl, -0.04)
            const b = pontoMesa(mesa.centro, MESA.comprimento / 2, zl, -0.04)
            return <Barra key={`${mesa.id}${zl}`} a={[a.x, a.y, a.z]} b={[b.x, b.y, b.z]} raio={0.04} cor={CU.estrutura} />
          }),
        )}
    </group>
  )
}

// ─── Skid, trafo, subestação ─────────────────────────────────────────────────

function Skid() {
  const [cx, , cz] = SKID.centro
  const [w, h, d] = SKID.dimensoes
  const faceNorte = cz - d / 2
  return (
    <group>
      <Caixa pos={[cx, 0.15, cz]} dim={[w + 0.6, 0.3, d + 0.6]} cor={CU.alvenaria} />
      <Caixa pos={[cx, 0.3 + h / 2, cz]} dim={[w, h, d]} cor={CU.skid} rough={0.6} metal={0.3} />
      {/* portas dos inversores e do QGBT (face norte) */}
      {[-1.9, 0, 1.9].map((dx) => (
        <Caixa key={dx} pos={[cx + dx, 0.3 + 1.1, faceNorte - 0.01]} dim={[1.3, 2.0, 0.04]} cor={CU.estrutura} rough={0.5} metal={0.4} />
      ))}
      {/* venezianas */}
      {[-1, 1].map((s) => (
        <Caixa key={s} pos={[cx + s * (w / 2 - 0.4), 0.3 + h - 0.5, cz]} dim={[0.5, 0.4, d + 0.02]} cor={CU.estrutura} sombra={false} />
      ))}
    </group>
  )
}

function Transformador({ detail }: { detail: boolean }) {
  const [cx, , cz] = TRAFO.centro
  const [w, h, d] = TRAFO.dimensoes
  const base = 0.2
  return (
    <group>
      <Caixa pos={[cx, base / 2, cz]} dim={[w + 1, base, d + 1]} cor={CU.alvenaria} />
      <Caixa pos={[cx, base + h / 2, cz]} dim={[w, h, d]} cor={CU.trafo} rough={0.55} metal={0.3} />
      {/* radiadores (aletas) nas laterais */}
      {detail &&
        [-1, 1].flatMap((s) =>
          [-0.36, -0.12, 0.12, 0.36].map((dz) => (
            <Caixa key={`${s}${dz}`} pos={[cx + s * (w / 2 + 0.16), base + h / 2 - 0.05, cz + dz]} dim={[0.3, h * 0.8, 0.05]} cor={CU.trafo} rough={0.55} metal={0.3} sombra={false} />
          )),
        )}
      {/* buchas de MT (lado da SE) e de BT (lado do skid) */}
      {[-0.4, 0, 0.4].map((dz) => (
        <mesh key={`mt${dz}`} position={[cx + w / 2 - 0.3, base + h + 0.22, cz + dz]}>
          <cylinderGeometry args={[0.06, 0.08, 0.45, 10]} />
          <meshStandardMaterial color={color.spda.isolador} roughness={0.3} />
        </mesh>
      ))}
      {[-0.45, -0.15, 0.15, 0.45].map((dz) => (
        <mesh key={`bt${dz}`} position={[cx - w / 2 + 0.25, base + h + 0.1, cz + dz]}>
          <cylinderGeometry args={[0.04, 0.05, 0.2, 8]} />
          <meshStandardMaterial color={color.spda.isolador} roughness={0.3} />
        </mesh>
      ))}
      {/* tanque de expansão */}
      <mesh position={[cx, base + h + 0.35, cz - d / 2 + 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, w * 0.8, 12]} />
        <meshStandardMaterial color={CU.trafo} roughness={0.55} metalness={0.3} />
      </mesh>
    </group>
  )
}

function Subestacao() {
  const [cx, , cz] = SE.centro
  const [w, h, d] = SE.dimensoes
  const topoPoste = 11
  const entrada: Vec3 = [cx + w / 2 - 0.3, h + 0.3, cz + d / 2 - 0.3]
  return (
    <group>
      <Caixa pos={[cx, h / 2, cz]} dim={[w, h, d]} cor={CU.alvenaria} rough={0.9} />
      <Caixa pos={[cx, h + 0.1, cz]} dim={[w + 0.4, 0.2, d + 0.4]} cor={CU.telhado} />
      {/* porta metálica (face oeste) e janela de ventilação */}
      <Caixa pos={[cx - w / 2 - 0.01, 1.05, cz - 0.4]} dim={[0.04, 2.1, 1.2]} cor={CU.estrutura} metal={0.4} />
      <Caixa pos={[cx, 2.2, cz - d / 2 - 0.01]} dim={[1.2, 0.5, 0.04]} cor={CU.estrutura} sombra={false} />
      {/* bucha de entrada e poste da concessionária fora da cerca */}
      <mesh position={entrada}>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 10]} />
        <meshStandardMaterial color={color.spda.isolador} />
      </mesh>
      <mesh position={[POSTE_MT[0], topoPoste / 2, POSTE_MT[2]]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, topoPoste, 8]} />
        <meshStandardMaterial color={CU.alvenaria} roughness={0.9} />
      </mesh>
      <Caixa pos={[POSTE_MT[0], topoPoste - 0.6, POSTE_MT[2]]} dim={[2.4, 0.12, 0.12]} cor={CU.estrutura} />
      {[-1, 0, 1].map((k) => (
        <Line
          key={k}
          points={[
            [POSTE_MT[0] + k * 1.0, topoPoste - 0.5, POSTE_MT[2]],
            [(POSTE_MT[0] + entrada[0]) / 2 + k * 0.5, (topoPoste + entrada[1]) / 2 - 1.2, (POSTE_MT[2] + entrada[2]) / 2],
            [entrada[0] + k * 0.15, entrada[1] + 0.25, entrada[2]],
          ]}
          color={CU.estrutura}
          lineWidth={1.4}
        />
      ))}
    </group>
  )
}

// ─── Cerca ───────────────────────────────────────────────────────────────────

function Cerca() {
  const mouroes = useRef<THREE.InstancedMesh>(null)
  const lados = useMemo(() => {
    const { xMin, xMax, zMin, zMax } = CERCA
    const g0 = PORTAO.x - PORTAO.largura / 2
    const g1 = PORTAO.x + PORTAO.largura / 2
    // face sul interrompida no vão do portão
    return [
      { a: [xMin, zMin], b: [xMax, zMin] },
      { a: [xMax, zMin], b: [xMax, zMax] },
      { a: [xMax, zMax], b: [g1, zMax] },
      { a: [g0, zMax], b: [xMin, zMax] },
      { a: [xMin, zMax], b: [xMin, zMin] },
    ] as { a: [number, number]; b: [number, number] }[]
  }, [])
  const postes = useMemo(
    () =>
      lados.flatMap(({ a, b }) => {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1])
        const n = Math.max(1, Math.round(L / 3))
        return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n] as [number, number])
      }),
    [lados],
  )
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    postes.forEach(([x, z], i) => {
      m.makeTranslation(x, CERCA.altura / 2, z)
      mouroes.current?.setMatrixAt(i, m)
    })
    if (mouroes.current) mouroes.current.instanceMatrix.needsUpdate = true
  }, [postes])

  return (
    <group>
      <instancedMesh ref={mouroes} args={[undefined, undefined, postes.length]} castShadow>
        <boxGeometry args={[0.08, CERCA.altura, 0.08]} />
        <meshStandardMaterial color={CU.cerca} metalness={0.5} roughness={0.5} />
      </instancedMesh>
      {/* tela alambrado: painel translúcido + arame superior */}
      {lados.map(({ a, b }, i) => {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1])
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
        return (
          <group key={i} position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]} rotation={[0, -ang, 0]}>
            <mesh position={[0, CERCA.altura / 2 - 0.05, 0]}>
              <planeGeometry args={[L, CERCA.altura - 0.1]} />
              <meshStandardMaterial color={CU.cerca} transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} metalness={0.4} />
            </mesh>
            <mesh position={[0, CERCA.altura, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, L, 5]} />
              <meshStandardMaterial color={CU.cerca} metalness={0.5} />
            </mesh>
          </group>
        )
      })}
      {/* portão de duas folhas, uma entreaberta */}
      <group position={[PORTAO.x - PORTAO.largura / 2, 0, CERCA.zMax]}>
        <group rotation={[0, -0.5, 0]}>
          <Caixa pos={[PORTAO.largura / 4, CERCA.altura / 2, 0]} dim={[PORTAO.largura / 2, CERCA.altura - 0.1, 0.05]} cor={CU.cerca} metal={0.5} opacidade={0.55} />
        </group>
      </group>
      <Caixa pos={[PORTAO.x + PORTAO.largura / 4, CERCA.altura / 2, CERCA.zMax]} dim={[PORTAO.largura / 2, CERCA.altura - 0.1, 0.05]} cor={CU.cerca} metal={0.5} opacidade={0.55} />
    </group>
  )
}

function Rotulos() {
  return (
    <group>
      {MESAS_FV.map((m) => (
        <Etiqueta key={m.id} pos={[m.centro[0], Y_MESA + 1.6, m.centro[2]]} texto={m.id} />
      ))}
      <Etiqueta pos={[SKID.centro[0], 3.6, SKID.centro[2]]} texto="Skid · inversores + QGBT" />
      <Etiqueta pos={[TRAFO.centro[0], 3.0, TRAFO.centro[2]]} texto={`Trafo ${USINA.trafoKva} kVA`} />
      <Etiqueta pos={[SE.centro[0], 4.0, SE.centro[2]]} texto="Subestação · medição e proteção" />
      <Etiqueta pos={[PORTAO.x, 2.8, CERCA.zMax]} texto="Portão" />
    </group>
  )
}

// ─── Aterramento ─────────────────────────────────────────────────────────────

/** Terminal de aterramento principal do skid (referência da continuidade). */
function BepSkid() {
  return (
    <group>
      <Caixa pos={BEP_SKID} dim={[0.6, 0.08, 0.06]} cor={color.spda.cobre} rough={0.35} metal={0.8} sombra={false} />
      <Barra a={[BEP_SKID[0], BEP_SKID[1] - 0.04, BEP_SKID[2] - 0.03]} b={[BEP_SKID[0], -0.5, BEP_SKID[2] - 0.03]} raio={0.02} cor={color.spda.cobre} />
    </group>
  )
}

/** Malha enterrada, desenhada através do solo quando o aluno pede. */
function MalhaEnterrada({ visivel }: { visivel: boolean }) {
  if (!visivel) return null
  return (
    <group>
      {MALHA_FV.map((c) => (
        <Barra key={c.id} a={c.a} b={c.b} raio={c.equalizacao ? 0.05 : 0.07} cor={c.equalizacao ? color.accentCool : CU.malha} atravessaSolo />
      ))}
      {HASTES_FV.map((h, i) => (
        <Barra key={i} a={h} b={[h[0], h[1] - COMPRIMENTO_HASTE, h[2]]} raio={0.05} cor={CU.malha} atravessaSolo />
      ))}
    </group>
  )
}

/** Marcador de ponto de ensaio: esfera colorida pela leitura, anel pulsante no ativo. */
function Marcador({ pos, cor, ativo }: { pos: Vec3; cor: string; ativo: boolean }) {
  const anel = useRef<THREE.Mesh>(null)
  const reduzido = useSim((s) => s.reducedMotion)
  const invalidate = useThree((s) => s.invalidate)
  useFrame(({ clock }) => {
    if (!anel.current || !ativo) return
    const k = reduzido ? 1.2 : 1 + 0.35 * Math.sin(clock.elapsedTime * 4)
    anel.current.scale.setScalar(k)
    if (!reduzido) invalidate()
  })
  return (
    <group position={pos}>
      <mesh renderOrder={25}>
        <sphereGeometry args={[ativo ? 0.22 : 0.14, 16, 16]} />
        <meshBasicMaterial color={cor} depthTest={false} transparent toneMapped={false} />
      </mesh>
      {ativo && (
        <mesh ref={anel} rotation={[-Math.PI / 2, 0, 0]} renderOrder={25}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color={cor} depthTest={false} transparent opacity={0.8} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

const corLeitura = (cor?: 'pass' | 'marginal' | 'fail') => (cor ? color.status[cor] : color.textMuted)

/** Ensaio 1: cabo de ensaio do BEP do skid até o ponto ativo, marcadores coloridos. */
function EnsaioContinuidade() {
  const pontoCont = useUsinaFv((s) => s.pontoCont)
  const leituras = useUsinaFv((s) => s.continuidade)
  const ativo = PONTOS_CONTINUIDADE_FV.find((p) => p.id === pontoCont)
  const rota = useMemo(() => {
    if (!ativo) return null
    const y = 0.06
    const saida: Vec3 = [BEP_SKID[0], y, BEP_SKID[2] - 0.6]
    return [BEP_SKID, saida, [ativo.pos[0], y, saida[2]], [ativo.pos[0], y, ativo.pos[2]], ativo.pos] as Vec3[]
  }, [ativo])
  return (
    <group>
      {PONTOS_CONTINUIDADE_FV.map((p) => (
        <Marcador key={p.id} pos={p.pos} cor={corLeitura(leituras[p.id]?.cor)} ativo={p.id === pontoCont} />
      ))}
      {rota && <Line points={rota} color={color.accent} lineWidth={2.5} />}
      {ativo && <Etiqueta pos={[ativo.pos[0], ativo.pos[1] + 0.9, ativo.pos[2]]} texto={ativo.nome} destaque />}
      <Etiqueta pos={[BEP_SKID[0], BEP_SKID[1] + 0.8, BEP_SKID[2] - 0.2]} texto="BEP do skid · garra fixa" />
    </group>
  )
}

/** Ensaio 2: terrômetro junto a E e as estacas P e C ao longo da estrada. */
function EnsaioQuedaPotencial() {
  const distanciaC = useUsinaFv((s) => s.distanciaC)
  const cravadas = useUsinaFv((s) => s.estacasCravadas)
  const posP = useUsinaFv((s) => s.posP)
  const e = ESTACAS_FV.e
  const dir = ESTACAS_FV.direcao
  const ao = (d: number, dx = 0): Vec3 => [e[0] + dir[0] * d + dx, 0, e[2] + dir[2] * d]
  const terrometro: Vec3 = [e[0] + 1.6, 0, e[2] + 0.8]
  const posC = ao(distanciaC)
  const posPe = ao(posP * distanciaC)
  const marcos = useMemo(() => Array.from({ length: Math.floor(distanciaC / 50) }, (_, i) => (i + 1) * 50), [distanciaC])
  return (
    <group>
      {/* ponto E: caixa de inspeção no anel de equalização */}
      <Caixa pos={[e[0], 0.05, e[2]]} dim={[0.4, 0.1, 0.4]} cor={CU.alvenaria} />
      <Estaca pos={e} cor={CU.estacaE} rotulo="E · malha" />
      <Caixa pos={[terrometro[0], 0.12, terrometro[2]]} dim={[0.28, 0.24, 0.2]} cor={color.inbrat.painel} rough={0.5} />
      <Line points={[[terrometro[0], 0.2, terrometro[2]], [e[0], 0.3, e[2]]]} color={CU.estacaE} lineWidth={2} />
      {cravadas && (
        <>
          <Estaca pos={posC} cor={CU.estacaC} rotulo={`C · ${distanciaC} m`} alta />
          <Estaca pos={posPe} cor={CU.estacaP} rotulo={`P · ${Math.round(posP * 100)} %`} alta />
          <Line points={[[terrometro[0], 0.2, terrometro[2]], ao(1, 0.5), ao(distanciaC, 0.5), [posC[0], 0.5, posC[2]]]} color={CU.estacaC} lineWidth={2} />
          <Line points={[[terrometro[0], 0.2, terrometro[2]], ao(1, -0.5), ao(posP * distanciaC, -0.5), [posPe[0], 0.5, posPe[2]]]} color={CU.estacaP} lineWidth={2} />
          {marcos.map((m) => (
            <Etiqueta key={m} pos={[e[0] + 3.5, 0.3, e[2] + m]} texto={`${m} m`} />
          ))}
        </>
      )}
    </group>
  )
}

/** Estaca cravada; as de P e C ganham um farol alto para serem vistas de longe. */
function Estaca({ pos, cor, rotulo, alta = false }: { pos: Vec3; cor: string; rotulo: string; alta?: boolean }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshStandardMaterial color={CU.estrutura} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.4} />
      </mesh>
      {alta && (
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 4, 10]} />
          <meshBasicMaterial color={cor} transparent opacity={0.45} toneMapped={false} />
        </mesh>
      )}
      <Etiqueta pos={[0, alta ? 4.6 : 1.1, 0]} texto={rotulo} destaque={alta} />
    </group>
  )
}

/** Ensaio 3: eletrodos de pé (placas) em cada ponto, coloridos pelo resultado. */
function EnsaioToquePasso() {
  const pontoTP = useUsinaFv((s) => s.pontoTP)
  const leituras = useUsinaFv((s) => s.toquePasso)
  return (
    <group>
      {PONTOS_TOQUE_PASSO_FV.map((p) => {
        const cor = corLeitura(leituras[p.id]?.cor)
        const ativo = p.id === pontoTP
        // toque: pés juntos a 1 m do objeto; passo: dois eletrodos afastados 1 m
        const placas: Vec3[] = p.tipo === 'toque' ? [[0, 0.02, 0]] : [[-0.5, 0.02, 0], [0.5, 0.02, 0]]
        return (
          <group key={p.id} position={p.pos}>
            {placas.map((d, i) => (
              <mesh key={i} position={d} rotation={[-Math.PI / 2, 0, 0]} renderOrder={22}>
                <circleGeometry args={[ativo ? 0.28 : 0.2, 24]} />
                <meshBasicMaterial color={cor} transparent opacity={0.9} depthTest={false} toneMapped={false} />
              </mesh>
            ))}
            <Marcador pos={[0, 0.9, 0]} cor={cor} ativo={ativo} />
            {ativo && <Etiqueta pos={[0, 1.7, 0]} texto={p.nome} destaque />}
          </group>
        )
      })}
    </group>
  )
}

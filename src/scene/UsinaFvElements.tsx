import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Html, Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  MESAS_FV,
  MESA,
  MODULO,
  PILARES_POR_FILA,
  USINA,
  CERCA,
  PORTAO,
  SKID,
  TRAFO,
  SE,
  POSTE_MT,
  AREA_BRITA,
  BEP_SKID,
  HASTES_FV,
  COMPRIMENTO_HASTE,
  PROFUNDIDADE_MALHA,
  ESTACAS_FV,
  DISTANCIAS_C_M,
  PONTOS_CONTINUIDADE_FV,
  PONTOS_TOQUE_PASSO_FV,
  VISTAS_FV,
  malhaDoCenario,
} from '../catalog/usinaFvPontos'
import type { Vec3 } from '../catalog/types'
import { useUsinaFv, malhaDoSolo, mapaDoCenario } from '../sim/usinaFvStore'
import { useSim } from '../sim/store'
import { useView } from '../sim/viewStore'
import { I_MALHA_A, POSICOES_PATAMAR, limitePasso, limiteToque } from '../engine/usinaFv'
import { color } from '../design/tokens'
import { resolverQualidade } from './quality'
import { UsinaFvModelo } from './UsinaFvModelo'
import { amostrarGrade, subdividirGrade, equipotenciais } from './usinaFvRelevo'
import { SetasCorrente } from './SpdaFluxo'

/** Cena montada com o kit GLB nas coordenadas originais do catalogo.
 * A camada didatica continua independente; o procedural cobre falhas de carregamento.
 */
export const USINA_PROCEDURAL = false

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
  const comDefeitos = useUsinaFv((s) => s.cenario === 'com-defeitos')
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
      if (tamanho.width < tamanho.height) useView.getState().pedirPose(vistaGeralResponsiva(tamanho.width, tamanho.height))
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
      <Terreno />
      {USINA_PROCEDURAL || !equipamento.modelPath ? <AmbienteProcedural detail={detail} /> : (
        <UsinaFvModelo caminho={equipamento.modelPath} detalhe={detail}
          fallback={<AmbienteProcedural detail={detail} />} onPick={pickMode ? reportar : undefined} />
      )}
      {detail && <Rotulos />}
      <BepSkid />
      <Derivacoes comDefeitos={comDefeitos} />
      <CordoalhaPortao presente={!comDefeitos} />
      <MalhaEnterrada visivel={mostrarMalha} comDefeitos={comDefeitos} />
      {etapa === 'fv-continuidade' && <EnsaioContinuidade />}
      {etapa === 'fv-resistencia' && <EnsaioQuedaPotencial baixo={!detail} />}
      {etapa === 'fv-toque-passo' && (
        <>
          <EnsaioToquePasso />
          <MapaPotencial />
        </>
      )}
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
  // a estaca C chega a 5× a diagonal da malha (~470 m na planta de 300 kW)
  const comprimentoEstrada = Math.max(...DISTANCIAS_C_M) + 80
  const acabamento = useMemo(() => {
    const textura = (repetirX: number, repetirY: number, contraste: number) => {
      const dados = new Uint8Array(128 * 128 * 4)
      let semente = 300
      for (let i = 0; i < 128 * 128; i++) {
        semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0
        const v = Math.round(255 - (semente / 4294967296) * contraste)
        dados.set([v, v, v, 255], i * 4)
      }
      const t = new THREE.DataTexture(dados, 128, 128)
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(repetirX, repetirY)
      t.magFilter = THREE.LinearFilter
      t.minFilter = THREE.LinearMipmapLinearFilter
      t.generateMipmaps = true; t.needsUpdate = true
      return t
    }
    const terreno = new THREE.PlaneGeometry(1600, 1600, 128, 128)
    const p = terreno.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = -p.getY(i)
      const fora = THREE.MathUtils.smoothstep(Math.max(Math.abs(x) - 45, Math.abs(z) - 35), 0, 45)
      p.setZ(i, fora * .18 * Math.sin(x * .045) * Math.sin(z * .037) * THREE.MathUtils.smoothstep(Math.abs(x - ESTACAS_FV.e[0]), 15, 30))
    }
    terreno.computeVertexNormals()
    return { terreno, grama: textura(240, 240, 55), brita: textura(20, 8, 130), estrada: textura(2, 160, 45), acesso: textura(6, 2, 45) }
  }, [])
  useEffect(() => () => Object.values(acabamento).forEach(a => a.dispose()), [acabamento])
  return (
    <group>
      <mesh geometry={acabamento.terreno} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <meshLambertMaterial color={CU.grama} map={acabamento.grama} />
      </mesh>
      {/* estrada de terra: do portão para o sul, por onde as estacas são levadas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ESTACAS_FV.e[0], -0.01, CERCA.zMax + comprimentoEstrada / 2]} receiveShadow>
        <planeGeometry args={[5, comprimentoEstrada]} />
        <meshLambertMaterial color={CU.terra} map={acabamento.estrada} />
      </mesh>
      {/* acesso interno do portão ao skid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(PORTAO.x + AREA_BRITA.xMin) / 2, -0.01, (CERCA.zMax + AREA_BRITA.zMax) / 2]} receiveShadow>
        <planeGeometry args={[Math.abs(AREA_BRITA.xMin - PORTAO.x) + 4, Math.abs(CERCA.zMax - AREA_BRITA.zMax) + 1]} />
        <meshLambertMaterial color={CU.terra} map={acabamento.acesso} />
      </mesh>
      {/* camada de brita sob skid e trafo (eleva o limite de toque/passo) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(AREA_BRITA.xMin + AREA_BRITA.xMax) / 2, 0.005, (AREA_BRITA.zMin + AREA_BRITA.zMax) / 2]} receiveShadow>
        <planeGeometry args={[AREA_BRITA.xMax - AREA_BRITA.xMin, AREA_BRITA.zMax - AREA_BRITA.zMin]} />
        <meshLambertMaterial color={CU.brita} map={acabamento.brita} />
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
  const xsPilar = useMemo(
    () => Array.from({ length: PILARES_POR_FILA }, (_, i) => -MESA.comprimento / 2 + 0.6 + (i * (MESA.comprimento - 1.2)) / (PILARES_POR_FILA - 1)),
    [],
  )
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

/**
 * Derivação de cada mesa: do terminal da estrutura até o solo (o trecho
 * enterrado aparece com a malha). No cenário com defeitos, o conector de M6
 * mostra a oxidação que a inspeção visual deve achar; o de M4 parece normal —
 * a anodização só aparece na medição.
 */
function Derivacoes({ comDefeitos }: { comDefeitos: boolean }) {
  return (
    <group>
      {PONTOS_CONTINUIDADE_FV.filter((p) => p.grupo === 'Mesas').map((p) => {
        const oxidado = comDefeitos && p.defeito === 'corrosao'
        return (
          <group key={p.id}>
            <Barra a={[p.pos[0], p.pos[1], p.pos[2]]} b={[p.pos[0], -0.02, p.pos[2]]} raio={0.012} cor={color.spda.cobre} />
            <Caixa pos={[p.pos[0], p.pos[1], p.pos[2]]} dim={[0.07, 0.06, 0.07]} cor={oxidado ? color.spda.oxidacao : color.spda.cobre} metal={oxidado ? 0.1 : 0.8} rough={oxidado ? 0.9 : 0.35} sombra={false} />
          </group>
        )
      })}
    </group>
  )
}

/** Cordoalha flexível entre a folha do portão e o mourão — falta no cenário com defeitos. */
function CordoalhaPortao({ presente }: { presente: boolean }) {
  if (!presente) return null
  const z = CERCA.zMax + 0.06
  const xMourao = PORTAO.x + PORTAO.largura / 2
  return (
    <Line
      points={[[xMourao - 0.35, 0.9, z], [xMourao - 0.18, 0.72, z], [xMourao, 0.9, z]]}
      color={color.spda.cobre}
      lineWidth={3}
    />
  )
}

/** Malha enterrada, desenhada através do solo quando o aluno pede. */
function MalhaEnterrada({ visivel, comDefeitos }: { visivel: boolean; comDefeitos: boolean }) {
  if (!visivel) return null
  return (
    <group>
      {malhaDoCenario(comDefeitos).map((c) => (
        <Barra key={c.id} a={c.a} b={c.b} raio={c.equalizacao ? 0.05 : 0.07} cor={c.equalizacao ? color.accentCool : CU.malha} atravessaSolo />
      ))}
      {HASTES_FV.map((h, i) => (
        <Barra key={i} a={h} b={[h[0], h[1] - COMPRIMENTO_HASTE, h[2]]} raio={0.05} cor={CU.malha} atravessaSolo />
      ))}
      {/* derivações das mesas: do pé do terminal até a linha de pilares */}
      {PONTOS_CONTINUIDADE_FV.filter((p) => p.grupo === 'Mesas').map((p) => (
        <Barra key={p.id} a={[p.pos[0], -0.02, p.pos[2]]} b={[p.pos[0], -PROFUNDIDADE_MALHA, p.pos[2]]} raio={0.03} cor={color.spda.cobre} atravessaSolo />
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

/** Mantém o eixo da vista calibrada e afasta a câmera quando a janela é estreita. */
function vistaGeralResponsiva(largura: number, altura: number) {
  const v = VISTAS_FV.geral
  const fator = largura < altura ? Math.max(1, .95 * altura / largura) : 1
  return { target: v.target, pos: v.pos.map((p, i) => v.target[i] + (p - v.target[i]) * fator) as Vec3 }
}

/** Ensaio 1: miliohmímetro no BEP do skid, cabo até o ponto ativo, marcadores coloridos. */
function EnsaioContinuidade() {
  const pontoCont = useUsinaFv((s) => s.pontoCont)
  const leituras = useUsinaFv((s) => s.continuidade)
  const ativo = PONTOS_CONTINUIDADE_FV.find((p) => p.id === pontoCont)
  const leitura = ativo ? leituras[ativo.id] : undefined
  const instrumento: Vec3 = [BEP_SKID[0] + 0.9, 0, BEP_SKID[2] - 1]
  const rota = useMemo(() => {
    if (!ativo) return null
    const y = 0.06
    const saida: Vec3 = [instrumento[0], y, instrumento[2] - 0.3]
    return [[instrumento[0], 0.2, instrumento[2]], saida, [ativo.pos[0], y, saida[2]], [ativo.pos[0], y, ativo.pos[2]], ativo.pos] as Vec3[]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo])
  return (
    <group>
      {PONTOS_CONTINUIDADE_FV.map((p) => (
        <Marcador key={p.id} pos={p.pos} cor={corLeitura(leituras[p.id]?.cor)} ativo={p.id === pontoCont} />
      ))}
      {/* instrumento provisório: maleta com o visor; cabo da garra fixa até o BEP */}
      <Caixa pos={[instrumento[0], 0.12, instrumento[2]]} dim={[0.42, 0.24, 0.32]} cor={color.inbrat.maleta} rough={0.5} />
      <Line points={[[instrumento[0], 0.2, instrumento[2]], [BEP_SKID[0], 0.1, BEP_SKID[2] - 0.3], BEP_SKID]} color={color.accentCool} lineWidth={2.5} />
      {rota && <Line points={rota} color={color.accent} lineWidth={2.5} />}
      <Etiqueta pos={[instrumento[0], 0.7, instrumento[2]]} texto={leitura ? `${leitura.display} Ω` : 'miliohmímetro'} destaque={!!leitura} />
      {ativo && <Etiqueta pos={[ativo.pos[0], ativo.pos[1] + 0.9, ativo.pos[2]]} texto={ativo.nome} destaque />}
      <Etiqueta pos={[BEP_SKID[0], BEP_SKID[1] + 0.8, BEP_SKID[2] - 0.2]} texto="BEP do skid · garra fixa" />
    </group>
  )
}

/** Caminho reto entre pontos, para as setas de corrente. */
function caminho(pontos: Vec3[]): THREE.CurvePath<THREE.Vector3> {
  const c = new THREE.CurvePath<THREE.Vector3>()
  for (let i = 1; i < pontos.length; i++) c.add(new THREE.LineCurve3(new THREE.Vector3(...pontos[i - 1]), new THREE.Vector3(...pontos[i])))
  return c
}

/**
 * Ensaio 2: terrômetro junto a E e as estacas P e C ao longo da estrada, com
 * a zona de influência da malha (âmbar) e a janela do patamar (52–72 %).
 * A corrente sai pelo cabo C, atravessa o solo e volta pela malha (setas); o
 * cabo P só lê tensão.
 */
function EnsaioQuedaPotencial({ baixo }: { baixo: boolean }) {
  const distanciaC = useUsinaFv((s) => s.distanciaC)
  const cravadas = useUsinaFv((s) => s.estacasCravadas)
  const posP = useUsinaFv((s) => s.posP)
  const solo = useUsinaFv((s) => s.solo)
  const cenario = useUsinaFv((s) => s.cenario)
  const zona = malhaDoSolo(solo, cenario).unit.influenciaEstradaM
  const e = ESTACAS_FV.e
  const dir = ESTACAS_FV.direcao
  const ao = (d: number, dx = 0, y = 0): Vec3 => [e[0] + dir[0] * d + dx, y, e[2] + dir[2] * d]
  const terrometro: Vec3 = [e[0] + 1.6, 0, e[2] + 0.8]
  const posC = ao(distanciaC)
  const posPe = ao(posP * distanciaC)
  const marcos = useMemo(() => Array.from({ length: Math.floor(distanciaC / 50) }, (_, i) => (i + 1) * 50), [distanciaC])
  const [j0, j1] = [POSICOES_PATAMAR[0] * distanciaC, POSICOES_PATAMAR[2] * distanciaC]
  const janelaForaDaZona = j0 > zona
  const correnteC = useMemo(() => caminho([[terrometro[0], 0.25, terrometro[2]], ao(1, 0.5, 0.25), ao(distanciaC, 0.5, 0.25), [posC[0], 0.6, posC[2]]]), [distanciaC])
  const correnteE = useMemo(() => caminho([[e[0], 0.35, e[2]], [terrometro[0], 0.25, terrometro[2]]]), [])
  return (
    <group>
      {/* faixas no chão da estrada: zona de influência e janela do patamar */}
      <Faixa de={0} ate={Math.min(zona, distanciaC)} cor={color.status.marginal} largura={7} y={0.02} />
      {cravadas && <Faixa de={j0} ate={j1} cor={janelaForaDaZona ? color.status.pass : color.status.fail} largura={4} y={0.03} />}
      <Etiqueta pos={ao(Math.min(zona, distanciaC) / 2, -6, 0.4)} texto={`zona de influência da malha · ~${zona} m`} />

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
          <SetasCorrente curva={correnteC} cor={color.accent} baixo={baixo} />
          <SetasCorrente curva={correnteE} cor={color.accent} baixo={baixo} />
          {marcos.map((m) => (
            <Etiqueta key={m} pos={[e[0] + 3.5, 0.3, e[2] + m]} texto={`${m} m`} />
          ))}
        </>
      )}
    </group>
  )
}

/** Faixa translúcida no chão, ao longo da linha das estacas (de/ate em metros a partir de E). */
function Faixa({ de, ate, cor, largura, y }: { de: number; ate: number; cor: string; largura: number; y: number }) {
  if (ate <= de) return null
  const e = ESTACAS_FV.e
  const dir = ESTACAS_FV.direcao
  const meio = (de + ate) / 2
  return (
    <mesh position={[e[0] + dir[0] * meio, y, e[2] + dir[2] * meio]} rotation={[-Math.PI / 2, 0, Math.atan2(dir[0], dir[2])]} renderOrder={3}>
      <planeGeometry args={[largura, ate - de]} />
      <meshBasicMaterial color={cor} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
    </mesh>
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

/** Ensaio 3: eletrodos de pé (placas) em cada ponto e a pessoa no ponto ativo. */
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
          <group key={p.id}>
            <group position={p.pos}>
              {placas.map((d, i) => (
                <mesh key={i} position={d} rotation={[-Math.PI / 2, 0, 0]} renderOrder={22}>
                  <circleGeometry args={[ativo ? 0.28 : 0.2, 24]} />
                  <meshBasicMaterial color={cor} transparent opacity={0.9} depthTest={false} toneMapped={false} />
                </mesh>
              ))}
              {!ativo && <Marcador pos={[0, 0.9, 0]} cor={cor} ativo={false} />}
            </group>
            {ativo && <Pessoa pos={p.pos} alvo={p.alvo} passo={p.tipo === 'passo'} cor={cor} />}
            {ativo && <Etiqueta pos={[p.pos[0], 2.2, p.pos[2]]} texto={leituras[p.id] ? `${p.nome} · ${Math.round(leituras[p.id].vFalta)} V` : p.nome} destaque />}
          </group>
        )
      })}
    </group>
  )
}

/**
 * Figura humana simplificada (1,75 m): no toque, de frente para a massa com a
 * mão nela; no passo, pernas abertas 1 m. O contorno dos pés ganha a cor do
 * resultado. O Codex pode trocar por um personagem modelado.
 */
function Pessoa({ pos, alvo, passo, cor }: { pos: Vec3; alvo?: Vec3; passo: boolean; cor: string }) {
  const corpo = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    corpo.current?.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return
      o.renderOrder = 24
      const materiais = Array.isArray(o.material) ? o.material : [o.material]
      materiais.forEach(m => { m.depthTest = false; m.depthWrite = false; m.transparent = true })
    })
  })
  const giro = alvo ? Math.atan2(alvo[0] - pos[0], alvo[2] - pos[2]) : 0
  const pele = CU.pessoa
  const roupa = CU.roupa
  const abertura = passo ? 0.5 : 0.12
  // braço de toque: do ombro até a mão na massa (no referencial da pessoa)
  const distAlvo = alvo ? Math.hypot(alvo[0] - pos[0], alvo[2] - pos[2]) : 0
  const ombro: Vec3 = [0.2, 1.42, 0]
  const mao: Vec3 = alvo ? [0.12, alvo[1], distAlvo - 0.05] : [0.25, 0.9, 0.1]
  return (
    <group ref={corpo} position={pos} rotation={[0, giro, 0]}>
      {/* pernas */}
      {[-1, 1].map((s) => (
        <Barra key={s} a={[s * abertura, 0.05, 0]} b={[s * 0.1, 0.9, 0]} raio={0.07} cor={roupa} />
      ))}
      {/* tronco e cabeça */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.42, 4, 10]} />
        <meshStandardMaterial color={roupa} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.64, 0]} castShadow>
        <sphereGeometry args={[0.11, 14, 14]} />
        <meshStandardMaterial color={pele} roughness={0.7} />
      </mesh>
      {/* braços: um relaxado e, no toque, o outro esticado até a massa */}
      <Barra a={[-0.2, 1.42, 0]} b={[-0.26, 0.92, 0.02]} raio={0.045} cor={roupa} />
      <Barra a={ombro} b={mao} raio={0.045} cor={alvo ? pele : roupa} />
      {/* contorno dos pés com a cor do resultado */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * abertura, 0.03, 0.05]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={23}>
          <ringGeometry args={[0.13, 0.18, 20]} />
          <meshBasicMaterial color={cor} transparent opacity={0.95} depthTest={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/** Cor da escala de potenciais (paradas do GroundPRO) para t ∈ [0, 1]. */
const ESCALA = color.usinaFv.escalaPotencial.map(([t, c]) => [t, new THREE.Color(c)] as const)
function corEscala(t: number, alvo: THREE.Color): THREE.Color {
  const x = Math.max(0, Math.min(1, t))
  for (let i = 1; i < ESCALA.length; i++) {
    if (x <= ESCALA[i][0]) {
      const [t0, c0] = ESCALA[i - 1]
      const [t1, c1] = ESCALA[i]
      return alvo.copy(c0).lerp(c1, (x - t0) / (t1 - t0))
    }
  }
  return alvo.copy(ESCALA[ESCALA.length - 1][1])
}

/**
 * Mapa de potenciais no solo durante a falta: grade pré-calculada (V/GPR) em
 * cores por vértice. Modo "áreas seguras": âmbar onde o toque passaria do
 * limite, vermelho onde o passo passaria (brita no skid/trafo, grama no resto).
 * Relevo: exagero visual de 12 m e equipotenciais sobre a grade interpolada.
 */
function MapaPotencial() {
  const modo = useUsinaFv((s) => s.mapaPotencial)
  const solo = useUsinaFv((s) => s.solo)
  const cenario = useUsinaFv((s) => s.cenario)
  const reduzido = useSim(s => s.reducedMotion)
  const pref = useSim(s => s.qualidadePref)
  const pontoTP = useUsinaFv(s => s.pontoTP)
  const grupo = useRef<THREE.Group>(null)
  const invalidate = useThree(s => s.invalidate)
  const tamanho = useThree(s => s.size)
  const animacao = useRef({ atual: 0, origem: 0, alvo: 0, tempo: .6 })
  const m = useMemo(() => subdividirGrade(mapaDoCenario(cenario), modo === 'seguranca' || resolverQualidade(pref).tier === 'baixo' ? 1 : 2), [cenario, pref, modo === 'seguranca'])
  const curvas = useMemo(() => equipotenciais(m), [m])
  const linhas = useMemo(() => new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(curvas.vertices, 3)), [curvas])
  const ativo = PONTOS_TOQUE_PASSO_FV.find(p => p.id === pontoTP)
  const gpr = malhaDoSolo(solo, cenario).rg * I_MALHA_A
  useEffect(() => {
    const a = animacao.current
    a.origem = a.atual; a.alvo = modo === 'relevo' ? 1 : 0; a.tempo = 0
    invalidate()
  }, [modo, reduzido, invalidate])
  useEffect(() => {
    // A câmera de toque fica abaixo do platô. A vista geral já calibrada permite ler o relevo.
    if (modo === 'relevo') useView.getState().pedirPose(vistaGeralResponsiva(tamanho.width, tamanho.height))
  }, [modo, tamanho.width, tamanho.height])
  useFrame((_, dt) => {
    const a = animacao.current
    a.tempo = Math.min(.6, a.tempo + dt)
    const t = reduzido ? 1 : a.tempo / .6
    a.atual = THREE.MathUtils.lerp(a.origem, a.alvo, t * t * (3 - 2 * t))
    if (grupo.current) grupo.current.scale.y = Math.max(.00001, a.atual)
    if (t < 1) invalidate()
  })
  useEffect(() => () => linhas.dispose(), [linhas])
  const geometria = useMemo(() => {
    const malha = malhaDoSolo(solo, cenario)
    const gpr = malha.rg * I_MALHA_A
    const pos = new Float32Array(m.nx * m.nz * 3)
    const cores = new Float32Array(m.nx * m.nz * 3)
    const c = new THREE.Color()
    const verde = new THREE.Color(color.status.pass)
    const ambar = new THREE.Color(color.status.marginal)
    const vermelho = new THREE.Color(color.status.fail)
    const rel = (i: number, j: number) => m.rel[Math.max(0, Math.min(m.nz - 1, j)) * m.nx + Math.max(0, Math.min(m.nx - 1, i))]
    for (let j = 0; j < m.nz; j++) {
      for (let i = 0; i < m.nx; i++) {
        const k = j * m.nx + i
        const x = m.x0 + i * m.passo
        const z = m.z0 + j * m.passo
        pos.set([x, rel(i, j) * 12, z], k * 3)
        if (modo === 'seguranca') {
          const brita = x >= AREA_BRITA.xMin && x <= AREA_BRITA.xMax && z >= AREA_BRITA.zMin && z <= AREA_BRITA.zMax
          const sup = brita ? 'brita' : 'grama'
          const toque = gpr * (1 - rel(i, j))
          // passo ≈ gradiente × 1 m (diferenças centrais na grade)
          const gx = (rel(i + 1, j) - rel(i - 1, j)) / (2 * m.passo)
          const gz = (rel(i, j + 1) - rel(i, j - 1)) / (2 * m.passo)
          const passo = gpr * Math.hypot(gx, gz)
          c.copy(passo > limitePasso(malha.rho, sup) ? vermelho : toque > limiteToque(malha.rho, sup) ? ambar : verde)
        } else {
          corEscala(rel(i, j), c)
        }
        cores.set([c.r, c.g, c.b], k * 3)
      }
    }
    const idx: number[] = []
    for (let j = 0; j < m.nz - 1; j++)
      for (let i = 0; i < m.nx - 1; i++) {
        const a = j * m.nx + i
        idx.push(a, a + m.nx, a + 1, a + 1, a + m.nx, a + m.nx + 1)
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(cores, 3))
    g.setIndex(idx)
    return g
  }, [modo, solo, cenario, m])
  useEffect(() => () => geometria.dispose(), [geometria])
  if (modo === 'desligado') return null
  return (
    <group ref={grupo} position={[0, .05, 0]} scale={[1, .00001, 1]}>
      <mesh geometry={geometria} renderOrder={2}>
        <meshBasicMaterial vertexColors transparent opacity={modo === 'relevo' ? .38 : .62} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {modo === 'relevo' && <>
        <lineSegments geometry={linhas} renderOrder={3}>
          <lineBasicMaterial color={color.text} transparent opacity={.55} depthWrite={false} toneMapped={false} />
        </lineSegments>
        {curvas.rotulos.map(r => <Etiqueta key={r.nivel} pos={r.pos} texto={Math.round(r.nivel * gpr).toLocaleString('pt-BR') + ' V'} />)}
        {ativo && <>
          <Line points={[[ativo.pos[0], 0, ativo.pos[2]], [ativo.pos[0], amostrarGrade(m, ativo.pos[0], ativo.pos[2]) * 12, ativo.pos[2]]]} color={color.text} lineWidth={2} depthTest={false} renderOrder={24} />
          <Etiqueta pos={[ativo.pos[0], amostrarGrade(m, ativo.pos[0], ativo.pos[2]) * 12 + .15, ativo.pos[2]]} texto={'Sob os pés · ' + Math.round(amostrarGrade(m, ativo.pos[0], ativo.pos[2]) * gpr).toLocaleString('pt-BR') + ' V'} />
        </>}
      </>}
    </group>
  )
}

function AmbienteProcedural({ detail }: { detail: boolean }) {
  return <><Mesas detail={detail} /><Skid /><Transformador detail={detail} /><Subestacao /><Cerca /></>
}

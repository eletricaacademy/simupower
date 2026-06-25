import { useMemo } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../lib/asset'
import { useVerif } from '../sim/verifStore'
import { ENSAIOS_VERIFICACAO, FLUKE_FUNCOES, QUADRO_PONTOS } from '../catalog/verificacaoTestes'
import { posFurosBR, posSoqueteBR } from './TomadaBR'

// Modo QUADRO: Fluke posicionado em frente aos barramentos, com 2 cabos
// (fase=vermelho, terra=verde) até os pontos de barramento do Pablo.
const FLUKE_QUADRO_POS: [number, number, number] = [5.58, 1.65, 4.5] // baixado 25cm

/**
 * Visor projetado sobre o LCD do modelo. A superfície do LCD é INCLINADA (~10,6°:
 * o topo recua para a parede), então o visor é inclinado p/ casar com a normal
 * real (sondada por raycast: ao subir +y, a superfície vai +x). A posição é
 * RELATIVA ao Fluke (centro do LCD = flukePos + offset) → segue o objeto quando
 * ele se move; a orientação acompanha a face frontal do modelo. Tamanho ~0,20×0,14 m
 * (medido pelo Pablo nos 4 cantos).
 */
// centro do LCD relativo ao Fluke (GRAVADO no objeto → segue quando o Fluke move).
// Abaixado ~1,4 cm ao longo do plano inclinado (down-tangent) p/ centrar no LCD.
const LCD_OFFSET: [number, number, number] = [-0.0806, -0.002, -0.005]
const LCD_TILT = 0.186 // rad (~10,6°) — inclinação do LCD (topo recua)
const LCD_SCALE = 0.023 // div 230×160 px → ~0,20 × 0,14 m
// Orientação SEM ROLL (alinhada ao retângulo do LCD): eixos explícitos —
//  frente(+z)=normal (de frente p/ -x, inclinada +y); cima(+y)=tangente da
//  superfície (sobe e recua); direita(+x)=ao longo da parede (+z mundo).
const LCD_NORMAL = new THREE.Vector3(-Math.cos(LCD_TILT), Math.sin(LCD_TILT), 0)
const LCD_UP = new THREE.Vector3(Math.sin(LCD_TILT), Math.cos(LCD_TILT), 0)
const LCD_RIGHT = new THREE.Vector3(0, 0, 1)
const LCD_QUAT = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(LCD_RIGHT, LCD_UP, LCD_NORMAL),
)

/**
 * Fluke 1662 — instrumento de teste de instalações (NBR 5410 §7). Aparece "na
 * mão", à FRENTE da tomada ensaiada, com os CABOS DE MEDIÇÃO saindo do TOPO do
 * medidor (bornes na ordem do manual: B-G-R) até os 3 furos do soquete.
 * Cores e bornes FIÉIS ao manual:
 *   B (azul)    = N  (neutro)
 *   G (verde)   = PE (terra)
 *   R (vermelho)= L  (fase)
 *
 * GLB ~8,7× maior que o real; escala p/ ~0,42 m (maior que o real p/ leitura na
 * cena). O VISOR fica na face +z do modelo → giramos -90° em Y p/ ficar de
 * frente para o operador (-x).
 */
const ALVO_M = 0.42
const ROT: [number, number, number] = [0, -Math.PI / 2, 0]
const DIST_FRENTE = 0.26
const ALTURA = 0.9

/** Cabo de medição = tubo ao longo de uma bezier (com leve barriga). */
function Cabo({ a, b, cor, sag = 0.05 }: { a: THREE.Vector3; b: THREE.Vector3; cor: string; sag?: number }) {
  const geo = useMemo(() => {
    const meio = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
    meio.y -= sag
    meio.x -= 0.04
    const curva = new THREE.QuadraticBezierCurve3(a, meio, b)
    return new THREE.TubeGeometry(curva, 24, 0.0055, 8, false)
  }, [a, b, sag])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={cor} roughness={0.5} metalness={0.05} />
    </mesh>
  )
}

/**
 * Garra jacaré (clipe de prova) na ponta do cabo. `pos` = ponto do barramento
 * (as mandíbulas mordem ali, +x); a bota isolada (cor do cabo) fica p/ -x, onde
 * o cabo conecta.
 */
function GarraJacare({ pos, cor }: { pos: THREE.Vector3; cor: string }) {
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* mandíbulas em V mordendo o barramento */}
      <mesh position={[-0.013, 0.0072, 0]} rotation={[0, 0, -0.14]} castShadow>
        <boxGeometry args={[0.044, 0.0058, 0.013]} />
        <meshStandardMaterial color="#9a9aa0" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[-0.013, -0.0072, 0]} rotation={[0, 0, 0.14]} castShadow>
        <boxGeometry args={[0.044, 0.0058, 0.013]} />
        <meshStandardMaterial color="#9a9aa0" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* corpo/mola metálica */}
      <mesh position={[-0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0088, 0.0088, 0.026, 12]} />
        <meshStandardMaterial color="#c2c2c8" roughness={0.32} metalness={0.85} />
      </mesh>
      {/* bota isolada (cor do cabo) — conexão do cabo */}
      <mesh position={[-0.062, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.0102, 0.029, 12]} />
        <meshStandardMaterial color={cor} roughness={0.5} metalness={0.05} />
      </mesh>
    </group>
  )
}

export function Fluke1662() {
  const alvo = useVerif((s) => s.alvo)
  const { scene } = useGLTF(asset('models/fluke-1662.glb'))

  const modelo = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    const size = new THREE.Vector3()
    new THREE.Box3().setFromObject(root).getSize(size)
    root.scale.setScalar(ALVO_M / Math.max(size.x, size.y, size.z))
    root.rotation.set(ROT[0], ROT[1], ROT[2])
    root.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(root)
    const c = new THREE.Vector3()
    box.getCenter(c)
    root.position.set(root.position.x - c.x, root.position.y - c.y, root.position.z - c.z)
    // meia-medidas (mundo) p/ achar o TOPO (cabos) e a FACE FRONTAL (LCD)
    const half = new THREE.Vector3()
    new THREE.Box3().setFromObject(root).getSize(half)
    return { root, halfY: half.y / 2, halfDepth: half.x / 2 }
  }, [scene])

  // dados do ensaio p/ o visor no LCD do modelo
  const fase = useVerif((s) => s.fase)
  const displayVal = useVerif((s) => s.display)
  const resultado = useVerif((s) => s.resultado)
  const ensaioIndex = useVerif((s) => s.ensaioIndex)
  const ensaio = ENSAIOS_VERIFICACAO[ensaioIndex]
  const func = FLUKE_FUNCOES.find((f) => f.id === ensaio.funcao)

  const ehQuadro = alvo === 'quadro'
  const flukePos = useMemo<[number, number, number]>(() => {
    if (ehQuadro) return FLUKE_QUADRO_POS
    const s = posSoqueteBR(alvo)
    return [s[0] - DIST_FRENTE, ALTURA, s[2]]
  }, [alvo, ehQuadro])

  // CABOS de medição: TOMADA = 3 (B-G-R nos furos, fiéis ao manual); QUADRO = 2
  // (fase=vermelho / terra=verde nos barramentos). Bornes saem do TOPO do medidor.
  const topoY = flukePos[1] + modelo.halfY - 0.01
  const { cabos, tips, garras } = useMemo(() => {
    const xb = flukePos[0] - 0.05 // bornes um pouco à frente (lado do operador)
    if (ehQuadro) {
      // garras gripam na FRENTE dos componentes (x à frente da placa de fundo).
      // VERMELHO (fase): nos 2 testes de DR (rcd) vai no DR; senão no barramento de fase.
      const ehDR = ensaio.id === 'rcd-tempo' || ensaio.id === 'rcd-rampa'
      const pf = ehDR ? QUADRO_PONTOS.pontoDR : QUADRO_PONTOS.barramentoFase
      const pt = QUADRO_PONTOS.barramentoTerra
      const pn = QUADRO_PONTOS.barramentoNeutro
      const bFase = new THREE.Vector3(ehDR ? 6.09 : 6.14, pf[1], pf[2])
      const bTerra = new THREE.Vector3(6.165, pt[1], pt[2])
      const bNeutro = new THREE.Vector3(6.14, pn[1], pn[2])
      // cabo termina na BOTA da garra (recuada ~6,2cm, lado da sala)
      const boot = (v: THREE.Vector3) => new THREE.Vector3(v.x - 0.062, v.y, v.z)
      return {
        cabos: [
          { a: new THREE.Vector3(xb, topoY, flukePos[2]), b: boot(bFase), cor: '#cc1414' }, // fase (vermelho)
          { a: new THREE.Vector3(xb, topoY, flukePos[2] - 0.05), b: boot(bTerra), cor: '#1f9d3a' }, // terra (verde)
          { a: new THREE.Vector3(xb, topoY, flukePos[2] + 0.05), b: boot(bNeutro), cor: '#2f6fd0' }, // neutro (azul)
        ],
        tips: [] as THREE.Vector3[],
        garras: [
          { pos: bFase, cor: '#cc1414' },
          { pos: bTerra, cor: '#1f9d3a' },
          { pos: bNeutro, cor: '#2f6fd0' },
        ],
      }
    }
    const f = posFurosBR(alvo)
    const v = (a: [number, number, number]) => new THREE.Vector3(a[0] - 0.004, a[1], a[2])
    const fase = v(f.fase)
    const neutro = v(f.neutro)
    const terra = v(f.terra)
    return {
      cabos: [
        { a: new THREE.Vector3(xb, topoY, flukePos[2] - 0.055), b: neutro, cor: '#2f6fd0' }, // B neutro
        { a: new THREE.Vector3(xb, topoY, flukePos[2]), b: terra, cor: '#1f9d3a' }, // G terra
        { a: new THREE.Vector3(xb, topoY, flukePos[2] + 0.055), b: fase, cor: '#cc1414' }, // R fase
      ],
      tips: [fase, neutro, terra],
      garras: [] as { pos: THREE.Vector3; cor: string }[],
    }
  }, [alvo, ehQuadro, flukePos, topoY, ensaio.id])

  // centro do LCD: RELATIVO ao Fluke (segue o objeto). Inclinação via LCD_QUAT.
  const lcdPos: [number, number, number] = [
    flukePos[0] + LCD_OFFSET[0],
    flukePos[1] + LCD_OFFSET[1],
    flukePos[2] + LCD_OFFSET[2],
  ]
  const corV = resultado ? (resultado.aprovado ? '#1d7a2e' : '#9a1414') : '#3a4220'

  return (
    <group>
      <group position={flukePos}>
        <primitive object={modelo.root} />
      </group>

      {/* VISOR digital sobre o LCD do modelo 3D — grupo com a normal inclinada do
          LCD (quaternion); o Html (transform) fica de frente p/ a normal do grupo. */}
      <group position={lcdPos} quaternion={LCD_QUAT}>
      <Html transform scale={LCD_SCALE} pointerEvents="none">
        <div
          style={{
            width: 230,
            height: 184,
            background: '#cdd6b0',
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: '"JetBrains Mono", monospace',
            color: '#1d2410',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.25)',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
            <span>{func?.simbolo}</span>
            <span style={{ color: '#5a6038', fontSize: 12 }}>
              {fase === 'medindo' ? 'medindo…' : fase === 'concluido' ? 'AUTO' : 'pronto'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{fase === 'idle' ? '– –' : displayVal}</span>
            <span style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{ensaio.unidade}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, marginTop: 2, color: corV, fontWeight: 700, minHeight: 14 }}>
            {resultado ? (resultado.aprovado ? '✓ ' + (resultado.extra ?? 'OK') : '✗ ' + (resultado.extra ?? 'FALHA')) : ''}
          </div>
        </div>
      </Html>
      </group>

      {/* cabos de medição (tomada = 3 B-G-R; quadro = 2 fase/terra) */}
      {cabos.map((c, i) => (
        <Cabo key={i} a={c.a} b={c.b} cor={c.cor} />
      ))}

      {/* pontas de prova nos furos (tomada) */}
      {tips.map((p, i) => (
        <mesh key={i} position={[p.x + 0.006, p.y, p.z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0045, 0.0045, 0.018, 12]} />
          <meshStandardMaterial color="#d8d6cf" roughness={0.5} metalness={0.2} />
        </mesh>
      ))}

      {/* garras jacaré nos barramentos (quadro) */}
      {garras.map((g, i) => (
        <GarraJacare key={i} pos={g.pos} cor={g.cor} />
      ))}
    </group>
  )
}

useGLTF.preload(asset('models/fluke-1662.glb'))

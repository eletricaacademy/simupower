import { useEffect, useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useSpda } from '../sim/spdaStore'
import { useSim } from '../sim/store'
import { useView } from '../sim/viewStore'
import { getPontoSPDA, type PontoSPDA } from '../catalog/spdaPontos'
import { color } from '../design/tokens'
import { resolverQualidade } from './quality'
import type { Vec3 } from '../catalog/types'
import { SpdaFluxo } from './SpdaFluxo'

/** Ampliação didática solicitada pelo Pablo; a instalação permanece em metros. */
const ESCALA_INBRAT = 3

/** Referência visual: INMD1 PRO, foto INMD1-05 e dimensões publicadas pela Inbrat.
 * A leitura vem do ensaio didático existente; não emula firmware/faixas do aparelho.
 */
export function posicaoInbrat(ponto: PontoSPDA): Vec3 {
  if (ponto.id === 'capt-anel') return [5.4, 9.005, -3.3]
  if (ponto.id === 'eq-bep') return [-3.65, 0.35, -0.85]
  return [ponto.posOrigem[0] + Math.sign(ponto.posOrigem[0]) * 0.9, 0.01, ponto.posOrigem[2] + Math.sign(ponto.posOrigem[2]) * 0.9]
}

export function vistaInbrat(ponto: PontoSPDA) {
  const [x, y, z] = posicaoInbrat(ponto)
  return { pos: [x + Math.sign(x) * 0.65, y + 1.5, z + Math.sign(z) * 1.25] as Vec3, target: [x, y + 0.3, z] as Vec3 }
}

function criarPainel(leitura: string, zerado: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024; canvas.height = 800
  const c = canvas.getContext('2d')!
  const tinta = color.inbrat
  c.fillStyle = tinta.painel; c.fillRect(0, 0, 1024, 800)
  function ret(x: number, y: number, w: number, h: number, cor: string, r = 16) {
    c.fillStyle = cor; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill()
  }
  function texto(t: string, x: number, y: number, tam: number, cor: string = tinta.tecla) {
    c.fillStyle = cor; c.font = `600 ${tam}px Arial`; c.fillText(t, x, y)
  }
  // Duas ilhas à esquerda: potencial P e corrente C, conforme a referência.
  ret(24, 20, 290, 354, tinta.borracha)
  ret(24, 419, 290, 354, tinta.borracha)
  for (const [nome, y, cor] of [['P1', 110, tinta.borracha], ['C1', 275, tinta.maleta], ['P2', 505, tinta.borracha], ['C2', 670, tinta.maleta]] as const) {
    ret(40, y - 65, 112, 124, cor)
    texto(nome, 69, y - 22, 24)
    c.strokeStyle = tinta.tecla; c.lineWidth = 2; c.beginPath(); c.arc(96, y + 12, 25, 0, Math.PI * 2); c.stroke()
  }
  ret(342, 20, 654, 367, tinta.borracha)
  ret(407, 56, 518, 287, tinta.tela, 3)
  texto('inbrat', 423, 89, 26, tinta.tinta)
  texto('CONTINUIDADE', 660, 89, 18, tinta.tinta)
  texto(leitura, 447, 228, 65, tinta.tinta)
  texto('Ω', 851, 228, 35, tinta.tinta)
  texto(zerado ? 'Pronto para medir' : 'Preparar ensaio', 438, 303, 22, tinta.tinta)
  ret(352, 408, 320, 46, tinta.maleta, 5)
  texto('INMD1 PRO', 372, 440, 27)
  texto('SIMULAÇÃO DIDÁTICA', 350, 785, 18)
  ret(775, 421, 190, 156, tinta.borracha, 10)
  texto('AC', 836, 517, 24)
  const teclas = [[478, 550, '▲'], [423, 611, '◀'], [478, 611, 'OK'], [533, 611, '▶'], [478, 672, '▼'], [659, 569, 'ESC'], [659, 631, '↯'], [659, 693, '⌂']] as const
  for (const [x, y, t] of teclas) { ret(x, y, 46, 46, tinta.tecla, 7); texto(t, x + 7, y + 30, 19, tinta.tinta) }
  ret(822, 647, 84, 80, tinta.borracha, 5); texto('USB', 831, 694, 20)
  c.fillStyle = tinta.ligar; c.beginPath(); c.arc(766, 690, 28, 0, Math.PI * 2); c.fill()
  texto('⏻', 748, 703, 33)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
  return tex
}

function CaboKelvin({ pontos, cor, baixo, raio = 0.006 }: { pontos: Vec3[]; cor: string; baixo: boolean; raio?: number }) {
  const geometria = useMemo(() => new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pontos.map(p => new THREE.Vector3(...p)), false, 'centripetal'),
    baixo ? 32 : 64, raio, baixo ? 4 : 6, false,
  ), [pontos, baixo, raio])
  useEffect(() => () => geometria.dispose(), [geometria])
  return <mesh geometry={geometria}><meshStandardMaterial color={cor} roughness={0.7} /></mesh>
}

/** Garra jacaré: o ponto local zero é a mordida no cobre, nunca o centro do cabo. */
function GarraKelvin({ alvo, origem, cor, baixo }: { alvo: Vec3; origem: Vec3; cor: string; baixo: boolean }) {
  const orientacao = useMemo(() => {
    const direcao = new THREE.Vector3(...origem).sub(new THREE.Vector3(...alvo)).normalize()
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direcao)
  }, [alvo, origem])
  return <group position={alvo} quaternion={orientacao}>
    {/* Duas mandíbulas se fecham no contato; cabos entram atrás dos punhos. */}
    {[-1, 1].map(lado => <group key={lado} rotation={[-lado * 0.14, 0, 0]}>
      <mesh position={[0, lado * 0.012, 0.072]} castShadow>
        <boxGeometry args={[0.052, 0.014, 0.15]} />
        <meshStandardMaterial color={color.spda.aluminio} metalness={0.8} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.068, 0.036, 0.15]} radius={0.01} smoothness={baixo ? 1 : 3} position={[0, lado * 0.02, 0.195]} castShadow>
        <meshStandardMaterial color={cor} roughness={0.65} />
      </RoundedBox>
      {!baixo && [0.022, 0.04, 0.058, 0.076].map(z => <mesh key={z} position={[0, lado * 0.003, z]}>
        <boxGeometry args={[0.049, 0.009, 0.006]} />
        <meshStandardMaterial color={color.spda.aluminio} metalness={0.8} roughness={0.35} />
      </mesh>)}
    </group>)}
    <mesh position={[0, 0, 0.125]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.022, 0.022, 0.079, 12]} />
      <meshStandardMaterial color={color.spda.aluminio} metalness={0.75} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.013, 0.016, 0.055, 10]} />
      <meshStandardMaterial color={cor} roughness={0.7} />
    </mesh>
    {/* As duas vias saem da mesma capa PP e entram na mesma garra. */}
    {[-1, 1].map(lado => <CaboKelvin key={lado} baixo={baixo} raio={0.004}
      cor={lado < 0 ? color.inbrat.borracha : color.inbrat.maleta}
      pontos={[[0, 0, 0.275], [0, lado * 0.025, 0.24], [0, lado * 0.047, 0.195]]} />)}
  </group>
}

export function Inbrat() {
  const id = useSpda(s => s.pontoAtivo)
  const leitura = useSpda(s => s.medicoes[id])
  const zerado = useSpda(s => s.pontasZeradas)
  const passo = useSim(s => s.ensaio.steps[s.passoIndex]?.id)
  const pref = useSim(s => s.qualidadePref)
  const baixo = resolverQualidade(pref).tier === 'baixo'
  const ponto = getPontoSPDA(passo === 'spda-zerar' ? 'd1-d2-sup' : id)!
  const pos = posicaoInbrat(ponto)
  const painel = useMemo(() => criarPainel(leitura?.display ?? '— — —', zerado), [leitura?.display, zerado])
  useEffect(() => () => painel.dispose(), [painel])
  const cabos = useMemo(() => [ponto.posOrigem, ponto.pos].map((alvo, lado) => {
    const zBase = lado ? 0.0265 : -0.0629
    // Rotação de 180° em Y: os bornes e a saída lateral acompanham a maleta.
    const z = pos[2] - (zBase + 0.0373 / 2) * ESCALA_INBRAT
    // P1/C1 e P2/C2 permanecem separados nos bornes, mas cada par segue na mesma capa.
    const uniao: Vec3 = [pos[0] + 0.18 * ESCALA_INBRAT, pos[1] + 0.15 * ESCALA_INBRAT, z]
    const vias = [0, 1].map(tipo => {
      const zBorne = pos[2] - (zBase + tipo * 0.0373) * ESCALA_INBRAT
      return {
        pontos: [[pos[0] + 0.09425 * ESCALA_INBRAT, pos[1] + 0.139 * ESCALA_INBRAT, zBorne],
          [pos[0] + 0.14 * ESCALA_INBRAT, pos[1] + 0.16 * ESCALA_INBRAT, zBorne], uniao] as Vec3[],
        cor: tipo ? color.inbrat.maleta : color.inbrat.borracha,
      }
    })
    // Uma única garra por extremidade, alimentada pelas duas vias do respectivo PP.
    const direcao = ponto.nivel === 'bep' && lado === 1
      ? new THREE.Vector3(0, -0.5, -1).normalize()
      : new THREE.Vector3(Math.sign(alvo[0]), -0.5, Math.sign(alvo[2]) * 0.35).normalize()
    const traseira = new THREE.Vector3(...alvo).addScaledVector(direcao, 0.31).toArray() as Vec3
    const aproxima = new THREE.Vector3(...alvo).addScaledVector(direcao, 0.43).toArray() as Vec3
    // Os cabos saem pela lateral da maleta; pontos extras evitam a spline cruzar o visor.
    const piso: Vec3 = [pos[0] + 0.3 * ESCALA_INBRAT, pos[1] + 0.025, z]
    const rota: Vec3[] = [uniao, piso]
    if (ponto.nivel === 'bep') {
      if (lado === 0) rota.push([-3.5, 0.39, -2.5], [-3.7, 0.39, -3.7], [-3.7, 0.06, -5.5], [-7.5, 0.06, -5.5])
      else rota.push([-4.7, 0.39, -0.6])
    } else {
      // Percurso externo, inclusive nos pares cruzados: nunca atravessa o prédio.
      const cantos: Vec3[] = [[-7.5, 0.04, -5.5], [7.5, 0.04, -5.5], [7.5, 0.04, 5.5], [-7.5, 0.04, 5.5]]
      const indice = (p: Vec3) => p[2] < 0 ? (p[0] < 0 ? 0 : 1) : (p[0] < 0 ? 3 : 2)
      const a = indice(ponto.posOrigem), b = indice(alvo)
      rota.push(cantos[a])
      const sentido = (b - a + 4) % 4 <= 2 ? 1 : -1
      for (let atual = a; atual !== b;) { atual = (atual + sentido + 4) % 4; rota.push(cantos[atual]) }
    }
    return { pontos: [...rota, aproxima, traseira], vias, alvo, traseira, cor: lado ? color.inbrat.maleta : color.inbrat.borracha }
  }), [ponto, pos[0], pos[1], pos[2]])
  if (!['spda-zerar', 'spda-medir', 'spda-laudo'].includes(passo)) return null
  return <group>
    <group position={pos} rotation={[0, Math.PI, 0]} scale={ESCALA_INBRAT} onClick={e => { e.stopPropagation(); useView.getState().pedir('foco') }}>
      <RoundedBox args={[0.258, 0.12, 0.205]} radius={0.014} smoothness={baixo ? 1 : 3} position={[0, 0.06, 0]} castShadow>
        <meshStandardMaterial color={color.inbrat.maleta} roughness={0.65} />
      </RoundedBox>
      <RoundedBox args={[0.247, 0.017, 0.194]} radius={0.004} smoothness={baixo ? 1 : 3} position={[0, 0.12, 0]}>
        <meshStandardMaterial color={color.inbrat.borracha} roughness={0.85} />
      </RoundedBox>
      <mesh position={[0, 0.130, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.232, 0.181]} />
        <meshStandardMaterial map={painel} roughness={0.63} />
      </mesh>
      {[-0.0629, 0.0265].flatMap((z, i) => [0, 1].map(tipo => <mesh key={`${i}-${tipo}`} position={[-0.09425, 0.136, z + tipo * 0.0373]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.005, 0.002, 6, 12]} />
        <meshStandardMaterial color={tipo ? color.inbrat.maleta : color.inbrat.borracha} roughness={0.5} />
      </mesh>))}
      {[-1, 1].map(s => <RoundedBox key={s} args={[0.014, 0.024, 0.115]} radius={0.006} smoothness={baixo ? 1 : 3} position={[s * 0.119, 0.143, 0]}>
        <meshStandardMaterial color={color.inbrat.borracha} roughness={0.8} />
      </RoundedBox>)}
      {[-0.082, 0.082].map(x => <mesh key={x} position={[x, 0.079, 0.104]}>
        <boxGeometry args={[0.026, 0.044, 0.012]} />
        <meshStandardMaterial color={color.inbrat.borracha} roughness={0.65} />
      </mesh>)}
    </group>
    {passo === 'spda-medir' && cabos.map((c, i) => <group key={i}>
      {c.vias.map((via, j) => <CaboKelvin key={j} pontos={via.pontos} cor={via.cor} baixo={baixo} />)}
      <CaboKelvin pontos={c.pontos} cor={color.inbrat.borracha} baixo={baixo} raio={0.01} />
      <GarraKelvin alvo={c.alvo} origem={c.traseira} cor={c.cor} baixo={baixo} />
    </group>)}
    {passo === 'spda-medir' && <SpdaFluxo ponto={ponto} cabos={cabos} baixo={baixo} />}
  </group>
}

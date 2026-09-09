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

/** Referência visual: INMD1 PRO, foto INMD1-05 e dimensões publicadas pela Inbrat.
 * A leitura vem do ensaio didático existente; não emula firmware/faixas do aparelho.
 */
export function posicaoInbrat(ponto: PontoSPDA): Vec3 {
  if (ponto.id === 'capt-anel') return [5.4, 9.005, -3.3]
  if (ponto.id === 'eq-bep') return [-6.9, 0.01, 1.8]
  return [ponto.pos[0] + Math.sign(ponto.pos[0]) * 0.65, 0.01, ponto.pos[2] + Math.sign(ponto.pos[2]) * 0.65]
}

export function vistaInbrat(ponto: PontoSPDA) {
  const [x, y, z] = posicaoInbrat(ponto)
  return { pos: [x + 0.28, y + 0.65, z + 0.55] as Vec3, target: [x, y + 0.1, z] as Vec3 }
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

function CaboKelvin({ pontos, cor, baixo }: { pontos: Vec3[]; cor: string; baixo: boolean }) {
  const geometria = useMemo(() => new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pontos.map(p => new THREE.Vector3(...p)), false, 'centripetal'),
    baixo ? 32 : 64, 0.0025, baixo ? 4 : 6, false,
  ), [pontos, baixo])
  useEffect(() => () => geometria.dispose(), [geometria])
  return <mesh geometry={geometria}><meshStandardMaterial color={cor} roughness={0.7} /></mesh>
}

export function Inbrat() {
  const id = useSpda(s => s.pontoAtivo)
  const leitura = useSpda(s => s.medicoes[id])
  const zerado = useSpda(s => s.pontasZeradas)
  const passo = useSim(s => s.ensaio.steps[s.passoIndex]?.id)
  const pref = useSim(s => s.qualidadePref)
  const baixo = resolverQualidade(pref).tier === 'baixo'
  const ponto = getPontoSPDA(passo === 'spda-zerar' ? 'eq-bep' : id)!
  const pos = posicaoInbrat(ponto)
  const painel = useMemo(() => criarPainel(leitura?.display ?? '— — —', zerado), [leitura?.display, zerado])
  useEffect(() => () => painel.dispose(), [painel])
  const cabos = useMemo(() => [ponto.posOrigem, ponto.pos].flatMap((alvo, lado) => [0, 1].map(tipo => {
    const z = pos[2] + (lado ? 0.0265 : -0.0629) + tipo * 0.0373
    const origem: Vec3 = [pos[0] - 0.09425, pos[1] + 0.139, z]
    const elevada = alvo[1] > pos[1] + 1
    const intermediario: Vec3 = elevada
      ? [alvo[0] + Math.sign(alvo[0]) * (0.17 + tipo * 0.025), pos[1] + 0.18, alvo[2] + Math.sign(alvo[2]) * 0.17]
      : [(origem[0] + alvo[0]) / 2, pos[1] + 0.16, (origem[2] + alvo[2]) / 2 + tipo * 0.05]
    const aproxima: Vec3 = [alvo[0] + Math.sign(alvo[0]) * 0.06, alvo[1] + 0.035, alvo[2] + Math.sign(alvo[2]) * 0.06]
    // Os cabos saem pela lateral da maleta; pontos extras evitam a spline cruzar o visor.
    const saida: Vec3 = [pos[0] - 0.18, pos[1] + 0.15, z]
    const piso: Vec3 = [pos[0] - 0.3 - tipo * 0.025, pos[1] + 0.025, z]
    const rota: Vec3[] = [origem, saida, piso, intermediario]
    if (elevada) rota.push([intermediario[0], alvo[1] - 0.18, intermediario[2]])
    return { pontos: [...rota, aproxima, alvo], cor: tipo ? color.inbrat.maleta : color.inbrat.borracha }
  })), [ponto, pos[0], pos[1], pos[2]])
  if (!['spda-zerar', 'spda-medir', 'spda-laudo'].includes(passo)) return null
  return <group>
    <group position={pos} onClick={e => { e.stopPropagation(); useView.getState().pedir('foco') }}>
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
    {passo === 'spda-medir' && cabos.map((c, i) => <CaboKelvin key={i} {...c} baixo={baixo} />)}
  </group>
}

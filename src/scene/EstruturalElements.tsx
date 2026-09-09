import { useEffect, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GALPAO, PILARES, contatoEstrutural, PARES_ESTRUTURAIS, BEP_ESTRUTURAL } from '../catalog/estruturalPontos'
import type { PontoSPDA } from '../catalog/spdaPontos'
import type { Vec3 } from '../catalog/types'
import { useEstrutural } from '../sim/estruturalStore'
import { useSim } from '../sim/store'
import { useView } from '../sim/viewStore'
import { color } from '../design/tokens'
import { resolverQualidade } from './quality'
import { Inbrat } from './Inbrat'

function Bloco({ pos, tamanho, cor, opacidade = 1 }: { pos: Vec3; tamanho: Vec3; cor: string; opacidade?: number }) {
  return <mesh position={pos} castShadow={opacidade === 1} receiveShadow>
    <boxGeometry args={tamanho} />
    <meshStandardMaterial color={cor} roughness={0.8} transparent={opacidade < 1} opacity={opacidade} depthWrite={opacidade === 1} />
  </mesh>
}
function Barra({ a, b, raio = 0.025, cor = color.spda.metal }: { a: Vec3; b: Vec3; raio?: number; cor?: string }) {
  const { meio, comprimento, orientacao } = useMemo(() => {
    const inicio = new THREE.Vector3(...a), fim = new THREE.Vector3(...b)
    const vetor = fim.clone().sub(inicio)
    return { meio: inicio.add(fim).multiplyScalar(0.5), comprimento: vetor.length(), orientacao: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vetor.normalize()) }
  }, [a, b])
  return <mesh position={meio} quaternion={orientacao}>
    <cylinderGeometry args={[raio, raio, comprimento, 6]} />
    <meshStandardMaterial color={cor} metalness={0.55} roughness={0.6} />
  </mesh>
}
function Etiqueta({ pos, texto }: { pos: Vec3; texto: string }) {
  return <Html position={pos} center occlude distanceFactor={12} style={{ pointerEvents: 'none' }}>
    <span style={{ display:'block', whiteSpace:'nowrap', background:color.surface, color:color.text, padding:'4px 8px', borderRadius:4, fontSize:12 }}>{texto}</span>
  </Html>
}

/** Armadura horizontal com barras longitudinais e estribos, na escala da estrutura. */
function ArmaduraViga({ a, b, baixo }: { a: Vec3; b: Vec3; baixo: boolean }) {
  const longitudinalZ = a[0] === b[0]
  const comprimento = Math.hypot(b[0] - a[0], b[2] - a[2])
  const n = Math.ceil(comprimento / (baixo ? 1.5 : 0.65))
  const ponto = (t: number, lateral: number, altura: number): Vec3 => [
    a[0] + (b[0] - a[0]) * t + (longitudinalZ ? lateral : 0), a[1] + altura,
    a[2] + (b[2] - a[2]) * t + (longitudinalZ ? 0 : lateral),
  ]
  return <group>
    {[-0.16, 0.16].flatMap(l => [-0.1, 0.1].map(h => <Barra key={`${l}-${h}`} a={ponto(0,l,h)} b={ponto(1,l,h)} raio={0.022} />))}
    {Array.from({ length:n + 1 }, (_, i) => <group key={i}>{[-1, 1].flatMap(s => [
      <Barra key={`h${s}`} a={ponto(i/n,-0.18,s*0.12)} b={ponto(i/n,0.18,s*0.12)} raio={0.009} />,
      <Barra key={`v${s}`} a={ponto(i/n,s*0.18,-0.12)} b={ponto(i/n,s*0.18,0.12)} raio={0.009} />,
    ])}</group>)}
  </group>
}

export function EstruturalElements() {
  const { fase, revelar, par, garras } = useEstrutural()
  const pref = useSim(s => s.qualidadePref)
  const baixo = resolverQualidade(pref).tier === 'baixo'
  const camera = useThree(s => s.camera)
  const controls = useThree(s => s.controls) as { target: THREE.Vector3; update: () => void } | null
  const invalidate = useThree(s => s.invalidate)
  const tamanho = useThree(s => s.size)
  const comando = useView(s => s.comando), nonce = useView(s => s.nonce)
  const ponto = useMemo(() => {
    const p = PARES_ESTRUTURAIS.find(p => p.id === par)!
    return { id: p.id, nome: p.nome, posOrigem: contatoEstrutural(p.a, p.vertical, fase),
      pos: p.b === 'BEP' ? BEP_ESTRUTURAL : contatoEstrutural(p.b, false, fase),
      de: p.a, ate: p.b, norma: 'ABNT NBR 5419-3:2026', subsistema: 'descida',
      comprimentoM: 0, material: 'aco-galvanizado', secaoMm2: 0, conexoes: 0,
    } as PontoSPDA
  }, [par, fase])
  const instrumento = useMemo(() => {
    const origem = ponto.posOrigem
    const pos: Vec3 = [origem[0] + (origem[0] < 0 ? 1.5 : -1.5), 0.14, origem[2] + 1.5]
    return { ponto, pos, conectado: garras,
      rotas: [ponto.posOrigem, ponto.pos].map(alvo => [[pos[0], 0.18, pos[2] + 0.5], [alvo[0], 0.18, pos[2] + 0.5], [alvo[0], 0.18, alvo[2] + 0.8]] as Vec3[]) }
  }, [ponto, garras])
  const enquadrar = (tipo: string | null) => {
    if (!controls) return
    const alvo = tipo === 'origem' ? ponto.posOrigem : tipo === 'quadro' ? ponto.pos : tipo === 'foco' ? instrumento.pos : null
    if (alvo) {
      const sinal = alvo[0] < 0 ? 1 : -1
      camera.position.set(alvo[0] + sinal * 2.7, alvo[1] + 1.4, alvo[2] + 3)
      controls.target.set(...alvo)
    } else {
      camera.position.set(...(tipo === 'topo' ? [0.01, 40, 0.01] : tipo === 'frontal' ? [0, 8, 40] : tipo === 'lateral' ? [38, 9, 0] : [32, 23, 36]) as Vec3); controls.target.set(0, 3, 0)
    }
    controls.update(); invalidate()
  }
  useEffect(() => { enquadrar(null) }, [])
  useEffect(() => { if (comando) { enquadrar(comando); useView.getState().limpar() } }, [nonce])
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = tamanho.width < tamanho.height ? 65 : 42
      camera.updateProjectionMatrix(); invalidate()
    }
  }, [camera, tamanho.width, tamanho.height, invalidate])
  const mostrarAco = fase === 'obra' || revelar
  const concreto = fase === 'pronto'
  return <group>
    <Bloco pos={[0, 0.06, 0]} tamanho={[17.6, 0.12, 25.6]} cor={color.spda.concreto} opacidade={mostrarAco ? 0.16 : 1} />
    {PILARES.map(p => <group key={p.id}>
      {concreto && <Bloco pos={[p.x, GALPAO.altura / 2, p.z]} tamanho={[0.5, GALPAO.altura, 0.5]} cor={color.spda.concreto} opacidade={revelar ? 0.13 : 1} />}
      <Bloco pos={[p.x, 0.15, p.z]} tamanho={[1.3, 0.3, 1.3]} cor={color.spda.concreto} opacidade={mostrarAco ? 0.14 : 1} />
      {mostrarAco && <>
        {[-0.16, 0.16].flatMap(dx => [-0.16, 0.16].map(dz => <Barra key={`${dx}-${dz}`} a={[p.x + dx, 0.15, p.z + dz]} b={[p.x + dx, 7, p.z + dz]} />))}
        {/* Rebar de continuidade destacada; não confundir todos os cruzamentos com conexão elétrica. */}
        <Barra a={[p.x + (p.x < 0 ? 0.16 : -0.16), 0.15, p.z]} b={[p.x + (p.x < 0 ? 0.16 : -0.16), 7, p.z]} raio={0.03} cor={color.spda.aluminio} />
        {Array.from({ length: baixo ? 10 : 20 }, (_, i) => {
          const y = 0.35 + i * (baixo ? 0.66 : 0.33)
          return <group key={i}>{[-1, 1].flatMap(s => [
            <Barra key={`x${s}`} a={[p.x - 0.19, y, p.z + s * 0.19]} b={[p.x + 0.19, y, p.z + s * 0.19]} raio={0.012} />,
            <Barra key={`z${s}`} a={[p.x + s * 0.19, y, p.z - 0.19]} b={[p.x + s * 0.19, y, p.z + 0.19]} raio={0.012} />,
          ])}</group>
        })}
      </>}
      {[false, true].map(superior => {
        const alvo = contatoEstrutural(p.id, superior, fase)
        const y = alvo[1], sentido = p.x < 0 ? 1 : -1
        return <group key={String(superior)}>
          {concreto && <>
            <mesh position={[p.x + sentido * 0.265, y, p.z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.085, 0.085, 0.03, 16]} />
              <meshStandardMaterial color={color.spda.cobre} metalness={0.7} roughness={0.35} />
            </mesh>
            <Barra a={[p.x + sentido * 0.16, y, p.z]} b={alvo} raio={0.015} cor={color.spda.aluminio} />
          </>}
        </group>
      })}
      <Etiqueta pos={[p.x, 7.5, p.z]} texto={p.id} />
    </group>)}
    {[-8, 8].map(x => <group key={x}>
      {concreto && <>
        <Bloco pos={[x, 6.9, 0]} tamanho={[0.5, 0.6, 24]} cor={color.spda.concreto} opacidade={revelar ? 0.13 : 1} />
        <Bloco pos={[x, 3.2, 0]} tamanho={[0.13, 5.8, 24]} cor={color.spda.aluminio} opacidade={revelar ? 0.045 : 1} />
      </>}
      {mostrarAco && [0.2, 6.8].map(y => <ArmaduraViga key={y} a={[x, y, -12]} b={[x, y, 12]} baixo={baixo} />)}
    </group>)}
    {[-12, -4, 4, 12].map(z => <group key={z}>
      {mostrarAco && [0.2, 6.8].map(y => <ArmaduraViga key={y} a={[-8, y, z]} b={[8, y, z]} baixo={baixo} />)}
      {concreto && <>
        <Barra a={[-8, 7, z]} b={[0, 9, z]} raio={0.09} />
        <Barra a={[0, 9, z]} b={[8, 7, z]} raio={0.09} />
        <Barra a={[-8, 7, z]} b={[8, 7, z]} raio={0.07} />
        {[-6, -3, 0, 3, 6].map(x => <Barra key={x} a={[x, 7, z]} b={[x, 9 - Math.abs(x) / 4, z]} raio={0.04} />)}
      </>}
    </group>)}
    {concreto && <>
      {[-1, 1].map(s => <group key={s} position={[s * 4, 8, 0]} rotation={[0, 0, -s * Math.atan(0.25)]}>
        <Bloco pos={[0, 0, 0]} tamanho={[8.65, 0.12, 25]} cor={color.spda.cobertura} opacidade={revelar ? 0.055 : 1} />
        {!revelar && Array.from({ length: baixo ? 20 : 50 }, (_, i) => <Bloco key={i} pos={[0, 0.08, -12.25 + i * (baixo ? 1.25 : 0.5)]} tamanho={[8.65, 0.035, 0.04]} cor={color.spda.aluminio} />)}
      </group>)}
      <Bloco pos={[0, 4, -12.15]} tamanho={[16, 6, 0.15]} cor={color.spda.aluminio} opacidade={revelar ? 0.045 : 1} />
      {[-6.2, 6.2].map(x => <Bloco key={x} pos={[x, 3.5, 12.15]} tamanho={[3.6, 7, 0.15]} cor={color.spda.aluminio} opacidade={revelar ? 0.045 : 1} />)}
      <Bloco pos={[0, 6.3, 12.15]} tamanho={[8.8, 1.4, 0.15]} cor={color.spda.aluminio} opacidade={revelar ? 0.045 : 1} />
    </>}
    {/* QGBT e BEP dentro do galpão, junto ao corredor lateral. */}
    <Bloco pos={[6.8, 1.3, -10.3]} tamanho={[1.1, 2.3, 0.5]} cor={color.spda.metal} />
    <Bloco pos={[6.8, 1.3, -10.02]} tamanho={[1, 2.1, 0.04]} cor={color.spda.aluminio} />
    <Bloco pos={[6.8, 1.8, -9.98]} tamanho={[0.4, 0.25, 0.03]} cor={color.spda.vidro} />
    <Bloco pos={[5.5, 1.2, -10.09]} tamanho={[1, 0.5, 0.12]} cor={color.spda.metal} />
    <Bloco pos={[5.5, 1.2, -10.015]} tamanho={[0.85, 0.1, 0.03]} cor={color.spda.cobre} />
    <Barra a={[7.6, 1.2, -12]} b={[7.6, 0.2, -12]} cor={color.spda.cobre} />
    <Barra a={[7.6, 0.2, -12]} b={[5.5, 0.2, -12]} cor={color.spda.cobre} />
    <Barra a={[5.5, 0.2, -12]} b={[5.5, 0.2, -10]} cor={color.spda.cobre} />
    <Barra a={[5.5, 0.2, -10]} b={BEP_ESTRUTURAL} cor={color.spda.cobre} />
    <Etiqueta pos={[6.8, 2.7, -10]} texto="QGBT" /><Etiqueta pos={[5.5, 1.7, -10]} texto="BEP" />
    {[ponto.posOrigem, ponto.pos].map((p, i) => <Html key={i} position={[p[0], p[1] + 0.35, p[2] + 0.2]} center>
      <button onClick={() => useView.getState().pedir(i ? 'quadro' : 'origem')} style={{ background:color.surface, color:i ? color.accentCool : color.accent, border:`1px solid ${color.hairline}`, borderRadius:5, padding:'4px 8px', whiteSpace:'nowrap', fontSize:12 }}>
        {i ? 'P2/C2' : 'P1/C1'} · {fase === 'obra' ? 'ferragem' : 'contato'}
      </button>
    </Html>)}
    <Inbrat externo={instrumento} />
  </group>
}

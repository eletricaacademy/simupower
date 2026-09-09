import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../sim/store'
import { useSpda } from '../sim/spdaStore'
import { percursosCorrenteSPDA } from '../catalog/spdaFluxo'
import type { PontoSPDA } from '../catalog/spdaPontos'
import type { Vec3 } from '../catalog/types'
import { color } from '../design/tokens'

type Cabo = { pontos: Vec3[]; vias: { pontos: Vec3[] }[]; alvo: Vec3 }
const suave = (pontos: Vec3[]) => new THREE.CatmullRomCurve3(pontos.map(p => new THREE.Vector3(...p)), false, 'centripetal')

/** Sobreposição didática sem bloom: setas indicam sentido, não velocidade/magnitude real. */
function SetasCorrente({ curva, cor, baixo, reverso = false }: { curva: THREE.Curve<THREE.Vector3>; cor: string; baixo: boolean; reverso?: boolean }) {
  const setas = useRef<THREE.InstancedMesh>(null)
  const reduzido = useSim(s => s.reducedMotion)
  const invalidate = useThree(s => s.invalidate)
  const comprimento = useMemo(() => curva.getLength(), [curva])
  const quantidade = Math.min(baixo ? 12 : 24, Math.max(1, Math.ceil(comprimento / 2)))
  const linha = useMemo(() => new THREE.TubeGeometry(curva, Math.max(12, Math.ceil(comprimento * 8)), 0.018, baixo ? 4 : 6, false), [curva, comprimento, baixo])
  const objeto = useMemo(() => new THREE.Object3D(), [])
  const eixo = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  useEffect(() => () => linha.dispose(), [linha])
  useFrame(({ clock }) => {
    if (!setas.current) return
    for (let i = 0; i < quantidade; i++) {
      const t = (i / quantidade + (reduzido ? 0.15 : clock.elapsedTime * 2 / Math.max(comprimento, 1))) % 1
      const u = reverso ? 1 - t : t
      objeto.position.copy(curva.getPointAt(u))
      objeto.quaternion.setFromUnitVectors(eixo, curva.getTangentAt(u).normalize().multiplyScalar(reverso ? -1 : 1))
      objeto.updateMatrix(); setas.current.setMatrixAt(i, objeto.matrix)
    }
    setas.current.instanceMatrix.needsUpdate = true
    if (!reduzido) invalidate()
  })
  return <group>
    <mesh geometry={linha} renderOrder={30}>
      <meshBasicMaterial color={cor} transparent opacity={0.45} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
    <instancedMesh ref={setas} args={[undefined, undefined, quantidade]} frustumCulled={false} renderOrder={31}>
      <coneGeometry args={[0.085, 0.26, baixo ? 4 : 8]} />
      <meshBasicMaterial color={cor} depthTest={false} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  </group>
}

export function SpdaFluxo({ ponto, cabos, baixo }: { ponto: PontoSPDA; cabos: Cabo[]; baixo: boolean }) {
  const ativo = useSpda(s => s.fluxoAtivo)
  const leitura = useSpda(s => s.medicoes[ponto.id])
  const curvas = useMemo(() => {
    const fios = cabos.map(c => {
      const caminho = new THREE.CurvePath<THREE.Vector3>()
      // Corrente entra por C1 e retorna por C2. P1/P2 são somente leitura de tensão.
      caminho.add(suave(c.vias[1].pontos)); caminho.add(suave(c.pontos))
      caminho.add(new THREE.LineCurve3(new THREE.Vector3(...c.pontos[c.pontos.length - 1]), new THREE.Vector3(...c.alvo)))
      return caminho
    })
    const instalacao = percursosCorrenteSPDA(ponto).map(pontos => {
      const caminho = new THREE.CurvePath<THREE.Vector3>()
      for (let i = 1; i < pontos.length; i++) caminho.add(new THREE.LineCurve3(new THREE.Vector3(...pontos[i - 1]), new THREE.Vector3(...pontos[i])))
      return caminho
    })
    return { fios, instalacao }
  }, [ponto, cabos])
  if (!ativo || !leitura || !Number.isFinite(leitura.r)) return null
  return <group>
    <SetasCorrente curva={curvas.fios[0]} cor={color.accent} baixo={baixo} />
    {curvas.instalacao.map((curva, i) => <SetasCorrente key={i} curva={curva} cor={color.accent} baixo={baixo} />)}
    <SetasCorrente curva={curvas.fios[1]} cor={color.accentCool} baixo={baixo} reverso />
  </group>
}

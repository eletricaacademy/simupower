import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useView } from '../sim/viewStore'
import { useSim } from '../sim/store'

/**
 * ViewCommands — executa os comandos de vista (reset/topo/frontal/lateral)
 * movendo a câmera para presets calculados a partir do alvo e da distância
 * padrão, com lerp suave. Roda dentro do Canvas. Os destinos são limitados à
 * caixa da sala para a câmera nunca sair.
 */
export function ViewCommands({
  defaultPos,
  defaultTarget,
  half,
  height,
}: {
  defaultPos: [number, number, number]
  defaultTarget: [number, number, number]
  half: number
  height: number
}) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null
  const invalidate = useThree((s) => s.invalidate)
  const comando = useView((s) => s.comando)
  const nonce = useView((s) => s.nonce)
  const limpar = useView((s) => s.limpar)
  const marcarInteragiu = useSim((s) => s.marcarInteragiu)

  const anim = useRef<{
    fromP: THREE.Vector3
    toP: THREE.Vector3
    fromT: THREE.Vector3
    toT: THREE.Vector3
    t: number
  } | null>(null)

  useEffect(() => {
    if (!comando || !controls) return
    const m = 0.8
    const clampBox = (v: THREE.Vector3) => {
      v.x = THREE.MathUtils.clamp(v.x, -half + m, half - m)
      v.z = THREE.MathUtils.clamp(v.z, -half + m, half - m)
      v.y = THREE.MathUtils.clamp(v.y, 0.7, height - 0.4)
      return v
    }

    const alvo = new THREE.Vector3(...defaultTarget)
    const padrao = new THREE.Vector3(...defaultPos)
    const R = padrao.distanceTo(alvo)
    let toP: THREE.Vector3

    if (comando === 'reset') {
      toP = padrao.clone()
    } else if (comando === 'frontal') {
      toP = alvo.clone().add(new THREE.Vector3(0, R * 0.22, R))
    } else if (comando === 'lateral') {
      toP = alvo.clone().add(new THREE.Vector3(R, R * 0.22, 0.001))
    } else {
      const up = Math.min(R, height - alvo.y - 0.5)
      toP = alvo.clone().add(new THREE.Vector3(0.001, up, 0.001))
    }
    if (comando !== 'reset') clampBox(toP)

    anim.current = { fromP: camera.position.clone(), toP, fromT: controls.target.clone(), toT: alvo, t: 0 }
    marcarInteragiu()
    limpar()

    // mantém o loop vivo durante a animação (inclusive em modo demand)
    let raf = 0
    const tick = () => {
      if (anim.current) {
        invalidate()
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce])

  useFrame((_, dt) => {
    const a = anim.current
    if (!a || !controls) return
    a.t = Math.min(1, a.t + dt / 0.5)
    const k = 1 - Math.pow(1 - a.t, 3)
    camera.position.lerpVectors(a.fromP, a.toP, k)
    controls.target.lerpVectors(a.fromT, a.toT, k)
    controls.update()
    if (a.t >= 1) anim.current = null
  })

  return null
}

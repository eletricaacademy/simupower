import { expect, it } from 'vitest'
import * as THREE from 'three'
import { BEP_SKID, SKID } from '../catalog/usinaFvPontos'
import { CurvaCaboPP } from './curvaCaboPP'
import { DIRECAO_GARRA_BEP_FV, ROTA_CABO_BEP_FV } from './usinaFvInstrumento'
import type { Vec3 } from '../catalog/types'

it('mantém cabo e garra do BEP fora da laje do skid', () => {
  const alvo = new THREE.Vector3(...BEP_SKID)
  const direcao = new THREE.Vector3(...DIRECAO_GARRA_BEP_FV)
  const aproxima = alvo.clone().addScaledVector(direcao, .43).toArray() as Vec3
  const traseira = alvo.clone().addScaledVector(direcao, .31).toArray() as Vec3
  const curva = new CurvaCaboPP([...ROTA_CABO_BEP_FV, aproxima, traseira])
  const frenteLaje = SKID.centro[2] - (SKID.dimensoes[2] + .6) / 2
  for (let i = 0; i <= 300; i++) {
    const v = curva.getPoint(i / 300)
    expect(v.z < frenteLaje - .01 || v.y > .41).toBe(true)
  }
  // A garra fica horizontal acima da plataforma, mordendo o barramento existente.
  expect(traseira[1]).toBe(BEP_SKID[1])
  expect(traseira[2]).toBeLessThan(frenteLaje)
})

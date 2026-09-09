import { expect, it } from 'vitest'
import { TubeGeometry, Vector3 } from 'three'
import { CurvaCaboPP } from './curvaCaboPP'
import type { Vec3 } from '../catalog/types'

it('mantém a capa PP acima do chão mesmo antes de uma subida longa até a cobertura', () => {
  const pontos:Vec3[]=[[0,0.45,0],[0.3,0.04,0],[8,0.04,0],[8,0.04,12],[8,6.6,12.2]]
  const curva=new CurvaCaboPP(pontos)
  for(let i=0;i<=2000;i++) expect(curva.getPoint(i/2000).y).toBeGreaterThanOrEqual(0.04)
  const tubo=new TubeGeometry(curva,128,0.01,6,false)
  tubo.computeBoundingBox()
  expect(tubo.boundingBox!.min.y).toBeGreaterThan(0.029)
  expect(curva.getPoint(0)).toEqual(new Vector3(...pontos[0]))
  expect(curva.getPoint(1).distanceTo(new Vector3(...pontos[pontos.length-1]))).toBeLessThan(1e-10)
  tubo.dispose()
})
it('preserva o patamar interno da sala sem afundar entre dois apoios na mesma cota', () => {
  const curva=new CurvaCaboPP([[0,0.06,0],[0,0.39,1],[0,0.39,4],[0,1.2,5]])
  for(let i=0;i<=100;i++) expect(curva.getPoint(1/3+i/300).y).toBeCloseTo(0.39)
})

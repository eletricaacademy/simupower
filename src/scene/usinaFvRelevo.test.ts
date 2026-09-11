import { describe, expect, it } from 'vitest'
import { amostrarGrade, subdividirGrade, equipotenciais } from './usinaFvRelevo'
describe('Representação gráfica da grade de potenciais', () => {
  const m = { nx: 2, nz: 2, x0: 10, z0: 20, passo: 2, rel: [0, 1, 0, 1] }
  it('interpola em coordenadas reais sem alterar amostras ou extrapolar', () => {
    expect(amostrarGrade(m,11,21)).toBe(.5)
    expect(amostrarGrade(m,30,21)).toBe(1)
    expect(Array.from(subdividirGrade(m,2).rel)).toEqual([0,.5,1,0,.5,1,0,.5,1])
  })
  it('isolinhas seguem níveis, posições e exagero vertical conhecidos', () => {
    const { vertices, rotulos } = equipotenciais(m)
    expect(vertices.length).toBe(9*6)
    for(let i=0;i<9;i++) {
      expect(vertices[i*6]).toBeCloseTo(10+2*(i+1)/10)
      expect(vertices[i*6+1]).toBeCloseTo(12*(i+1)/10+.035)
      expect(Math.abs(vertices[i*6+2]-vertices[i*6+5])).toBe(2)
    }
    expect(rotulos.map(r=>r.nivel)).toEqual([.2,.4,.6,.8])
  })
  it('não inventa curvas em platô constante e preserva os dois ramos em sela', () => {
    expect(equipotenciais({...m,rel:[1,1,1,1]}).vertices.length).toBe(0)
    expect(equipotenciais({...m,rel:[0,1,1,0]}).vertices.length).toBe(9*12)
  })
})

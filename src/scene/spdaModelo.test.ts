import { beforeAll, describe, expect, it } from 'vitest'
import { NodeIO, type Document } from '@gltf-transform/core'
import { Box3, Matrix4, Triangle, Vector3 } from 'three'
import { SPDA_PONTOS } from '../catalog/spdaPontos'
import { spdaPredio } from '../catalog/equipment/spdaPredio'

describe('Contrato geométrico do GLB do SPDA', () => {
  let documento: Document
  let limites: Box3
  const triangulos: Triangle[] = []
  beforeAll(async () => {
    documento = await new NodeIO().read('public/models/spda-predio.glb')
    limites = new Box3()
    for (const no of documento.getRoot().listNodes()) {
      const matriz = new Matrix4().fromArray(no.getWorldMatrix())
      for (const primitiva of no.getMesh()?.listPrimitives() ?? []) {
        const posicoes = primitiva.getAttribute('POSITION')!
        const vertices: Vector3[] = []
        for (let i = 0; i < posicoes.getCount(); i++) {
          const v = new Vector3().fromArray(posicoes.getElement(i, [])).applyMatrix4(matriz)
          limites.expandByPoint(v)
          vertices.push(v)
        }
        if (primitiva.getMaterial()?.getName() !== 'SPDA_cobre') continue
        const indices = primitiva.getIndices()!
        for (let i = 0; i < indices.getCount(); i += 3) {
          triangulos.push(new Triangle(vertices[indices.getScalar(i)], vertices[indices.getScalar(i + 1)], vertices[indices.getScalar(i + 2)]))
        }
      }
    }
  })

  it('preserva metros, centro e base esperados pelo carregador', () => {
    expect(limites.min.y).toBeCloseTo(0, 5)
    const centro = limites.getCenter(new Vector3())
    expect(centro.x).toBeCloseTo(0, 5)
    expect(centro.z).toBeCloseTo(0, 5)
    expect(limites.getSize(new Vector3()).x).toBeCloseTo(spdaPredio.escalaAlvo, 5)
    expect(limites.max.y).toBeCloseTo(10.05, 4)
  })

  it('mantém os seis contatos e suas referências sobre o cobre após otimização', () => {
    const proximo = new Vector3()
    for (const ponto of SPDA_PONTOS) for (const coordenada of [ponto.pos, ponto.posOrigem]) {
      const alvo = new Vector3(...coordenada)
      const distancia = Math.min(...triangulos.map(t => t.closestPointToPoint(alvo, proximo).distanceTo(alvo)))
      // O pick do HUD arredonda a centímetros; a geometria mantém a precisão original.
      expect(distancia, ponto.id).toBeLessThan(0.03)
    }
  })

  it('usa sete malhas, texturas locais e nenhum codec externo', () => {
    expect(documento.getRoot().listMeshes()).toHaveLength(7)
    expect(documento.getRoot().listExtensionsRequired()).toHaveLength(0)
    expect(documento.getRoot().listTextures()).toHaveLength(3)
    for (const textura of documento.getRoot().listTextures()) expect(textura.getSize()).toEqual([512, 512])
  })
})

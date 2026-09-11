import { beforeAll, describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Box3, Group, InstancedMesh, Matrix4, Vector3 } from 'three'
import { instanciarUsina } from './UsinaFvModelo'
import { MESAS_FV, MESA, MODULO, pilarMesa, PILARES_POR_FILA, USINA } from '../catalog/usinaFvPontos'

describe('Contrato do kit e da usina FV em metros', () => {
  let cena: Group, kit: Group
  beforeAll(async () => {
    async function ler(nome: string) {
      const b = await readFile(`public/models/${nome}.glb`)
      expect(b.byteLength).toBeLessThan(8_000_000)
      return (await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer, '')).scene
    }
    cena = await ler('usina-fv'); kit = await ler('usina-fv-kit')
  })
  it('mantém as onze peças independentes com pivô, rotação e escala limpos', () => {
    expect(kit.children.map(o=>o.name)).toEqual(['kit_modulo','kit_mesa_estaca','kit_mesa_terca','kit_skid','kit_trafo','kit_cabine','kit_poste_mt','kit_cerca_mourao','kit_cerca_painel','kit_portao','kit_caixa_inspecao'])
    for (const p of kit.children) {
      expect(p.position.toArray()).toEqual([0,0,0])
      expect(p.scale.toArray()).toEqual([1,1,1])
      expect(p.quaternion.toArray()).toEqual([0,0,0,1])
      expect(new Box3().setFromObject(p).min.y).toBeGreaterThanOrEqual(-.00001)
    }
    const d = new Box3().setFromObject(kit.getObjectByName('kit_modulo')!).getSize(new Vector3())
    expect(d.x).toBeCloseTo(MODULO.largura,5); expect(d.z).toBeCloseTo(MODULO.comprimento,5)
  })
  it('preserva 540 módulos com inclinação norte e os 140 pilares sobre as linhas calculadas', () => {
    const modulos = cena.children.filter(o=>/^kit_modulo/.test(o.name))
    const pilares = cena.children.filter(o=>/^kit_mesa_estaca/.test(o.name))
    expect(modulos).toHaveLength(540); expect(pilares).toHaveLength(140)
    for (const m of modulos) {
      const normal = new Vector3(0,1,0).applyQuaternion(m.quaternion)
      expect(normal.z).toBeCloseTo(-Math.sin(USINA.inclinacaoGraus*Math.PI/180),5)
      const mesa = MESAS_FV.find(t=>Math.abs(t.centro[0]-m.position.x)<MESA.comprimento/2 && Math.abs(t.centro[2]-m.position.z)<MESA.profundidade/2)
      expect(mesa).toBeDefined()
    }
    for (const mesa of MESAS_FV) for(let i=0;i<PILARES_POR_FILA;i++) for(const s of [-1,1]) {
      const p=pilarMesa(mesa,i);p[2]=mesa.centro[2]+s*(p[2]-mesa.centro[2])
      expect(pilares.some(o=>o.position.distanceTo(new Vector3(...p))<.0001)).toBe(true)
    }
  })
  it('agrupa módulos em lotes de 540 sem mover vértices e remove detalhes no baixo', () => {
    const alto=instanciarUsina(cena,true), baixo=instanciarUsina(cena,false)
    const modulos=alto.children.filter(o=>o.name.startsWith('kit_modulo')) as InstancedMesh[]
    expect(modulos.length).toBeGreaterThan(0)
    expect(modulos.every(o=>o.count===540)).toBe(true)
    expect(baixo.children.length).toBeLessThan(alto.children.length)
    const matriz=new Matrix4();modulos[0].getMatrixAt(0,matriz)
    expect(new Vector3().setFromMatrixPosition(matriz).distanceTo(cena.children.find(o=>o.name.startsWith('kit_modulo'))!.position)).toBeLessThan(.00001)
    for(const g of [alto,baixo]) g.children.forEach(o=>(o as InstancedMesh).dispose())
  })
})

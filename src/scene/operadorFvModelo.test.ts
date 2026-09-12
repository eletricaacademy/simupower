import { readFileSync } from 'node:fs'
import { beforeAll, expect, it } from 'vitest'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { prepararOperadorFv, descartarOperadorFv } from './operadorFvModelo'

let fonte: THREE.Group
beforeAll(async () => {
  const b = readFileSync('public/models/colaborador.glb')
  fonte = (await new GLTFLoader().parseAsync(Uint8Array.from(b).buffer, '')).scene
})

it.each([false, true])('mantém cada perna no seu lado e ambas as botas paralelas (passo=%s)', passo => {
  const modelo = prepararOperadorFv(fonte, passo, passo ? undefined : new THREE.Vector3(0, 1.1, 1))
  for (const lado of [-1, 1]) {
    const perna = modelo.getObjectByName(`perna-${lado}`) as THREE.Mesh
    const p = perna.geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      // Inclui joelhos e coxas, não apenas a localização final das solas.
      expect(p.getX(i) * lado).toBeGreaterThan(0)
    }
    const sola = modelo.getObjectByName(`sola-${lado}`) as THREE.Mesh
    const caixa = new THREE.Box3().setFromObject(sola)
    expect(caixa.min.y).toBeCloseTo(0, 6)
    expect(caixa.getCenter(new THREE.Vector3()).x).toBeCloseTo(lado * (passo ? .5 : .12), 6)
  }
  for (const nome of ['bota', 'sola', 'cano']) {
    const a = (modelo.getObjectByName(`${nome}--1`) as THREE.Mesh).geometry.attributes.position
    const b = (modelo.getObjectByName(`${nome}-1`) as THREE.Mesh).geometry.attributes.position
    expect(a.count).toBe(b.count)
    for (let i = 0; i < a.count; i++) {
      expect(a.getY(i)).toBe(b.getY(i))
      expect(a.getZ(i)).toBe(b.getZ(i))
      expect(b.getX(i) - a.getX(i)).toBeCloseTo(passo ? 1 : .24, 6)
    }
  }
  descartarOperadorFv(modelo)
})

it('alternar toque e passo não acumula deformações nem troca os pés', () => {
  const primeiro = prepararOperadorFv(fonte, false, new THREE.Vector3(0, 1.1, 1))
  for (const passo of [true, false, true]) descartarOperadorFv(prepararOperadorFv(fonte, passo))
  const ultimo = prepararOperadorFv(fonte, false, new THREE.Vector3(0, 1.1, 1))
  primeiro.children.forEach((m, i) => {
    expect((ultimo.children[i] as THREE.Mesh).geometry.attributes.position.array).toEqual((m as THREE.Mesh).geometry.attributes.position.array)
  })
  descartarOperadorFv(primeiro); descartarOperadorFv(ultimo)
})

it('conserva altura, pés no piso e a geometria original quantizada', () => {
  const antes = new THREE.Box3().setFromObject(fonte)
  const modelo = prepararOperadorFv(fonte, false, new THREE.Vector3(0, 1.1, 1))
  const caixa = new THREE.Box3().setFromObject(modelo)
  expect(caixa.min.y).toBeCloseTo(0, 5)
  expect(caixa.max.y).toBeCloseTo(1.75, 5)
  expect(new THREE.Box3().setFromObject(fonte)).toEqual(antes)
  let distanciaMao = Infinity
  modelo.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return
    const p = o.geometry.attributes.position
    expect(p.array).toBeInstanceOf(Float32Array)
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i)
      expect(Number.isFinite(v.length())).toBe(true)
      if ((o.material as THREE.Material).name === 'DefaultMaterial') distanciaMao = Math.min(distanciaMao, v.distanceTo(new THREE.Vector3(0, 1.1, 1)))
    }
  })
  expect(distanciaMao).toBeLessThan(.00001)
  descartarOperadorFv(modelo)
})

it('posiciona o centro das solas a um metro no ensaio de passo', () => {
  const modelo = prepararOperadorFv(fonte, true)
  const pes = [new THREE.Box3(), new THREE.Box3()]
  modelo.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return
    const p = o.geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i)
      if (v.y < .08) pes[v.x < 0 ? 0 : 1].expandByPoint(v)
    }
  })
  const centros = pes.map(p => p.getCenter(new THREE.Vector3()))
  expect(centros[0].x).toBeCloseTo(-.5, 5)
  expect(centros[1].x).toBeCloseTo(.5, 5)
  expect(centros[0].z).toBeCloseTo(0, 5)
  expect(centros[1].z).toBeCloseTo(0, 5)
  descartarOperadorFv(modelo)
})

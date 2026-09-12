import * as THREE from 'three'
import { color } from '../design/tokens'

/** Recorta triângulos no quadril, sem esticar as pernas da pose escalonada do GLB. */
function recortarAcima(g: THREE.BufferGeometry, altura: number) {
  const p = g.attributes.position, indice = g.index
  const vertices: number[] = []
  for (let i = 0; i < (indice?.count ?? p.count); i += 3) {
    const entrada = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(p, indice ? indice.getX(i + j) : i + j))
    const poligono: THREE.Vector3[] = []
    entrada.forEach((a, j) => {
      const b = entrada[(j + 1) % 3]
      if (a.y >= altura) poligono.push(a)
      if ((a.y >= altura) !== (b.y >= altura)) poligono.push(a.clone().lerp(b, (altura - a.y) / (b.y - a.y)))
    })
    for (let j = 1; j < poligono.length - 1; j++) {
      for (const v of [poligono[0], poligono[j], poligono[j + 1]]) vertices.push(v.x, v.y, v.z)
    }
  }
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
}

function construirPernas(grupo: THREE.Group, partes: THREE.Mesh[], passo: boolean) {
  const material = (nome: string) => (partes.find(m => (m.material as THREE.Material).name === nome)!.material as THREE.MeshStandardMaterial).clone()
  const adicionar = (g: THREE.BufferGeometry, nome: string, acabamento: string) => {
    g.computeVertexNormals()
    const m = new THREE.Mesh(g, material(acabamento))
    m.name = nome; m.renderOrder = 24; m.castShadow = true
    grupo.add(m)
  }
  const quadril = new THREE.SphereGeometry(1, 24, 16)
  quadril.scale(.19, .14, .145); quadril.translate(0, .9, -.04)
  adicionar(quadril, 'quadril', '[Color I04]')
  for (const lado of [-1, 1]) {
    const pe = lado * (passo ? .5 : .12)
    // Cada perna conserva seu lado: quadril, joelho e tornozelo nunca trocam de eixo.
    const centros = [new THREE.Vector3(lado * .105, .91, -.04), new THREE.Vector3(lado * (passo ? .29 : .12), .53, -.025), new THREE.Vector3(pe, .18, -.04)]
    const curva = new THREE.CatmullRomCurve3(centros)
    const g = new THREE.TubeGeometry(curva, 20, 1, 16, false)
    const p = g.attributes.position
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, c = curva.getPointAt(t)
      const raio = THREE.MathUtils.lerp(.105, .065, t)
      for (let j = 0; j <= 16; j++) {
        const k = i * 17 + j, v = new THREE.Vector3().fromBufferAttribute(p, k)
        v.sub(c).multiplyScalar(raio).add(c); p.setXYZ(k, v.x, v.y, v.z)
      }
    }
    adicionar(g, `perna-${lado}`, '[Color I04]')
    const sola = new THREE.Shape()
    const w = .09, d = .16, r = .045
    sola.moveTo(-w + r, -d); sola.lineTo(w - r, -d)
    sola.quadraticCurveTo(w, -d, w, -d + r); sola.lineTo(w, d - r)
    sola.quadraticCurveTo(w, d, w - r, d); sola.lineTo(-w + r, d)
    sola.quadraticCurveTo(-w, d, -w, d - r); sola.lineTo(-w, -d + r)
    sola.quadraticCurveTo(-w, -d, -w + r, -d)
    const base = new THREE.ExtrudeGeometry(sola, { depth: .04, bevelEnabled: false, curveSegments: 6 })
    base.rotateX(-Math.PI / 2); base.translate(pe, 0, 0)
    adicionar(base, `sola-${lado}`, '*61')
    const bota = new THREE.SphereGeometry(1, 24, 16)
    bota.scale(.085, .075, .15); bota.translate(pe, .1, 0)
    adicionar(bota, `bota-${lado}`, '*61')
    const cano = new THREE.CylinderGeometry(.063, .073, .14, 16)
    cano.translate(pe, .17, -.045)
    adicionar(cano, `cano-${lado}`, '*61')
  }
}

/** Adaptação visual do GLB estático; o original do arco elétrico permanece intacto. */
export function prepararOperadorFv(cena: THREE.Group, passo: boolean, alvo?: THREE.Vector3) {
  cena.updateMatrixWorld(true)
  const caixa = new THREE.Box3().setFromObject(cena)
  const centro = caixa.getCenter(new THREE.Vector3())
  const escala = 1.75 / caixa.getSize(new THREE.Vector3()).y
  const normalizar = (v: THREE.Vector3) => v.set((v.x - centro.x) * escala, (v.y - caixa.min.y) * escala, (v.z - centro.z) * escala)
  const ponta = new THREE.Vector3(0, 0, -Infinity)
  const partes: THREE.Mesh[] = []
  cena.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return
    const g = o.geometry.clone()
    // O asset usa posições quantizadas: deformar esses inteiros perderia precisão.
    const origem = o.geometry.attributes.position
    const vertices = new Float32Array(origem.count * 3)
    for (let i = 0; i < origem.count; i++) vertices.set([origem.getX(i), origem.getY(i), origem.getZ(i)], i * 3)
    g.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    g.deleteAttribute('normal')
    g.applyMatrix4(o.matrixWorld)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const v = normalizar(new THREE.Vector3().fromBufferAttribute(p, i))
      p.setXYZ(i, v.x, v.y, v.z)
      // A luva é uma região separada da viseira no material original.
      if ((o.material as THREE.Material).name === 'DefaultMaterial' && v.y < 1.3 && v.z > ponta.z) ponta.copy(v)
    }
    const material = (o.material as THREE.MeshStandardMaterial).clone()
    if (material.name === '[Color I04]') material.color.set(color.usinaFv.roupa)
    // Mantém o operador legível sobre o relevo sem alterar materiais compartilhados.
    material.depthTest = true; material.depthWrite = true; material.transparent = true
    const m = new THREE.Mesh(g, material)
    m.renderOrder = 24; m.castShadow = true
    partes.push(m)
  })
  const inclinacao = (y: number) => alvo ? .22 * THREE.MathUtils.smoothstep(y, .8, 1.3) : 0
  const deltaMao = alvo?.clone().sub(ponta.clone().add(new THREE.Vector3(0, 0, inclinacao(ponta.y))))
  for (const m of partes) {
    const p = m.geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i), original = v.clone()
      v.z += inclinacao(original.y)
      if (deltaMao) v.addScaledVector(deltaMao, THREE.MathUtils.smoothstep(original.z, .12, .42) * (1 - THREE.MathUtils.smoothstep(original.y, 1.3, 1.42)))
      p.setXYZ(i, v.x, v.y, v.z)
    }
    p.needsUpdate = true
    const superior = recortarAcima(m.geometry, .88)
    m.geometry.dispose()
    m.geometry = superior
    m.geometry.computeVertexNormals(); m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere()
  }
  const grupo = new THREE.Group()
  grupo.add(...partes)
  construirPernas(grupo, partes, passo)
  return grupo
}

export function descartarOperadorFv(grupo: THREE.Group) {
  grupo.children.forEach(o => { const m = o as THREE.Mesh; m.geometry.dispose(); (m.material as THREE.Material).dispose() })
}

import * as THREE from 'three'
import { color } from '../design/tokens'

/** Adaptação visual do GLB estático; o original do arco elétrico permanece intacto. */
export function prepararOperadorFv(cena: THREE.Group, passo: boolean, alvo?: THREE.Vector3) {
  cena.updateMatrixWorld(true)
  const caixa = new THREE.Box3().setFromObject(cena)
  const centro = caixa.getCenter(new THREE.Vector3())
  const escala = 1.75 / caixa.getSize(new THREE.Vector3()).y
  const normalizar = (v: THREE.Vector3) => v.set((v.x - centro.x) * escala, (v.y - caixa.min.y) * escala, (v.z - centro.z) * escala)
  // No original, as pernas estão separadas principalmente em Z (um pé à frente).
  const lados = (v: THREE.Vector3) => v.z < -.1 ? 0 : 1
  const pes = [new THREE.Box3(), new THREE.Box3()]
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
      if (v.y < .08) pes[lados(v)].expandByPoint(v)
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
  const centrosPes = pes.map(p => p.getCenter(new THREE.Vector3()))
  const abertura = passo ? .5 : .12
  const deslocamentos = centrosPes.map((p, i) => new THREE.Vector3((i ? 1 : -1) * abertura - p.x, 0, -p.z))
  const inclinacao = (y: number) => alvo ? .22 * THREE.MathUtils.smoothstep(y, .8, 1.3) : 0
  const deltaMao = alvo?.clone().sub(ponta.clone().add(new THREE.Vector3(0, 0, inclinacao(ponta.y))))
  for (const m of partes) {
    const p = m.geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i), original = v.clone()
      const transicao = deslocamentos[0].clone().lerp(deslocamentos[1], THREE.MathUtils.smoothstep(v.z, -.22, .02))
      const deslocamento = deslocamentos[lados(v)].clone().lerp(transicao, THREE.MathUtils.smoothstep(v.y, .2, .45))
      v.addScaledVector(deslocamento, 1 - THREE.MathUtils.smoothstep(v.y, .2, .95))
      v.z += inclinacao(original.y)
      if (deltaMao) v.addScaledVector(deltaMao, THREE.MathUtils.smoothstep(original.z, .12, .42) * (1 - THREE.MathUtils.smoothstep(original.y, 1.3, 1.42)))
      p.setXYZ(i, v.x, v.y, v.z)
    }
    p.needsUpdate = true
    m.geometry.computeVertexNormals(); m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere()
  }
  const grupo = new THREE.Group()
  grupo.add(...partes)
  return grupo
}

export function descartarOperadorFv(grupo: THREE.Group) {
  grupo.children.forEach(o => { const m = o as THREE.Mesh; m.geometry.dispose(); (m.material as THREE.Material).dispose() })
}

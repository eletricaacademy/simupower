import * as THREE from 'three'
import type { Vec3 } from '../catalog/types'

/** Mantém as curvas horizontais suaves sem deixar a interpolação vertical
 * ultrapassar os apoios. Uma subida longa até a garra não pode puxar o trecho
 * anterior para baixo do solo. Cena e setas consomem exatamente esta curva.
 */
export class CurvaCaboPP extends THREE.CatmullRomCurve3 {
  constructor(pontos: Vec3[]) {
    super(pontos.map(p => new THREE.Vector3(...p)), false, 'centripetal')
  }
  override getPoint(t: number, alvo = new THREE.Vector3()) {
    const u = THREE.MathUtils.clamp(t, 0, 1)
    super.getPoint(u, alvo)
    const i = Math.min(this.points.length - 2, Math.floor(u * (this.points.length - 1)))
    const y0 = this.points[i].y, y1 = this.points[i + 1].y
    alvo.y = THREE.MathUtils.clamp(alvo.y, Math.min(y0, y1), Math.max(y0, y1))
    return alvo
  }
}

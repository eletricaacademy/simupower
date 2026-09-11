/** Operações exclusivamente gráficas sobre uma grade pronta de V/GPR. */
export interface GradeVisual { nx: number; nz: number; x0: number; z0: number; passo: number; rel: ArrayLike<number> }
export function amostrarGrade(m: GradeVisual, x: number, z: number) {
  const u = Math.max(0, Math.min(m.nx - 1, (x - m.x0) / m.passo))
  const v = Math.max(0, Math.min(m.nz - 1, (z - m.z0) / m.passo))
  const i = Math.min(m.nx - 2, Math.floor(u)), j = Math.min(m.nz - 2, Math.floor(v))
  const a = u - i, b = v - j, k = j * m.nx + i
  return (m.rel[k] * (1 - a) + m.rel[k + 1] * a) * (1 - b) + (m.rel[k + m.nx] * (1 - a) + m.rel[k + m.nx + 1] * a) * b
}
export function subdividirGrade(m: GradeVisual, fator: number): GradeVisual {
  const nx = (m.nx - 1) * fator + 1, nz = (m.nz - 1) * fator + 1, passo = m.passo / fator
  const rel = new Float32Array(nx * nz)
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) rel[j * nx + i] = amostrarGrade(m, m.x0 + i * passo, m.z0 + j * passo)
  return { ...m, nx, nz, passo, rel }
}
/** Marching squares, incluindo sela com decisão pelo interpolante bilinear. */
export function equipotenciais(m: GradeVisual, altura = 12) {
  const vertices: number[] = []
  const rotulos: { nivel: number; pos: [number, number, number] }[] = []
  for (let decimo = 1; decimo < 10; decimo++) {
    const nivel = decimo / 10
    const segmentos: number[][] = []
    for (let j = 0; j < m.nz - 1; j++) for (let i = 0; i < m.nx - 1; i++) {
      const k = j * m.nx + i, valores = [m.rel[k], m.rel[k + 1], m.rel[k + m.nx + 1], m.rel[k + m.nx]]
      const cantos = [[i,j],[i+1,j],[i+1,j+1],[i,j+1]]
      const cortes: number[][] = []
      for (let e = 0; e < 4; e++) {
        const f = (e + 1) % 4, a = valores[e], b = valores[f]
        if ((a >= nivel) === (b >= nivel)) continue
        const t = (nivel - a) / (b - a)
        cortes.push([m.x0 + (cantos[e][0] + t * (cantos[f][0] - cantos[e][0])) * m.passo, nivel * altura + .035, m.z0 + (cantos[e][1] + t * (cantos[f][1] - cantos[e][1])) * m.passo])
      }
      if (cortes.length === 4 && (valores[0]-nivel)*(valores[2]-nivel)-(valores[1]-nivel)*(valores[3]-nivel) < 0) cortes.push(cortes.shift()!)
      for (let c = 0; c + 1 < cortes.length; c += 2) segmentos.push([...cortes[c], ...cortes[c + 1]])
    }
    segmentos.forEach(s => vertices.push(...s))
    if (segmentos.length && decimo % 2 === 0) {
      // Uma etiqueta por nível, distante do miolo dos equipamentos.
      const s = segmentos.reduce((a,b) => a[2] > b[2] ? a : b)
      rotulos.push({ nivel, pos: [s[0], s[1] + .08, s[2]] })
    }
  }
  return { vertices: new Float32Array(vertices), rotulos }
}

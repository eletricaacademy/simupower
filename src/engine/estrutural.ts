/** Rede resistiva didática. Critérios: ABNT NBR 5419-3:2026, F.1.2.3.3 e F.4.4.
 * A solução nodal calcula todos os caminhos em paralelo, sem atribuir corrente
 * a um único trajeto arbitrário dentro de uma estrutura interligada.
 */
export interface RamoEstrutural { id: string; a: string; b: string; r: number }
export interface SolucaoEstrutural { r: number; correntes: Record<string, number> }
export function resolverEstrutura(ramos: RamoEstrutural[], origem: string, destino: string, corrente: number): SolucaoEstrutural {
  if (!(corrente >= 1 && corrente <= 5) || origem === destino || ramos.some(r => !Number.isFinite(r.r) || r.r <= 0)) throw new Error('Parâmetros de ensaio inválidos')
  const alcancados = new Set([origem])
  for (let mudou = true; mudou;) {
    mudou = false
    for (const r of ramos) if (alcancados.has(r.a) !== alcancados.has(r.b)) { alcancados.add(r.a); alcancados.add(r.b); mudou = true }
  }
  if (!alcancados.has(destino)) return { r: Infinity, correntes: {} }
  const nos = [...alcancados].filter(n => n !== destino)
  const indices = new Map(nos.map((n, i) => [n, i]))
  const matriz = nos.map(() => new Array(nos.length + 1).fill(0) as number[])
  matriz[indices.get(origem)!][nos.length] = corrente
  for (const ramo of ramos) {
    if (!alcancados.has(ramo.a)) continue
    const i = indices.get(ramo.a), j = indices.get(ramo.b), g = 1 / ramo.r
    if (i !== undefined) matriz[i][i] += g
    if (j !== undefined) matriz[j][j] += g
    if (i !== undefined && j !== undefined) { matriz[i][j] -= g; matriz[j][i] -= g }
  }
  for (let k = 0; k < nos.length; k++) {
    let pivo = k
    for (let i = k + 1; i < nos.length; i++) if (Math.abs(matriz[i][k]) > Math.abs(matriz[pivo][k])) pivo = i
    ;[matriz[k], matriz[pivo]] = [matriz[pivo], matriz[k]]
    const divisor = matriz[k][k]
    if (Math.abs(divisor) < 1e-12) throw new Error('Rede singular')
    for (let j = k; j <= nos.length; j++) matriz[k][j] /= divisor
    for (let i = 0; i < nos.length; i++) if (i !== k) {
      const fator = matriz[i][k]
      for (let j = k; j <= nos.length; j++) matriz[i][j] -= fator * matriz[k][j]
    }
  }
  const potencial = (n: string) => n === destino ? 0 : matriz[indices.get(n)!][nos.length]
  const correntes: Record<string, number> = {}
  for (const r of ramos) if (alcancados.has(r.a)) correntes[r.id] = (potencial(r.a) - potencial(r.b)) / r.r
  return { r: potencial(origem) / corrente, correntes }
}
export type VerificacaoEstrutural = 'primeira' | 'comprobatoria'
export function criterioEstrutural(tipo: VerificacaoEstrutural) {
  return tipo === 'primeira' ? { limite: 1, norma: 'ABNT NBR 5419-3:2026 · F.1.2.3.3' }
    : { limite: 0.2, norma: 'ABNT NBR 5419-3:2026 · F.4.4' }
}
export function avaliarEstrutural(r: number, tipo: VerificacaoEstrutural) {
  const criterio = criterioEstrutural(tipo)
  return { ...criterio, aprovado: Number.isFinite(r) && r >= 0 && r <= criterio.limite }
}

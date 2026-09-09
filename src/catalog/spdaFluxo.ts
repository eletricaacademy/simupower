import { CAIXAS_SPDA, type PontoSPDA } from './spdaPontos'
import type { Vec3 } from './types'

/** Contrato visual: linhas seguem o cobre; profundidade do anel enterrado é esquemática.
 * Não altera a resistência calculada, nem representa corrente de descarga atmosférica.
 */
export function percursosCorrenteSPDA(ponto: PontoSPDA): Vec3[][] {
  if (ponto.nivel === 'bep') return [[ponto.posOrigem,
    [-6.25, 0.56, -4.25], [-6.25, 0.4, -4.25], [-5.5, 0.4, -4.25],
    [-5.5, 0.4, 0.5], [-4.8, 0.4, 0.5], [-4.8, 1.2, 0.535], ponto.pos]]
  if (!ponto.ramos) return []
  const indice = (p: Vec3) => p[2] < 0 ? (p[0] < 0 ? 0 : 1) : (p[0] < 0 ? 3 : 2)
  const a = indice(ponto.posOrigem), b = indice(ponto.pos)
  const altura = ponto.nivel === 'superior' ? 9.35 : -0.35
  const no = (i: number): Vec3 => [CAIXAS_SPDA[i][0], altura, CAIXAS_SPDA[i][1]]
  const anel = (sentido: number) => {
    const pontos = [no(a)]
    for (let atual = a; atual !== b;) { atual = (atual + sentido + 4) % 4; pontos.push(no(atual)) }
    return pontos
  }
  // Entrada comum, dois ramos em paralelo e saída comum até a outra garra.
  return [
    [ponto.posOrigem, [CAIXAS_SPDA[a][0], ponto.posOrigem[1], CAIXAS_SPDA[a][1]], no(a)],
    anel(1), anel(-1),
    [no(b), [CAIXAS_SPDA[b][0], ponto.pos[1], CAIXAS_SPDA[b][1]], ponto.pos],
  ]
}

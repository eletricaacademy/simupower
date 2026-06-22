/**
 * inspection.ts — Engine pura da INSPEÇÃO de subestação: tabula os itens
 * verificados (conforme / não conforme / pendente) e devolve o veredito.
 * Sem React — testável em Node.
 */

export type StatusItem = 'pendente' | 'conforme' | 'nao-conforme'

export type VeredictoInspecao =
  | 'Em andamento'
  | 'Aprovado'
  | 'Aprovado com pendências'
  | 'Reprovado'

export interface ResultadoInspecao {
  conformes: number
  naoConformes: number
  pendentes: number
  total: number
  /** percentual de conformidade entre os itens já avaliados (0–100) */
  percentual: number
  veredito: VeredictoInspecao
  cor: 'pass' | 'marginal' | 'fail'
}

export function avaliarInspecao(itens: StatusItem[]): ResultadoInspecao {
  const total = itens.length
  const conformes = itens.filter((s) => s === 'conforme').length
  const naoConformes = itens.filter((s) => s === 'nao-conforme').length
  const pendentes = itens.filter((s) => s === 'pendente').length
  const avaliados = conformes + naoConformes
  const percentual = avaliados === 0 ? 0 : Math.round((conformes / avaliados) * 100)

  let veredito: VeredictoInspecao
  let cor: ResultadoInspecao['cor']
  if (pendentes > 0) {
    veredito = 'Em andamento'
    cor = 'marginal'
  } else if (naoConformes === 0) {
    veredito = 'Aprovado'
    cor = 'pass'
  } else if (naoConformes / total <= 0.25) {
    veredito = 'Aprovado com pendências'
    cor = 'marginal'
  } else {
    veredito = 'Reprovado'
    cor = 'fail'
  }

  return { conformes, naoConformes, pendentes, total, percentual, veredito, cor }
}

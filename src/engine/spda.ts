/**
 * spda.ts — Ensaio de CONTINUIDADE DO SPDA (Sistema de Proteção contra
 * Descargas Atmosféricas) — ABNT NBR 5419-3, inspeção e manutenção.
 *
 * A inspeção verifica se o percurso elétrico do subsistema de captação até os
 * eletrodos de aterramento está ÍNTEGRO: mede-se a resistência ôhmica de cada
 * trecho (captação → descida → caixa de inspeção → BEP) com um miliohmímetro /
 * terrômetro na função CONTINUIDADE (baixa resistência, corrente ≥ 200 mA).
 *
 * Física do ensaio:
 *   R_medida = R_condutor + Σ R_conexões (+ R_defeito) (+ R_pontas se não zerar)
 *   R_condutor = ρ · L / S     (ρ em Ω·mm²/m, L em m, S em mm²)
 *
 * Um condutor íntegro dá alguns MILIOHMS; o que domina a leitura são as
 * conexões. Emenda frouxa, corrosão ou condutor rompido elevam a leitura — é
 * exatamente isso que a inspeção procura.
 *
 * Função pura, sem dependências de React/cena — testável isoladamente.
 */
import type { PontoSPDA, MaterialCondutor, TipoDefeito } from '../catalog/spdaPontos'

/** Resistividade a 20 °C (Ω·mm²/m) — materiais aceitos pela NBR 5419-3. */
export const RESISTIVIDADE: Record<MaterialCondutor, number> = {
  'cobre-nu': 0.0172,
  aluminio: 0.0282,
  'aco-galvanizado': 0.14,
}

/** Resistência típica de uma conexão/emenda em bom estado (Ω). */
export const R_CONEXAO_BOA = 0.0008

/** Acréscimo de resistência por tipo de defeito (Ω). `rompido` = circuito aberto. */
export const R_DEFEITO: Record<TipoDefeito, number> = {
  'emenda-frouxa': 0.82,
  corrosao: 2.6,
  rompido: Infinity,
}

/**
 * Resistência das pontas de prova + cabos do instrumento (Ω). Se o operador não
 * zerar (compensar) as pontas, ela entra em TODAS as leituras — erro clássico
 * de campo, que reprova trechos bons.
 */
export const R_PONTAS = 0.128

/**
 * Limites de aceitação da continuidade (Ω).
 *
 * A NBR 5419-3 exige "continuidade elétrica" sem fixar um número único. O
 * critério abaixo foi CONFIRMADO PELO PABLO em 2026-09-08: conforme até 0,2 Ω
 * (limite exigente, coerente com a prática de inspeção de SPDA e com a
 * equipotencialização da NBR 5410). Entre 0,2 e 1,0 Ω a leitura não reprova de
 * imediato, mas denuncia conexão com resistência elevada — reapertar e remedir.
 */
export const LIMITE_CONFORME = 0.2
export const LIMITE_ATENCAO = 1.0

export type CorVeredito = 'pass' | 'marginal' | 'fail'

export interface VereditoContinuidade {
  veredito: string
  cor: CorVeredito
  aprovado: boolean
}

/** Resistência ôhmica teórica do condutor do trecho (Ω). */
export function resistenciaTeorica(
  comprimentoM: number,
  material: MaterialCondutor,
  secaoMm2: number,
): number {
  if (secaoMm2 <= 0) return 0
  return (RESISTIVIDADE[material] * comprimentoM) / secaoMm2
}

/** Veredito da leitura de continuidade pelos limites acima. */
export function avaliarContinuidade(r: number): VereditoContinuidade {
  if (!Number.isFinite(r))
    return { veredito: 'Descontinuidade — circuito aberto', cor: 'fail', aprovado: false }
  if (r <= LIMITE_CONFORME)
    return { veredito: 'Contínuo — conforme', cor: 'pass', aprovado: true }
  if (r <= LIMITE_ATENCAO)
    return {
      veredito: 'Atenção — conexão com resistência elevada',
      cor: 'marginal',
      aprovado: false,
    }
  return { veredito: 'Não conforme — continuidade comprometida', cor: 'fail', aprovado: false }
}

/** Dispersão determinística por ponto — a leitura não sai idêntica em todos. */
function ruido(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return (h / 1000 - 0.5) * 0.004 // ±2 mΩ
}

/** Formata a leitura como o visor do instrumento mostraria. */
export function formatarLeitura(r: number): string {
  if (!Number.isFinite(r)) return 'OL'
  if (r < 1) return r.toFixed(3)
  return r.toFixed(2)
}

export type CenarioSPDA = 'conforme' | 'com-defeitos'

export interface LeituraContinuidade {
  pontoId: string
  /** Resistência medida (Ω) — Infinity = circuito aberto (OL). */
  r: number
  /** Texto do visor ("0.006", "OL"). */
  display: string
  /** Resistência teórica só do condutor (referência didática). */
  rTeorica: number
  /** As pontas estavam compensadas no momento da medição? */
  pontasZeradas: boolean
  veredito: string
  cor: CorVeredito
  aprovado: boolean
}

/**
 * Simula a medição de continuidade de um trecho do SPDA.
 *
 * @param ponto         trecho medido (catálogo)
 * @param cenario       'conforme' = tudo íntegro · 'com-defeitos' = aplica o defeito do ponto
 * @param pontasZeradas se falso, soma a resistência das pontas de prova à leitura
 */
export function medirContinuidade(
  ponto: PontoSPDA,
  cenario: CenarioSPDA,
  pontasZeradas: boolean,
): LeituraContinuidade {
  // Anel fechado oferece dois caminhos em paralelo; descidas/terminais são comuns.
  const paralelo = (contatos: boolean) => {
    if (!ponto.ramos?.length) return 0
    const resistencias = ponto.ramos.map(r => resistenciaTeorica(r.comprimentoM, ponto.material, ponto.secaoMm2)
      + (contatos ? r.conexoes * R_CONEXAO_BOA : 0))
    if (resistencias.some(r => r === 0)) return 0
    return 1 / resistencias.reduce((soma, r) => soma + 1 / r, 0)
  }
  const rSerie = resistenciaTeorica(ponto.comprimentoM, ponto.material, ponto.secaoMm2)
  const rTeorica = rSerie + paralelo(false)
  const defeito = cenario === 'com-defeitos' ? ponto.defeito : undefined

  let r: number
  if (defeito === 'rompido') {
    r = Infinity
  } else {
    r = rSerie + paralelo(true) + ponto.conexoes * R_CONEXAO_BOA + ruido(ponto.id)
    if (defeito) r += R_DEFEITO[defeito]
    if (!pontasZeradas) r += R_PONTAS
    r = Math.max(0, r)
  }

  const v = avaliarContinuidade(r)
  return {
    pontoId: ponto.id,
    r,
    display: formatarLeitura(r),
    rTeorica,
    pontasZeradas,
    veredito: v.veredito,
    cor: v.cor,
    aprovado: v.aprovado,
  }
}

export interface NaoConformidade {
  pontoId: string
  nome: string
  leitura: string
  causaProvavel: string
  acao: string
}

export interface LaudoSPDA {
  total: number
  medidos: number
  aprovados: number
  conforme: boolean
  naoConformidades: NaoConformidade[]
  /** Pior leitura encontrada (Ω); Infinity se houve circuito aberto. */
  piorLeitura: number
  parecer: string
}

/** Causa provável e ação corretiva a partir da leitura. */
function diagnostico(l: LeituraContinuidade): { causaProvavel: string; acao: string } {
  if (!Number.isFinite(l.r))
    return {
      causaProvavel: 'Condutor de descida rompido ou conexão totalmente aberta.',
      acao: 'Localizar o trecho interrompido, refazer o condutor/conexão e remedir.',
    }
  if (l.r > LIMITE_ATENCAO)
    return {
      causaProvavel: 'Conexão corroída ou emenda deteriorada no percurso.',
      acao: 'Limpar/refazer a conexão (conector de pressão ou solda exotérmica) e remedir.',
    }
  return {
    causaProvavel: 'Conexão com aperto insuficiente ou oxidação superficial.',
    acao: 'Reapertar com torque, tratar a superfície e remedir.',
  }
}

/**
 * Emite o laudo de conformidade da continuidade do SPDA a partir das leituras.
 * Só é conforme se TODOS os trechos previstos foram medidos e aprovados.
 */
export function emitirLaudo(
  pontos: PontoSPDA[],
  medicoes: Record<string, LeituraContinuidade>,
): LaudoSPDA {
  const lidos = pontos.filter((p) => medicoes[p.id])
  const naoConformidades: NaoConformidade[] = []
  let aprovados = 0
  let piorLeitura = 0

  for (const p of lidos) {
    const l = medicoes[p.id]
    if (l.aprovado) aprovados++
    else naoConformidades.push({ pontoId: p.id, nome: p.nome, leitura: `${l.display} Ω`, ...diagnostico(l) })
    if (!Number.isFinite(l.r)) piorLeitura = Infinity
    else if (Number.isFinite(piorLeitura) && l.r > piorLeitura) piorLeitura = l.r
  }

  const completo = lidos.length === pontos.length
  const conforme = completo && naoConformidades.length === 0

  const parecer = conforme
    ? `Todos os ${pontos.length} trechos ensaiados apresentaram continuidade elétrica dentro do critério ` +
      `(R ≤ ${LIMITE_CONFORME.toFixed(1)} Ω). O SPDA ATENDE ao requisito de continuidade da ABNT NBR 5419-3 ` +
      `na data da inspeção.`
    : !completo
      ? `Inspeção INCOMPLETA: ${lidos.length} de ${pontos.length} trechos medidos. ` +
        `Meça todos os trechos previstos antes de emitir o laudo.`
      : `Foram identificadas ${naoConformidades.length} não conformidade(s) de continuidade. ` +
        `O SPDA NÃO ATENDE ao requisito da ABNT NBR 5419-3 até que os trechos apontados sejam ` +
        `corrigidos e remedidos.`

  return {
    total: pontos.length,
    medidos: lidos.length,
    aprovados,
    conforme,
    naoConformidades,
    piorLeitura,
    parecer,
  }
}

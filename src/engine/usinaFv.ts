/**
 * usinaFv.ts — Ensaios de ATERRAMENTO numa USINA FOTOVOLTAICA DE SOLO.
 *
 * Três ensaios, na ordem de campo:
 *
 *  1. CONTINUIDADE da equipotencialização (NBR 16274 · NBR 16690): cada mesa,
 *     inversor, trafo, SE e cerca até o BEP do skid, com miliohmímetro.
 *     R = Σ ρ·L/S + Σ R_conexões (+ defeito) (+ pontas não compensadas).
 *
 *  2. RESISTÊNCIA DA MALHA pela queda de potencial (NBR 15749). A malha de uma
 *     usina é GRANDE: a regra dos 61,8 % só vale com a estaca de corrente muito
 *     longe.
 *
 *  3. TENSÕES DE TOQUE E PASSO (medição NBR 15749, limites NBR 15751): o GPR
 *     da malha numa falta à terra na MT e o potencial no solo sob os pés:
 *     toque = GPR − V(pés); passo = |V(pé 1) − V(pé 2)|.
 *
 * Os potenciais NÃO são calculados aqui. Decisão do Pablo (11/09/2026): a
 * usina é um exemplo fixo, calculado fora pelo método do GroundPRO e trazido
 * como RESULTADOS (`catalog/usinaFvResultados.ts`, unitários: ρ = 1 Ω·m e
 * 1 A). Em solo homogêneo tudo é linear em ρ e em I, então esta engine só
 * escala e interpola — e aplica os critérios de norma.
 *
 * Funções puras, sem React/cena — testáveis isoladamente.
 */
import { RESISTIVIDADE, R_CONEXAO_BOA, R_PONTAS, formatarLeitura } from './spda'
import type {
  PontoContinuidadeFv,
  PontoToquePassoFv,
  SuperficieFv,
  TipoDefeitoFv,
  TrechoCondutor,
} from '../catalog/usinaFvPontos'

export type CorVeredito = 'pass' | 'marginal' | 'fail'
export type CenarioFv = 'conforme' | 'com-defeitos'

// ─── Solo e malha ────────────────────────────────────────────────────────────

export type PerfilSoloFv = 'umido' | 'arenoso' | 'rochoso'

/**
 * Resistividade aparente do solo por perfil (Ω·m), para um solo homogêneo.
 * Valores de ordem de grandeza da literatura; um projeto real usa a
 * estratificação medida pelo método de Wenner. O rochoso fica em 2 000 Ω·m
 * para que a malha de 300 kW ainda saia do critério e reprove o toque no trafo.
 */
export const RESISTIVIDADE_SOLO: Record<PerfilSoloFv, number> = {
  umido: 100,
  arenoso: 500,
  rochoso: 2000,
}

export const ROTULO_SOLO: Record<PerfilSoloFv, string> = {
  umido: 'Argiloso úmido',
  arenoso: 'Arenoso',
  rochoso: 'Rochoso / seco',
}

/**
 * Critério da resistência de aterramento (Ω). Mesmo critério do módulo de
 * resistência de aterramento: ≤ 10 Ω é a recomendação usual da concessionária.
 * ⚠ REVISAR COM O PABLO: o valor exigido depende da norma técnica da
 * concessionária local; a NBR 15751 não fixa um número único para a malha.
 */
export const LIMITE_MALHA_OHM = 10
export const LIMITE_MALHA_ATENCAO_OHM = 25

export function avaliarMalha(r: number): { veredito: string; cor: CorVeredito } {
  if (r <= LIMITE_MALHA_OHM) return { veredito: 'Adequada', cor: 'pass' }
  if (r <= LIMITE_MALHA_ATENCAO_OHM) return { veredito: 'Atenção — acima do recomendado', cor: 'marginal' }
  return { veredito: 'Inadequada', cor: 'fail' }
}

// ─── Ensaio 2 · queda de potencial numa malha grande ────────────────────────

/** Fração de E–C onde a regra clássica manda ler (61,8 %). */
export const POS_62 = 0.618
/** Deslocamentos da estaca P para conferir o patamar (62 % ± 10 %). */
export const POSICOES_PATAMAR = [0.52, 0.618, 0.72] as const
/** Tolerância para considerar que um ponto registrado está numa posição (fração). */
export const TOLERANCIA_POSICAO = 0.02
/**
 * Variação máxima entre as três leituras do patamar, relativa à leitura a 62 %.
 * ⚠ REVISAR COM O PABLO: critério de estabilidade adotado (IEEE 81 / prática
 * de campo); conferir o texto da NBR 15749.
 */
export const LIMITE_PATAMAR_PCT = 10
/**
 * Resultados unitários de UM cenário da usina (ρ = 1 Ω·m, 1 A injetado),
 * calculados fora e gravados em `catalog/usinaFvResultados.ts`.
 */
export interface ResultadosUnitariosFv {
  /** Resistência da malha para ρ = 1 Ω·m (Ω por Ω·m). */
  rg: number
  /** Distância da estaca C (m) → R(x) por Ω·m, x = 0; 0,01; …; 1 (101 valores). */
  curvas: Record<number, number[]>
  /** Id do ponto de toque/passo → fração do GPR (toque: 1 − V(pés)/GPR; passo: ΔV/GPR). */
  fracoes: Record<string, number>
  /** Distância de E, pela estrada das estacas, onde o potencial no solo cai a 10 % do GPR (m). */
  influenciaEstradaM: number
  /** Centro elétrico da malha em planta (x, z). */
  centro: [number, number]
}

/** Malha da usina para uma resistividade: os resultados unitários escalados por ρ. */
export interface MalhaFv {
  rho: number
  /** Resistência da malha (Ω). */
  rg: number
  unit: ResultadosUnitariosFv
}

export function montarMalha(rho: number, unit: ResultadosUnitariosFv): MalhaFv {
  if (!(rho > 0)) throw new Error('Resistividade inválida')
  return { rho, rg: rho * unit.rg, unit }
}

/** Interpolação linear numa curva amostrada de 0 a 1. */
function interpolar(valores: number[], x: number): number {
  const n = valores.length - 1
  const t = Math.max(0, Math.min(1, x)) * n
  const i = Math.min(n - 1, Math.floor(t))
  const f = t - i
  return valores[i] * (1 - f) + valores[i + 1] * f
}

/**
 * Resistência aparente com a estaca P na fração x ∈ [0, 1] da distância E–C,
 * interpolada na curva pré-calculada para essa distância.
 */
export function resistenciaAparenteFv(malha: MalhaFv, distanciaCM: number, x: number): number {
  const curva = malha.unit.curvas[distanciaCM]
  if (!curva) throw new Error(`Sem curva calculada para a estaca C a ${distanciaCM} m`)
  return malha.rho * interpolar(curva, x)
}

export interface PontoCurvaFv {
  x: number
  r: number
}

export interface ResultadoMalhaFv {
  distanciaCM: number
  /** Leitura registrada a 62 % (Ω). */
  r62: number
  /** Variação entre as leituras a 52 %, 62 % e 72 % (%). */
  variacaoPct: number
  /** Patamar estável (variação dentro do limite)? */
  patamarOk: boolean
  /** Curva completa (21 pontos) para o gráfico do laudo. */
  curva: PontoCurvaFv[]
  /** Veredito da resistência; "inconclusivo" quando não há patamar. */
  veredito: string
  cor: CorVeredito
  /** A leitura só vale como resistência da malha se houver patamar. */
  valida: boolean
}

/** Leitura registrada mais próxima de uma posição (dentro da tolerância). */
export function leituraNaPosicao(pontos: PontoCurvaFv[], x: number): PontoCurvaFv | undefined {
  let melhor: PontoCurvaFv | undefined
  for (const p of pontos) {
    const d = Math.abs(p.x - x)
    if (d <= TOLERANCIA_POSICAO && (!melhor || d < Math.abs(melhor.x - x))) melhor = p
  }
  return melhor
}

/** Já há leituras nas três posições do patamar? (trava do botão "Calcular") */
export function patamarRegistrado(pontos: PontoCurvaFv[]): boolean {
  return POSICOES_PATAMAR.every((x) => !!leituraNaPosicao(pontos, x))
}

/**
 * Consolida o ensaio a partir das leituras REGISTRADAS pelo operador: a
 * resistência é a leitura a 62 % e a confiabilidade vem da variação do patamar.
 * Sem patamar, o resultado é inconclusivo — aumentar a distância E–C.
 */
export function avaliarQuedaPotencial(malha: MalhaFv, distanciaCM: number, pontos: PontoCurvaFv[]): ResultadoMalhaFv | null {
  const leituras = POSICOES_PATAMAR.map((x) => leituraNaPosicao(pontos, x))
  if (leituras.some((l) => !l)) return null
  const rs = leituras.map((l) => l!.r)
  const r62 = rs[1]
  const variacaoPct = ((Math.max(...rs) - Math.min(...rs)) / r62) * 100
  const patamarOk = variacaoPct <= LIMITE_PATAMAR_PCT
  const curva: PontoCurvaFv[] = []
  for (let i = 0; i <= 20; i++) curva.push({ x: i / 20, r: resistenciaAparenteFv(malha, distanciaCM, i / 20) })
  const v = patamarOk
    ? avaliarMalha(r62)
    : { veredito: 'Inconclusivo — sem patamar', cor: 'marginal' as CorVeredito }
  return { distanciaCM, r62, variacaoPct, patamarOk, curva, veredito: v.veredito, cor: v.cor, valida: patamarOk }
}

// ─── Ensaio 1 · continuidade da equipotencialização ──────────────────────────

/**
 * Limites da continuidade (Ω) entre cada massa e o BEP do skid.
 * ⚠ REVISAR COM O PABLO: a NBR 16274 exige o ensaio de continuidade dos
 * condutores de proteção/equipotencialização sem fixar um valor único. Não
 * reaproveitamos os limites do SPDA (decisões e normas diferentes). Adotado:
 * ≤ 0,5 Ω conforme · 0,5–1,0 Ω atenção · > 1,0 Ω ou OL não conforme.
 */
export const LIMITE_EQUIPOT_CONFORME = 0.5
export const LIMITE_EQUIPOT_ATENCAO = 1.0

/** Acréscimo de resistência por defeito plantado (Ω). `rompido` = aberto. */
export const R_DEFEITO_FV: Record<TipoDefeitoFv, number> = {
  anodizacao: 3.4,
  corrosao: 0.62,
  rompido: Infinity,
}

export function resistenciaTrechos(trechos: TrechoCondutor[]): number {
  return trechos.reduce((s, t) => s + (t.secaoMm2 > 0 ? (RESISTIVIDADE['cobre-nu'] * t.comprimentoM) / t.secaoMm2 : 0), 0)
}

export function avaliarEquipotencializacao(r: number): { veredito: string; cor: CorVeredito; aprovado: boolean } {
  if (!Number.isFinite(r)) return { veredito: 'Descontinuidade — circuito aberto', cor: 'fail', aprovado: false }
  if (r <= LIMITE_EQUIPOT_CONFORME) return { veredito: 'Contínuo — conforme', cor: 'pass', aprovado: true }
  if (r <= LIMITE_EQUIPOT_ATENCAO) return { veredito: 'Atenção — conexão com resistência elevada', cor: 'marginal', aprovado: false }
  return { veredito: 'Não conforme — equipotencialização comprometida', cor: 'fail', aprovado: false }
}

/** Dispersão determinística por ponto (±2 mΩ), para as leituras não saírem iguais. */
function ruido(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return (h / 1000 - 0.5) * 0.004
}

export interface LeituraContinuidadeFv {
  pontoId: string
  r: number
  display: string
  rTeorica: number
  pontasZeradas: boolean
  veredito: string
  cor: CorVeredito
  aprovado: boolean
}

export function medirContinuidadeFv(
  ponto: PontoContinuidadeFv,
  cenario: CenarioFv,
  pontasZeradas: boolean,
): LeituraContinuidadeFv {
  const rTeorica = resistenciaTrechos(ponto.trechos)
  const defeito = cenario === 'com-defeitos' ? ponto.defeito : undefined
  let r: number
  if (defeito === 'rompido') {
    r = Infinity
  } else {
    r = rTeorica + ponto.conexoes * R_CONEXAO_BOA + ruido(ponto.id)
    if (defeito) r += R_DEFEITO_FV[defeito]
    if (!pontasZeradas) r += R_PONTAS
    r = Math.max(0, r)
  }
  const v = avaliarEquipotencializacao(r)
  return { pontoId: ponto.id, r, display: formatarLeitura(r), rTeorica, pontasZeradas, ...v }
}

// ─── Ensaio 3 · tensões de toque e de passo ──────────────────────────────────

/**
 * Parâmetros da falta à terra na MT, junto ao trafo.
 * ⚠ REVISAR COM O PABLO: corrente que escoa pela malha (após a divisão com os
 * cabos/neutro da rede) e tempo de eliminação dependem do estudo de proteção
 * da concessionária. Valores didáticos.
 */
export const I_MALHA_A = 500
export const T_ELIMINACAO_S = 0.5
/** Corrente injetada no ensaio (A); as leituras são extrapoladas para I_MALHA_A. */
export const I_TESTE_A = 10

/** Camada superficial de brita (NBR 15751 / IEEE 80). */
export const RHO_BRITA = 3000
export const H_BRITA_M = 0.1

/**
 * Fator de redução da camada superficial (IEEE 80, eq. 27):
 *   Cs = 1 − 0,09·(1 − ρ/ρs) / (2·hs + 0,09)
 */
export function fatorCs(rho: number, rhoS: number, hS: number): number {
  return 1 - (0.09 * (1 - rho / rhoS)) / (2 * hS + 0.09)
}

/**
 * Coeficiente 0,116 = corpo de 50 kg (IEEE 80, eqs. 32–33).
 * ⚠ REVISAR COM O PABLO: conferir na NBR 15751 o peso de referência (50 kg ou
 * 70 kg — 0,157) e as expressões adotadas pela edição vigente.
 */
export const K_CORPO_50KG = 0.116

function superficieEfetiva(rho: number, superficie: SuperficieFv): { rhoS: number; cs: number } {
  if (superficie === 'brita') return { rhoS: RHO_BRITA, cs: fatorCs(rho, RHO_BRITA, H_BRITA_M) }
  return { rhoS: rho, cs: 1 }
}

/** Tensão de toque máxima admissível (V): (1000 + 1,5·Cs·ρs)·k/√t. */
export function limiteToque(rho: number, superficie: SuperficieFv, tS = T_ELIMINACAO_S): number {
  const { rhoS, cs } = superficieEfetiva(rho, superficie)
  return ((1000 + 1.5 * cs * rhoS) * K_CORPO_50KG) / Math.sqrt(tS)
}

/** Tensão de passo máxima admissível (V): (1000 + 6·Cs·ρs)·k/√t. */
export function limitePasso(rho: number, superficie: SuperficieFv, tS = T_ELIMINACAO_S): number {
  const { rhoS, cs } = superficieEfetiva(rho, superficie)
  return ((1000 + 6 * cs * rhoS) * K_CORPO_50KG) / Math.sqrt(tS)
}

export interface LeituraToquePasso {
  pontoId: string
  /** Tensão lida com a corrente de ensaio (V). */
  vTeste: number
  /** Extrapolada para a corrente de falta que escoa pela malha (V). */
  vFalta: number
  limite: number
  /** vFalta / limite. */
  razao: number
  veredito: string
  cor: CorVeredito
  aprovado: boolean
}

/** Faixa de atenção: até 20 % abaixo do limite ainda é aprovado, mas sem folga. */
const FOLGA_ATENCAO = 0.8

/**
 * Mede toque/passo num ponto. `malha` já é a do cenário (a geometria com
 * defeito é outra: falta o anel de equalização em frente ao portão).
 */
export function medirToquePasso(ponto: PontoToquePassoFv, malha: MalhaFv): LeituraToquePasso {
  const fracao = malha.unit.fracoes[ponto.id]
  if (fracao === undefined) throw new Error(`Sem resultado calculado para o ponto ${ponto.id}`)
  const vTeste = fracao * I_TESTE_A * malha.rg
  const vFalta = vTeste * (I_MALHA_A / I_TESTE_A)
  const limite = ponto.tipo === 'toque' ? limiteToque(malha.rho, ponto.superficie) : limitePasso(malha.rho, ponto.superficie)
  const razao = vFalta / limite
  const aprovado = razao <= 1
  const cor: CorVeredito = !aprovado ? 'fail' : razao > FOLGA_ATENCAO ? 'marginal' : 'pass'
  const nome = ponto.tipo === 'toque' ? 'toque' : 'passo'
  const veredito = !aprovado
    ? `Tensão de ${nome} acima do suportável`
    : cor === 'marginal'
      ? `Dentro do limite, com pouca folga`
      : `Tensão de ${nome} dentro do limite`
  return { pontoId: ponto.id, vTeste, vFalta, limite, razao, veredito, cor, aprovado }
}

// ─── Laudo consolidado ───────────────────────────────────────────────────────

export interface AchadoFv {
  ensaio: 'Continuidade' | 'Resistência da malha' | 'Toque e passo'
  item: string
  leitura: string
  acao: string
}

export interface LaudoFv {
  continuidade: { total: number; aprovados: number }
  malha: ResultadoMalhaFv | null
  toquePasso: { total: number; aprovados: number }
  achados: AchadoFv[]
  conforme: boolean
  completo: boolean
  parecer: string
}

function acaoContinuidade(l: LeituraContinuidadeFv, defeito?: TipoDefeitoFv): string {
  if (!Number.isFinite(l.r)) return 'Localizar a interrupção (cordoalha/derivação ausente ou rompida), refazer e remedir.'
  if (defeito === 'anodizacao' || l.r > LIMITE_EQUIPOT_ATENCAO)
    return 'Refazer a conexão com arruela serrilhada/grampo que perfure a anodização e remedir.'
  return 'Limpar, tratar e reapertar o conector; remedir.'
}

export function emitirLaudoFv(dados: {
  pontosContinuidade: PontoContinuidadeFv[]
  continuidade: Record<string, LeituraContinuidadeFv>
  malha: ResultadoMalhaFv | null
  pontosToquePasso: PontoToquePassoFv[]
  toquePasso: Record<string, LeituraToquePasso>
}): LaudoFv {
  const achados: AchadoFv[] = []
  let aprovCont = 0
  for (const p of dados.pontosContinuidade) {
    const l = dados.continuidade[p.id]
    if (!l) continue
    if (l.aprovado) aprovCont++
    else achados.push({ ensaio: 'Continuidade', item: p.nome, leitura: `${l.display} Ω`, acao: acaoContinuidade(l, p.defeito) })
  }
  const m = dados.malha
  if (m && !m.valida)
    achados.push({
      ensaio: 'Resistência da malha',
      item: `Estaca C a ${m.distanciaCM} m`,
      leitura: `variação ${m.variacaoPct.toFixed(1)} %`,
      acao: 'Sem patamar: afastar a estaca de corrente (≥ 5× a diagonal da malha) e repetir a curva.',
    })
  else if (m && m.cor !== 'pass')
    achados.push({
      ensaio: 'Resistência da malha',
      item: 'Malha da usina',
      leitura: `${m.r62.toFixed(2)} Ω`,
      acao: 'Ampliar a malha, acrescentar hastes ou tratar o solo; reavaliar toque e passo.',
    })
  let aprovTP = 0
  for (const p of dados.pontosToquePasso) {
    const l = dados.toquePasso[p.id]
    if (!l) continue
    if (l.aprovado) aprovTP++
    else
      achados.push({
        ensaio: 'Toque e passo',
        item: p.nome,
        leitura: `${Math.round(l.vFalta)} V > ${Math.round(l.limite)} V`,
        acao:
          p.id === 't-portao'
            ? 'Refazer o anel de equalização em frente ao portão (a 1 m da cerca) e reavaliar; em solo muito resistivo, acrescentar brita do lado de fora.'
            : 'Reforçar a malha no local, aplicar brita (≥ 10 cm) e reavaliar.',
      })
  }
  const completo =
    dados.pontosContinuidade.every((p) => !!dados.continuidade[p.id]) &&
    !!m &&
    dados.pontosToquePasso.every((p) => !!dados.toquePasso[p.id])
  const conforme = completo && achados.length === 0
  const parecer = !completo
    ? 'Inspeção INCOMPLETA: conclua os três ensaios (continuidade, resistência da malha e toque/passo) antes de emitir o laudo.'
    : conforme
      ? `O sistema de aterramento da usina ATENDE aos critérios adotados: equipotencialização contínua em todos os ` +
        `${dados.pontosContinuidade.length} pontos, malha com ${m!.r62.toFixed(2)} Ω e patamar estável, e tensões de ` +
        `toque e passo abaixo dos limites suportáveis.`
      : `Foram identificados ${achados.length} achado(s). O sistema de aterramento NÃO ATENDE aos critérios adotados ` +
        `até que os itens apontados sejam corrigidos e os ensaios, repetidos.`
  return {
    continuidade: { total: dados.pontosContinuidade.length, aprovados: aprovCont },
    malha: m,
    toquePasso: { total: dados.pontosToquePasso.length, aprovados: aprovTP },
    achados,
    conforme,
    completo,
    parecer,
  }
}

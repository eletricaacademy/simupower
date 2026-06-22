/**
 * arcflash.ts — Engine pura do estudo de ARCO ELÉTRICO (energia incidente).
 *
 * Modelo IEEE Std 1584-2002 (válido 0,208–15 kV): corrente de arco, energia
 * incidente normalizada, energia incidente na distância de trabalho, fronteira
 * de arco (AFB) e categoria de EPI (NFPA 70E). Sem React — testável em Node.
 */

export type ConfigEletrodo = 'caixa' | 'aberto'
export type Aterramento = 'aterrado' | 'isolado'

/** Classe de equipamento → distância de trabalho, expoente x e gap típicos. */
export interface ClasseEquip {
  id: string
  nome: string
  /** distância de trabalho típica (mm) */
  distancia: number
  /** expoente de distância */
  x: number
  /** gap entre condutores (mm) */
  gap: number
  config: ConfigEletrodo
}

export const CLASSES: Record<string, ClasseEquip> = {
  'painel-bt': { id: 'painel-bt', nome: 'Painel BT (switchgear)', distancia: 610, x: 1.473, gap: 32, config: 'caixa' },
  'mcc-bt': { id: 'mcc-bt', nome: 'CCM / MCC BT', distancia: 455, x: 1.641, gap: 25, config: 'caixa' },
  'painel-mt': { id: 'painel-mt', nome: 'Painel MT (switchgear)', distancia: 910, x: 0.973, gap: 153, config: 'caixa' },
  'aberto': { id: 'aberto', nome: 'Ar livre', distancia: 910, x: 2.0, gap: 153, config: 'aberto' },
}

export interface ArcInput {
  /** tensão do sistema (kV) */
  voc: number
  /** corrente de curto-circuito presumida / bolted fault (kA) */
  ibf: number
  /** tempo de arco / eliminação da proteção (s) */
  t: number
  /** gap entre condutores (mm) */
  gap: number
  /** distância de trabalho (mm) */
  distancia: number
  /** expoente de distância (da classe) */
  x: number
  config: ConfigEletrodo
  aterramento: Aterramento
}

export interface ArcResult {
  /** corrente de arco (kA) */
  ia: number
  /** energia incidente normalizada (J/cm², 0,2 s @ 610 mm) */
  en: number
  /** energia incidente na distância de trabalho (cal/cm²) */
  energia: number
  /** fronteira de arco — distância onde E = 1,2 cal/cm² (mm) */
  afb: number
  categoria: CategoriaEPI
  cor: 'pass' | 'marginal' | 'fail'
}

export interface CategoriaEPI {
  nivel: 0 | 1 | 2 | 3 | 4 | 5
  rotulo: string
  /** EPI mínimo (cal/cm²) da categoria, 0 quando mínimo/extremo */
  epiCal: number
}

const log10 = (v: number) => Math.log10(Math.max(v, 1e-9))

/** Corrente de arco Ia (kA) — IEEE 1584-2002. */
export function correnteArco(voc: number, ibf: number, gap: number, config: ConfigEletrodo): number {
  const lgIbf = log10(ibf)
  let lgIa: number
  if (voc < 1) {
    const K = config === 'aberto' ? -0.153 : -0.097
    lgIa =
      K +
      0.662 * lgIbf +
      0.0966 * voc +
      0.000526 * gap +
      0.5588 * voc * lgIbf -
      0.00304 * gap * lgIbf
  } else {
    lgIa = 0.00402 + 0.983 * lgIbf
  }
  return Math.pow(10, lgIa)
}

/** Energia incidente normalizada En (J/cm², 0,2 s @ 610 mm). */
export function energiaNormalizada(
  ia: number,
  gap: number,
  config: ConfigEletrodo,
  aterramento: Aterramento,
): number {
  const K1 = config === 'aberto' ? -0.792 : -0.555
  const K2 = aterramento === 'aterrado' ? -0.113 : 0
  const lgEn = K1 + K2 + 1.081 * log10(ia) + 0.0011 * gap
  return Math.pow(10, lgEn)
}

/** Fator Cf por tensão. */
function cf(voc: number): number {
  return voc <= 1 ? 1.5 : 1.0
}

/** Energia incidente E (cal/cm²) na distância de trabalho. */
export function energiaIncidente(en: number, voc: number, t: number, distancia: number, x: number): number {
  return 4.184 * cf(voc) * en * (t / 0.2) * Math.pow(610 / distancia, x)
}

/** Fronteira de arco — distância (mm) onde E = 1,2 cal/cm². */
export function fronteiraArco(en: number, voc: number, t: number, x: number): number {
  const k = (4.184 * cf(voc) * en * (t / 0.2)) / 1.2
  return 610 * Math.pow(k, 1 / x)
}

/** Categoria de EPI (NFPA 70E) a partir da energia incidente (cal/cm²). */
export function categoriaEPI(E: number): CategoriaEPI {
  if (E < 1.2) return { nivel: 0, rotulo: 'Risco mínimo', epiCal: 0 }
  if (E <= 4) return { nivel: 1, rotulo: 'Categoria 1', epiCal: 4 }
  if (E <= 8) return { nivel: 2, rotulo: 'Categoria 2', epiCal: 8 }
  if (E <= 25) return { nivel: 3, rotulo: 'Categoria 3', epiCal: 25 }
  if (E <= 40) return { nivel: 4, rotulo: 'Categoria 4', epiCal: 40 }
  return { nivel: 5, rotulo: 'Perigo extremo — não energizar', epiCal: 0 }
}

function corDaCategoria(nivel: number): 'pass' | 'marginal' | 'fail' {
  if (nivel === 0) return 'pass'
  if (nivel <= 2) return 'marginal'
  return 'fail'
}

/** Cálculo completo do estudo de arco. */
export function calcularArco(input: ArcInput): ArcResult {
  const ia = correnteArco(input.voc, input.ibf, input.gap, input.config)
  const en = energiaNormalizada(ia, input.gap, input.config, input.aterramento)
  const energia = energiaIncidente(en, input.voc, input.t, input.distancia, input.x)
  const afb = fronteiraArco(en, input.voc, input.t, input.x)
  const categoria = categoriaEPI(energia)
  return { ia, en, energia, afb, categoria, cor: corDaCategoria(categoria.nivel) }
}

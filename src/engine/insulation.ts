/**
 * insulation.ts — Engine pura do ensaio de RESISTÊNCIA DE ISOLAMENTO.
 *
 * Sem React, sem efeitos colaterais: só matemática testável em Node.
 * Modelo de absorção dielétrica com dois tempos:
 *
 *     R(t) = Rinf * (1 - A·e^(-t/τ1) - B·e^(-t/τ2))     [MΩ]
 *
 * - τ1 (curto): corrente de absorção rápida.
 * - τ2 (longo): polarização lenta — domina a subida ao longo dos minutos.
 *
 * Referências: IEEE Std 43 (índice de polarização e correção de temperatura
 * para 40 °C), prática de campo NBR/IEC para DAR/PI.
 */

/** Condição didática do isolamento (selecionável no "modo instrutor"). */
export type Perfil = 'bom' | 'atencao' | 'ruim'

/** Tensões de ensaio normalizadas (V). */
export type TensaoEnsaio = 250 | 500 | 1000 | 2500

/** Veredito final do ensaio, do melhor ao pior. */
export type Veredito = 'Excelente' | 'Aprovado' | 'Questionável' | 'Reprovado'

export interface PerfilParametros {
  A: number
  tau1: number
  B: number
  tau2: number
  /** Resistência assintótica (Rinf) por tensão de ensaio, em MΩ. */
  rinf: Record<TensaoEnsaio, number>
}

/**
 * Perfis de absorção. As constantes A/B/τ vêm da especificação do projeto;
 * Rinf por tensão reflete a queda esperada de isolamento com tensões maiores.
 */
export const PERFIS: Record<Perfil, PerfilParametros> = {
  bom: {
    A: 0.4,
    tau1: 35,
    B: 0.58,
    tau2: 380,
    rinf: { 250: 9000, 500: 8000, 1000: 7000, 2500: 6000 },
  },
  atencao: {
    A: 0.3,
    tau1: 20,
    B: 0.3,
    tau2: 180,
    rinf: { 250: 200, 500: 150, 1000: 110, 2500: 80 },
  },
  ruim: {
    A: 0.1,
    tau1: 8,
    B: 0.05,
    tau2: 100,
    rinf: { 250: 6, 500: 4, 1000: 2.5, 2500: 1.5 },
  },
}

/**
 * Resistência de isolamento instantânea em MΩ.
 * @param perfil condição do isolamento
 * @param V tensão de ensaio (V)
 * @param t tempo desde o início do ensaio (s)
 */
export function rIso(perfil: Perfil, V: TensaoEnsaio, t: number): number {
  const p = PERFIS[perfil]
  const rinf = p.rinf[V]
  const r = rinf * (1 - p.A * Math.exp(-t / p.tau1) - p.B * Math.exp(-t / p.tau2))
  // o modelo é monotônico crescente para t ≥ 0; clampe ruídos numéricos.
  return Math.max(0, r)
}

/**
 * Correção de temperatura para 40 °C (IEEE 43): dobra a cada 10 °C acima de 40.
 *   R40 = R · 2^((tempC - 40) / 10)
 */
export function corrigir40(R: number, tempC: number): number {
  return R * Math.pow(2, (tempC - 40) / 10)
}

/** Dielectric Absorption Ratio: R(60s) / R(30s). */
export function calcularDAR(r30: number, r60: number): number {
  if (r30 <= 0) return 0
  return r60 / r30
}

/** Polarization Index: R(10min) / R(1min) = R(600s) / R(60s). */
export function calcularPI(r60: number, r600: number): number {
  if (r60 <= 0) return 0
  return r600 / r60
}

/**
 * Veredito segundo limites de campo (IEEE 43 e prática NBR/IEC):
 *  - R40 < 5 MΩ  OU  PI < 1.0          → Reprovado
 *  - PI < 2.0  OU  DAR < 1.25  OU  R40 < 100 → Questionável
 *  - PI < 4.0                          → Aprovado
 *  - caso contrário                    → Excelente
 */
export function avaliar(dar: number, pi: number, r40: number): Veredito {
  if (r40 < 5 || pi < 1.0) return 'Reprovado'
  if (pi < 2.0 || dar < 1.25 || r40 < 100) return 'Questionável'
  if (pi < 4.0) return 'Aprovado'
  return 'Excelente'
}

/** Cor de status associada ao veredito (chave em tokens.color.status). */
export function corDoVeredito(v: Veredito): 'pass' | 'marginal' | 'fail' {
  switch (v) {
    case 'Excelente':
    case 'Aprovado':
      return 'pass'
    case 'Questionável':
      return 'marginal'
    case 'Reprovado':
      return 'fail'
  }
}

export interface ResultadoEnsaio {
  r30: number
  r60: number
  r600: number
  r40: number
  dar: number
  pi: number
  veredito: Veredito
  cor: 'pass' | 'marginal' | 'fail'
}

/**
 * Executa o cálculo completo do ensaio para um perfil/tensão/temperatura.
 * Captura R(30), R(60) e projeta R(600) para o PI; corrige R(60) para 40 °C.
 */
export function executarEnsaio(
  perfil: Perfil,
  V: TensaoEnsaio,
  tempC: number,
): ResultadoEnsaio {
  const r30 = rIso(perfil, V, 30)
  const r60 = rIso(perfil, V, 60)
  const r600 = rIso(perfil, V, 600)
  const r40 = corrigir40(r60, tempC)
  const dar = calcularDAR(r30, r60)
  const pi = calcularPI(r60, r600)
  const veredito = avaliar(dar, pi, r40)
  return { r30, r60, r600, r40, dar, pi, veredito, cor: corDoVeredito(veredito) }
}

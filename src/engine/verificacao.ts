/**
 * verificacao.ts — Engine PURA dos ensaios da NBR 5410 §7 (Fluke 1662).
 *
 * Dada a definição do ensaio e a condição da instalação (ok / falha), devolve a
 * leitura que o Fluke mostraria + o veredito por norma. Sem React, testável.
 */
import type { EnsaioVerificacao } from '../catalog/verificacaoTestes'

export type CondicaoInstalacao = 'ok' | 'falha'

export interface LeituraEnsaio {
  /** Valor numérico medido. */
  valor: number
  unidade: string
  /** Texto formatado p/ o visor do Fluke (ex.: "52.4", "OL", "127"). */
  display: string
  /** Grandeza derivada exibida junto (ex.: corrente de falta prevista). */
  extra?: string
  aprovado: boolean
  veredito: string
}

/** Formata número com casas conforme a grandeza. */
function fmt(v: number, casas: number): string {
  return v.toFixed(casas)
}

/**
 * Simula a medição de um ensaio. Valores realistas por tipo; `condicao` permite
 * demonstrar instalação conforme (ok) ou com defeito (falha) — útil no modo
 * instrutor / para a animação.
 */
export function medirEnsaio(ensaio: EnsaioVerificacao, condicao: CondicaoInstalacao): LeituraEnsaio {
  switch (ensaio.id) {
    case 'continuidade': {
      if (condicao === 'falha')
        return { valor: Infinity, unidade: 'Ω', display: 'OL', aprovado: false, veredito: 'Circuito aberto — condutor de proteção interrompido.' }
      const v = 0.32
      return { valor: v, unidade: 'Ω', display: fmt(v, 2), aprovado: true, veredito: 'Contínuo (R baixa). Condutor PE íntegro.' }
    }
    case 'isolamento': {
      const v = condicao === 'falha' ? 0.28 : 52.4
      const ok = v >= 1.0
      return {
        valor: v,
        unidade: 'MΩ',
        display: v >= 100 ? '>100' : fmt(v, v < 10 ? 2 : 1),
        extra: 'Ensaio 500 V CC',
        aprovado: ok,
        veredito: ok ? 'R_iso ≥ 1,0 MΩ — conforme (Tabela 61).' : 'R_iso < 1,0 MΩ — isolamento comprometido.',
      }
    }
    case 'polaridade': {
      if (condicao === 'falha')
        return { valor: 127, unidade: 'V', display: '127', extra: 'F/N invertidos', aprovado: false, veredito: 'Fase e neutro invertidos na tomada.' }
      return { valor: 127, unidade: 'V', display: '127', extra: 'F-N-PE corretos', aprovado: true, veredito: 'Polaridade correta; PE presente.' }
    }
    case 'loop-zs': {
      const z = condicao === 'falha' ? 2.45 : 0.78
      const ipf = Math.round(230 / z) // corrente de falta prevista (A) ~ U0/Zs
      const ok = z <= 1.5
      return {
        valor: z,
        unidade: 'Ω',
        display: fmt(z, 2),
        extra: `PEFC ${ipf} A`,
        aprovado: ok,
        veredito: ok ? 'Zs baixa — seccionamento garantido no tempo (≤0,4 s).' : 'Zs alta — pode não seccionar no tempo exigido.',
      }
    }
    case 'rcd-tempo': {
      if (condicao === 'falha')
        return { valor: 0, unidade: 'ms', display: '>300', extra: '×1 IΔn', aprovado: false, veredito: 'DR não disparou no tempo — substituir.' }
      const t = 27
      return { valor: t, unidade: 'ms', display: fmt(t, 0), extra: '×1 IΔn (30 mA)', aprovado: true, veredito: 't ≤ 300 ms — DR conforme.' }
    }
    case 'rcd-rampa': {
      const i = condicao === 'falha' ? 38 : 22
      const ok = i >= 15 && i <= 30
      return {
        valor: i,
        unidade: 'mA',
        display: fmt(i, 0),
        extra: 'IΔn 30 mA',
        aprovado: ok,
        veredito: ok ? 'Disparo entre 50–100% de IΔn — conforme.' : 'Disparo fora de 15–30 mA — DR não conforme.',
      }
    }
    case 'aterramento': {
      const r = condicao === 'falha' ? 82 : 3.2
      const ok = r <= 25 // referência prática; ajustar ao esquema (TT: RA×IΔn≤50V)
      return {
        valor: r,
        unidade: 'Ω',
        display: fmt(r, 1),
        extra: 'Método de loop',
        aprovado: ok,
        veredito: ok ? 'RE compatível com o aterramento/DR.' : 'RE alta — rever malha de aterramento.',
      }
    }
    default:
      return { valor: 0, unidade: '', display: '--', aprovado: false, veredito: '' }
  }
}

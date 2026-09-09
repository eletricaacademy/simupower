import type { Vec3 } from './types'
import type { RamoEstrutural, VerificacaoEstrutural } from '../engine/estrutural'

/** Contrato: a cena procedural e os contatos usam as mesmas dimensões.
 * Não são coordenadas estimadas de um GLB. Geometria didática em metros.
 * Ao substituir por asset externo, recapturar contatos e vistas pelo pickMode.
 */
export const GALPAO = { largura: 16, comprimento: 24, altura: 7, cumeeira: 9, pilar: 0.5 }
// Bases P1, P5, P8 e P4 estão espaçadas a cada 20 m no perímetro de 80 m.
export const PILARES = [-12, -8, 8, 12].flatMap((z, fila) => [-8, 8].map((x, lado) => ({
  id: `P${fila * 2 + lado + 1}`, x, z,
})))
export type FaseEstrutural = 'obra' | 'pronto'
export function contatoEstrutural(id: string, superior: boolean, fase: FaseEstrutural): Vec3 {
  const p = PILARES.find(p => p.id === id)!
  // Na obra a garra alcança a ferragem exposta; no galpão pronto, o Aterrinsert
  // termina na face externa do pilar para permitir inspeção sem entrar na edificação.
  const deslocamentoX = fase === 'obra'
    ? (p.x < 0 ? 1 : -1) * 0.16
    : (p.x < 0 ? -1 : 1) * 0.4
  return [p.x + deslocamentoX, superior ? 6.6 : 1.2, p.z]
}
export const BEP_ESTRUTURAL: Vec3 = [5.5, 1.2, -10]
export const PARES_ESTRUTURAIS = [
  ...PILARES.map((p, i) => {
    const b = ['P5', 'P4', 'P8', 'P1', 'P4', 'P5', 'P1', 'P4'][i]
    return { id: `${p.id}-${b}-cruzada`, nome: `${p.id} topo ↔ ${b} base`, a: p.id, b, tipo: 'primeira' as VerificacaoEstrutural }
  }),
  { id: 'captacao-bep', nome: 'Captação ↔ BEP · comprobatória', a: 'P1', b: 'BEP', tipo: 'comprobatoria' as VerificacaoEstrutural },
]

export const POS_CAPTACAO: Vec3 = [-7.84, 7.2, -12]
export type DefeitoEstrutural = 'integro' | 'bep' | 'pilar'
export interface RamoVisual extends RamoEstrutural { pontos: Vec3[] }
export function redeEstrutural(fase: FaseEstrutural, tipo: VerificacaoEstrutural, defeito: DefeitoEstrutural): RamoVisual[] {
  const nos: Record<string, Vec3> = {}, ramos: RamoVisual[] = []
  const adicionar = (id: string, a: string, b: string, pontos = [nos[a], nos[b]], extra = 0) => {
    const comprimento = pontos.slice(1).reduce((s,p,i) => s + Math.hypot(...p.map((v,k) => v - pontos[i][k])), 0)
    // Resistividade, seção equivalente e contatos são parâmetros do cenário, não limites normativos.
    ramos.push({ id, a, b, pontos, r: Math.max(0.0001, 0.15 * comprimento / 80 + 0.0004 + extra) })
  }
  for (const p of PILARES) {
    const x = p.x + (p.x < 0 ? 0.16 : -0.16)
    nos[`${p.id}-f`] = [x, -0.6, p.z]
    nos[`${p.id}-b`] = [x, 1.2, p.z]
    nos[`${p.id}-t`] = [x, 6.6, p.z]
    nos[`${p.id}-v`] = [x, 6.8, p.z]
    nos[`${p.id}-base`] = contatoEstrutural(p.id, false, fase)
    nos[`${p.id}-topo`] = contatoEstrutural(p.id, true, fase)
    adicionar(`${p.id}-inferior`, `${p.id}-f`, `${p.id}-b`)
    adicionar(`${p.id}-vertical`, `${p.id}-b`, `${p.id}-t`)
    adicionar(`${p.id}-coroamento`, `${p.id}-t`, `${p.id}-v`)
    adicionar(`${p.id}-insert-base`, `${p.id}-b`, `${p.id}-base`)
    adicionar(`${p.id}-insert-topo`, `${p.id}-t`, `${p.id}-topo`, undefined, defeito === 'pilar' && p.id === 'P1' ? 1.3 : 0)
  }
  for (const nivel of ['f', 'v']) {
    for (let i = 0; i < 6; i++) adicionar(`${nivel}-long-${i}`, `${PILARES[i].id}-${nivel}`, `${PILARES[i+2].id}-${nivel}`)
    for (let i = 0; i < 8; i += 2) adicionar(`${nivel}-trans-${i}`, `${PILARES[i].id}-${nivel}`, `${PILARES[i+1].id}-${nivel}`)
  }
  // BEP ligado à base P4, que integra os quatro pontos equidistantes da primeira verificação.
  nos.BEP = BEP_ESTRUTURAL
  adicionar('ligacao-bep', 'P4-base', 'BEP', [nos['P4-base'], [7.6,0.2,-8], [5.5,0.2,-8], [5.5,0.2,-10], nos.BEP], defeito === 'bep' ? 0.35 : 0)
  if (tipo === 'comprobatoria') {
    for (const p of PILARES) {
      nos[`${p.id}-cap`] = [nos[`${p.id}-v`][0], 7.2, p.z]
      adicionar(`${p.id}-cap-ligacao`, `${p.id}-cap`, `${p.id}-topo`)
    }
    for (let i = 0; i < 6; i++) adicionar(`cap-long-${i}`, `${PILARES[i].id}-cap`, `${PILARES[i+2].id}-cap`)
    for (const i of [0,6]) {
      const a = `${PILARES[i].id}-cap`, b = `${PILARES[i+1].id}-cap`
      adicionar(`cap-trans-${i}`, a, b, [nos[a], [0, 9.2, PILARES[i].z], nos[b]])
    }
  }
  return ramos
}

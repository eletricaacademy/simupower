import type { Vec3 } from './types'

/** Contrato: a cena procedural e os contatos usam as mesmas dimensões.
 * Não são coordenadas estimadas de um GLB. Geometria didática em metros.
 * Ao substituir por asset externo, recapturar contatos e vistas pelo pickMode.
 */
export const GALPAO = { largura: 16, comprimento: 24, altura: 7, cumeeira: 9, pilar: 0.5 }
export const PILARES = [-12, -4, 4, 12].flatMap((z, fila) => [-8, 8].map((x, lado) => ({
  id: `P${fila * 2 + lado + 1}`, x, z,
})))
export type FaseEstrutural = 'obra' | 'pronto'
export function contatoEstrutural(id: string, superior: boolean, fase: FaseEstrutural): Vec3 {
  const p = PILARES.find(p => p.id === id)!
  // A face interna do insert recebe um pino M12; a garra toca a ponta do pino.
  return [p.x + (p.x < 0 ? 1 : -1) * (fase === 'obra' ? 0.16 : 0.4), superior ? 6.6 : 1.2, p.z]
}
export const BEP_ESTRUTURAL: Vec3 = [5.5, 1.2, -10]
export const PARES_ESTRUTURAIS = [
  { id: 'p1-p3', nome: 'P1 ↔ P3 · pilares vizinhos', a: 'P1', b: 'P3', vertical: false },
  { id: 'p1-p2', nome: 'P1 ↔ P2 · transversal', a: 'P1', b: 'P2', vertical: false },
  { id: 'p1-p8', nome: 'P1 ↔ P8 · cruzada', a: 'P1', b: 'P8', vertical: false },
  ...PILARES.map(p => ({ id: `${p.id}-vertical`, nome: `${p.id} · superior ↔ inferior`, a: p.id, b: p.id, vertical: true })),
  { id: 'p2-bep', nome: 'P2 ↔ BEP · equipotencialização', a: 'P2', b: 'BEP', vertical: false },
]

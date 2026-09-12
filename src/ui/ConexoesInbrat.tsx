import { color } from '../design/tokens'

/** Manual INMD1 PRO, pp. 10 e 13: cores das vias não definem a polaridade das garras. */
export function ConexoesInbrat() {
  return <details className="my-2 text-[11px] leading-snug" style={{ color: color.textMuted }}>
    <summary className="cursor-pointer py-1" style={{ color: color.accentCool }}>Conexões Kelvin e sentido da corrente</summary>
    <div className="space-y-1 pt-1">
      <p>C1 e C2: vias vermelhas de corrente. P1 e P2: vias pretas que medem a tensão.</p>
      <p>Cada garra recebe duas vias: P1/C1 ou P2/C2. A cor do punho da garra identifica o cabo na cena; não indica sua polaridade.</p>
      <p>Nas animações, adotamos C1 → instalação → C2. O manual não identifica expressamente o polo positivo; esse sentido é uma convenção didática.</p>
    </div>
  </details>
}

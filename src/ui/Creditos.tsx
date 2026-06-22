import { color } from '../design/tokens'

/**
 * Creditos — assinatura discreta exibida em todas as simulações.
 * Fixo na base central, sem capturar cliques.
 */
export function Creditos() {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none flex items-center gap-1.5"
      style={{ bottom: 'max(6px, env(safe-area-inset-bottom))', color: color.textFaint }}
    >
      <span className="text-[10px] tracking-wide">
        Desenvolvido por <span style={{ color: color.textMuted }}>Elétrica Tools</span> · Eng. Pablo
        Guimarães
      </span>
    </div>
  )
}

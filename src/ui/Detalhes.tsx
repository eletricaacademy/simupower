import { useIsPhone } from './useIsPhone'
import { color } from '../design/tokens'

/**
 * Detalhes — lista de bullets de um passo. No desktop aparece aberta como antes;
 * no celular vira um disclosure recolhível ("Ver detalhes ▸") para encurtar o
 * card e liberar o palco 3D. Mantém o mesmo visual de lista nos dois casos.
 */
export function Detalhes({
  itens,
  resumo = 'Ver detalhes',
  cor = color.accentCool,
  marcador = '›',
  className = 'mb-3',
}: {
  itens?: string[]
  resumo?: string
  cor?: string
  marcador?: string
  className?: string
}) {
  const phone = useIsPhone()
  if (!itens || itens.length === 0) return null

  const lista = (
    <ul className="space-y-1">
      {itens.map((d, i) => (
        <li key={i} className="flex gap-1.5 text-[11.5px] leading-snug" style={{ color: color.textMuted }}>
          <span aria-hidden style={{ color: cor }}>
            {marcador}
          </span>
          <span>{d}</span>
        </li>
      ))}
    </ul>
  )

  if (!phone) return <div className={className}>{lista}</div>

  return (
    <details className={`hud-details ${className}`}>
      <summary
        className="flex items-center gap-1 text-[11px] cursor-pointer select-none"
        style={{ color: color.textFaint }}
      >
        <span aria-hidden className="hud-details-caret">
          ▸
        </span>
        {resumo} ({itens.length})
      </summary>
      <div className="mt-1.5">{lista}</div>
    </details>
  )
}

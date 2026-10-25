import { useView, type Vista } from '../sim/viewStore'
import { color } from '../design/tokens'
import { useTranslation } from 'react-i18next'

/**
 * ViewControls — barra de vistas de câmera, padrão para todas as simulações:
 * recentralizar (reset), topo, frontal e lateral.
 */
const BOTOES: { v: Vista; icon: string }[] = [
  { v: 'reset', icon: '⌖' },
  { v: 'frontal', icon: '▣' },
  { v: 'lateral', icon: '◧' },
  { v: 'topo', icon: '⬓' },
]

export function ViewControls({ compact = false }: { compact?: boolean }) {
  const pedir = useView((s) => s.pedir)
  const { t } = useTranslation()
  return (
    <div className={`hud-glass rounded-[12px] p-1 flex gap-1 ${compact ? 'flex-row' : 'flex-col'}`}>
      {BOTOES.map((b) => {
        const rotulo = t(`vistas.${b.v}`)
        return (
        <button
          key={b.v}
          onClick={() => pedir(b.v)}
          title={rotulo}
          aria-label={rotulo}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-[12px] transition-colors hover:bg-white/5"
          style={{ color: color.textMuted }}
        >
          <span aria-hidden style={{ fontSize: 14, width: 16, textAlign: 'center', color: color.accentCool }}>
            {b.icon}
          </span>
          {!compact && <span className="hidden sm:inline">{rotulo}</span>}
        </button>
        )
      })}
    </div>
  )
}

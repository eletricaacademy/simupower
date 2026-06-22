import { useView, type Vista } from '../sim/viewStore'
import { color } from '../design/tokens'

/**
 * ViewControls — barra de vistas de câmera, padrão para todas as simulações:
 * recentralizar (reset), topo, frontal e lateral.
 */
const BOTOES: { v: Vista; rotulo: string; icon: string }[] = [
  { v: 'reset', rotulo: 'Centralizar', icon: '⌖' },
  { v: 'frontal', rotulo: 'Frontal', icon: '▣' },
  { v: 'lateral', rotulo: 'Lateral', icon: '◧' },
  { v: 'topo', rotulo: 'Topo', icon: '⬓' },
]

export function ViewControls() {
  const pedir = useView((s) => s.pedir)
  return (
    <div className="hud-glass rounded-[12px] p-1 flex flex-col gap-1">
      {BOTOES.map((b) => (
        <button
          key={b.v}
          onClick={() => pedir(b.v)}
          title={b.rotulo}
          aria-label={b.rotulo}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-[12px] transition-colors hover:bg-white/5"
          style={{ color: color.textMuted }}
        >
          <span aria-hidden style={{ fontSize: 14, width: 16, textAlign: 'center', color: color.accentCool }}>
            {b.icon}
          </span>
          <span className="hidden sm:inline">{b.rotulo}</span>
        </button>
      ))}
    </div>
  )
}

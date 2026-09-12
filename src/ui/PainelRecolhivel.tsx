import { useId, useState, type ComponentProps } from 'react'
import { color } from '../design/tokens'

/** Mantém os controles montados para preservar entradas e o andamento do ensaio. */
export function PainelRecolhivel({ titulo, children, className, ...props }: ComponentProps<'div'> & { titulo: string }) {
  const [minimizado, setMinimizado] = useState(false)
  const id = useId()
  return (
    <div {...props} className={className?.replace('pointer-events-auto', 'pointer-events-none')}>
      <button
        type="button"
        aria-expanded={!minimizado}
        aria-controls={id}
        aria-label={`${minimizado ? 'Mostrar' : 'Minimizar'} ${titulo}`}
        onClick={() => setMinimizado(v => !v)}
        className="pointer-events-auto hud-glass rounded-[10px] px-3 py-2 mb-2 text-[12px] font-medium block"
        style={{ color: color.accentCool }}
      >
        <span aria-hidden="true">{minimizado ? '▴' : '▾'} </span>
        {minimizado ? `Mostrar ${titulo}` : 'Minimizar'}
      </button>
      <div id={id} hidden={minimizado} className="pointer-events-auto">
        <div className="flex flex-col gap-3 max-h-[calc(100dvh-140px)] overflow-y-auto hud-scroll">
          {children}
        </div>
      </div>
    </div>
  )
}

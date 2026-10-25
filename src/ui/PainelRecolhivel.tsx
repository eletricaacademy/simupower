import { useId, useState, type ComponentProps } from 'react'
import { color } from '../design/tokens'
import { useTranslation } from 'react-i18next'

/** Mantém os controles montados para preservar entradas e o andamento do ensaio. */
export function PainelRecolhivel({ titulo, children, className, ...props }: ComponentProps<'div'> & { titulo: string }) {
  const [minimizado, setMinimizado] = useState(false)
  const id = useId()
  const { t } = useTranslation()
  return (
    <div {...props} className={className?.replace('pointer-events-auto', 'pointer-events-none')}>
      <button
        type="button"
        aria-expanded={!minimizado}
        aria-controls={id}
        aria-label={minimizado ? t('painel.mostrar', { titulo }) : t('painel.minimizarRotulo', { titulo })}
        onClick={() => setMinimizado(v => !v)}
        className="pointer-events-auto hud-glass rounded-[10px] px-3 py-2 mb-2 text-[12px] font-medium block"
        style={{ color: color.accentCool }}
      >
        <span aria-hidden="true">{minimizado ? '▴' : '▾'} </span>
        {minimizado ? t('painel.mostrar', { titulo }) : t('painel.minimizar')}
      </button>
      <div id={id} hidden={minimizado} className="pointer-events-auto">
        <div className="flex flex-col gap-3 max-h-[calc(100dvh-140px)] overflow-y-auto hud-scroll">
          {children}
        </div>
      </div>
    </div>
  )
}

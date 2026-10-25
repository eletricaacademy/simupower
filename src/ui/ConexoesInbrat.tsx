import { color } from '../design/tokens'
import { useTranslation } from 'react-i18next'

/** Manual INMD1 PRO, pp. 10 e 13: cores das vias não definem a polaridade das garras. */
export function ConexoesInbrat() {
  const { t } = useTranslation()
  return <details className="my-2 text-[11px] leading-snug" style={{ color: color.textMuted }}>
    <summary className="cursor-pointer py-1" style={{ color: color.accentCool }}>{t('inbrat.titulo')}</summary>
    <div className="space-y-1 pt-1">
      <p>{t('inbrat.vias')}</p>
      <p>{t('inbrat.garras')}</p>
      <p>{t('inbrat.sentido')}</p>
    </div>
  </details>
}

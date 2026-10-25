import { color } from '../design/tokens'
import { useTranslation } from 'react-i18next'

export function BotaoTestesEmLote({ habilitado, executar, detalhe }: { habilitado: boolean; executar: () => void; detalhe: string }) {
  const { t } = useTranslation()
  return <div className="my-3 rounded-[10px] p-2" style={{ border: `1px solid ${color.hairline}` }}>
    <button type="button" disabled={!habilitado} onClick={executar}
      className="w-full rounded-[8px] py-2 px-2 text-[12px] font-semibold disabled:opacity-50"
      style={{ background: color.surface, color: color.accentCool }}>
      {t('lote.executar')}
    </button>
    <p className="text-[11px] mt-1 leading-snug" style={{ color: color.textMuted }}>{t('lote.opcional')} {detalhe}</p>
  </div>
}

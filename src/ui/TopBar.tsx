import { useSim } from '../sim/store'
import { color } from '../design/tokens'
import { useTranslation } from 'react-i18next'

/**
 * TopBar — barra superior fina: nome do equipamento, estado de segurança
 * e tensão de ensaio. Sem peso visual; informa o contexto do palco.
 */
export function TopBar() {
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  const tensao = useSim((s) => s.tensao)
  const energizado = useSim((s) => s.energizado)
  const lotoOk = useSim((s) => !!s.cumpridos['s1-loto'])
  const { t } = useTranslation('isolamento')

  const seguranca = energizado
    ? { txt: t('seguranca.energizado'), cor: color.accent }
    : lotoOk
      ? { txt: t('seguranca.bloqueado'), cor: color.status.pass }
      : { txt: t('seguranca.verificar'), cor: color.status.marginal }

  return (
    <div className="hud-glass rounded-[12px] px-4 py-2 flex items-center gap-4 max-w-[94vw]">
      <div className="flex items-center gap-2">
        <div className="leading-tight">
          <div className="font-display font-semibold text-[13px]" style={{ color: color.text }}>
            {equipamento.nome}
          </div>
          <div className="text-[10px]" style={{ color: color.textFaint }}>
            {ensaio.nome} · {ensaio.norma}
          </div>
        </div>
      </div>

      <div className="h-7 w-px" style={{ background: color.hairline }} />

      <div className="flex items-center gap-1.5">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: seguranca.cor, boxShadow: `0 0 8px ${seguranca.cor}` }}
        />
        <span className="font-mono text-[11px]" style={{ color: seguranca.cor }}>
          {seguranca.txt}
        </span>
      </div>

      <div className="h-7 w-px hidden sm:block" style={{ background: color.hairline }} />

      <div className="hidden sm:flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: color.textFaint }}>
          {t('seguranca.tensao')}
        </span>
        <span className="font-mono text-[12px]" style={{ color: color.accentCool }}>
          {tensao} V
        </span>
      </div>
    </div>
  )
}

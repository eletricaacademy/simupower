import { useEffect } from 'react'
import { somVoz, pararVoz } from './sons'
import { color } from '../design/tokens'
import { Trans, useTranslation } from 'react-i18next'

/**
 * BemVindo — pop-up de boas-vindas ao entrar nos módulos de subestação.
 * Toca a locução de boas-vindas (/sounds/voz/bem-vindo.mp3) e apresenta o
 * contexto. Ao fechar, segue o fluxo normal.
 */
export function BemVindo({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  useEffect(() => {
    somVoz('bem-vindo')
    return () => pararVoz()
  }, [])

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto p-4"
      style={{ background: 'rgba(7,10,14,0.62)', backdropFilter: 'blur(4px)' }}
    >
      <div className="hud-glass rounded-[16px] p-6 w-[460px] max-w-[92vw] text-center">
        <div className="text-[34px] mb-2" aria-hidden>
          🎧
        </div>
        <h2 className="font-display font-bold text-[20px] mb-3" style={{ color: color.text }}>
          {t('bemVindo.titulo')}
        </h2>
        <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: color.textMuted }}>
          <Trans i18nKey="bemVindo.texto" components={{ b: <b /> }} />
          <br />
          <span style={{ color: color.textFaint }}>{t('bemVindo.dica')}</span>
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[15px]"
          style={{ background: color.accent, color: '#0B0F14' }}
        >
          {t('bemVindo.comecar')}
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { somVoz, pararVoz } from './sons'
import { asset } from '../lib/asset'
import { color } from '../design/tokens'
import { Trans, useTranslation } from 'react-i18next'

/**
 * ArcIntro — abertura do estudo de Arco Elétrico em 3 fases:
 *  1) pergunta inicial (com locução) — situação real / NR-10 2026 → Sim/Não
 *  2) vídeo do acidente (vestimentas inadequadas)
 *  3) objetivo (com locução): dimensionar a vestimenta de proteção → entra na sim
 */
export function ArcIntro({ onClose, onCancel }: { onClose: () => void; onCancel: () => void }) {
  const [fase, setFase] = useState<'intro' | 'video' | 'vestimenta'>('intro')
  const { t } = useTranslation(['arco', 'common'])

  // locução por fase (vídeo tem áudio próprio → silencia a voz)
  useEffect(() => {
    if (fase === 'intro') somVoz('arco-intro')
    else if (fase === 'vestimenta') somVoz('arco-vestimenta')
    else pararVoz()
  }, [fase])
  useEffect(() => () => pararVoz(), [])

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto p-4"
      style={{ background: 'rgba(7,10,14,0.8)', backdropFilter: 'blur(4px)' }}
    >
      {fase === 'intro' && (
        <div className="hud-glass rounded-[16px] p-6 w-[480px] max-w-[92vw] text-center">
          <div className="text-[34px] mb-2" aria-hidden>
            ⚠️
          </div>
          <h2 className="font-display font-bold text-[20px] mb-3" style={{ color: color.text }}>
            {t('intro.titulo')}
          </h2>
          <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: color.textMuted }}>
            <Trans t={t} i18nKey="intro.texto" components={{ b: <b /> }} />
            <br />
            {t('intro.pergunta')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                pararVoz()
                onCancel()
              }}
              className="px-5 py-2.5 rounded-[10px] text-[14px] font-medium"
              style={{ background: '#0c1117', color: color.textMuted, border: `1px solid ${color.hairline}` }}
            >
              {t('common:mobile.nao')}
            </button>
            <button
              onClick={() => setFase('video')}
              className="flex-1 py-2.5 rounded-[10px] font-display font-semibold text-[15px]"
              style={{ background: color.accent, color: '#0B0F14' }}
            >
              {t('intro.sim')}
            </button>
          </div>
        </div>
      )}

      {fase === 'video' && (
        <div className="hud-glass rounded-[16px] p-5 w-[760px] max-w-[94vw]">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: color.accent }}>
            {t('intro.investigacao')}
          </div>
          <h2 className="font-display font-bold text-[20px] mb-3" style={{ color: color.text }}>
            {t('intro.investigar')}
          </h2>
          <div className="rounded-[12px] overflow-hidden mb-4" style={{ border: `1px solid ${color.hairline}`, background: '#000' }}>
            <video
              src={asset('videos/arco-intro.mp4')}
              controls
              autoPlay
              playsInline
              onEnded={() => setFase('vestimenta')}
              className="w-full block"
              style={{ maxHeight: '56vh' }}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setFase('vestimenta')}
              className="px-5 py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
              style={{ background: color.accent, color: '#0B0F14' }}
            >
              {t('intro.continuar')}
            </button>
          </div>
        </div>
      )}

      {fase === 'vestimenta' && (
        <div className="hud-glass rounded-[16px] p-6 w-[480px] max-w-[92vw] text-center">
          <div className="text-[34px] mb-2" aria-hidden>
            🧥
          </div>
          <h2 className="font-display font-bold text-[20px] mb-3" style={{ color: color.text }}>
            {t('intro.vestimentaTitulo')}
          </h2>
          <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: color.textMuted }}>
            <Trans t={t} i18nKey="intro.vestimentaTexto" components={{ b: <b /> }} />
          </p>
          <button
            onClick={() => {
              pararVoz()
              onClose()
            }}
            className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[15px]"
            style={{ background: color.accent, color: '#0B0F14' }}
          >
            {t('intro.comecar')}
          </button>
        </div>
      )}
    </div>
  )
}

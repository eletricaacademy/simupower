import { useState, useEffect } from 'react'
import { somVoz, pararVoz } from './sons'
import { color } from '../design/tokens'

/**
 * ArcIntro — abertura do estudo de Arco Elétrico em 3 fases:
 *  1) pergunta inicial (com locução) — situação real / NR-10 2026 → Sim/Não
 *  2) vídeo do acidente (vestimentas inadequadas)
 *  3) objetivo (com locução): dimensionar a vestimenta de proteção → entra na sim
 */
export function ArcIntro({ onClose, onCancel }: { onClose: () => void; onCancel: () => void }) {
  const [fase, setFase] = useState<'intro' | 'video' | 'vestimenta'>('intro')

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
            Simulação de situação real
          </h2>
          <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: color.textMuted }}>
            Vamos fazer uma simulação de uma situação real. Com a <b>nova NR-10 (2026)</b>, passou a ser
            necessária uma <b>análise mais criteriosa</b> do risco de arco elétrico.
            <br />
            Deseja prosseguir?
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
              Não
            </button>
            <button
              onClick={() => setFase('video')}
              className="flex-1 py-2.5 rounded-[10px] font-display font-semibold text-[15px]"
              style={{ background: color.accent, color: '#0B0F14' }}
            >
              Sim, prosseguir ›
            </button>
          </div>
        </div>
      )}

      {fase === 'video' && (
        <div className="hud-glass rounded-[16px] p-5 w-[760px] max-w-[94vw]">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: color.accent }}>
            Investigação de acidente
          </div>
          <h2 className="font-display font-bold text-[20px] mb-3" style={{ color: color.text }}>
            Vamos investigar para evitar este tipo de acidente
          </h2>
          <div className="rounded-[12px] overflow-hidden mb-4" style={{ border: `1px solid ${color.hairline}`, background: '#000' }}>
            <video
              src="videos/arco-intro.mp4"
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
              Continuar ›
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
            Dimensionar a vestimenta de proteção
          </h2>
          <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: color.textMuted }}>
            O acidente mostra o risco de trabalhar sem a vestimenta adequada. Agora vamos{' '}
            <b>dimensionar corretamente a vestimenta de proteção (EPI) contra arco</b> para este cenário,
            calculando a energia incidente e a categoria de risco.
          </p>
          <button
            onClick={() => {
              pararVoz()
              onClose()
            }}
            className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[15px]"
            style={{ background: color.accent, color: '#0B0F14' }}
          >
            Começar a análise
          </button>
        </div>
      )}
    </div>
  )
}

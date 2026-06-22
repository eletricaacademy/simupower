import { useEffect } from 'react'
import { somVoz, pararVoz } from './sons'
import { color } from '../design/tokens'

/**
 * BemVindo — pop-up de boas-vindas ao entrar nos módulos de subestação.
 * Toca a locução de boas-vindas (/sounds/voz/bem-vindo.mp3) e apresenta o
 * contexto. Ao fechar, segue o fluxo normal.
 */
export function BemVindo({ onClose }: { onClose: () => void }) {
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
          Bem-vindo à simulação
        </h2>
        <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: color.textMuted }}>
          O som ambiente que você ouve é o <b>ruído real de uma subestação</b> em operação. Ao longo do
          procedimento, alguns <b>efeitos sonoros</b> vão acontecer e um <b>instrutor</b> guiará você em
          cada etapa, da forma mais didática possível.
          <br />
          <span style={{ color: color.textFaint }}>Aumente o som para uma melhor experiência.</span>
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[15px]"
          style={{ background: color.accent, color: '#0B0F14' }}
        >
          Começar
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useIsPhone } from './useIsPhone'
import { useSim } from '../sim/store'
import { asset } from '../lib/asset'
import { color } from '../design/tokens'

/**
 * AvisoMobile — ao abrir QUALQUER simulação no celular, recomenda o desktop para
 * a melhor experiência (espaço, instrumentos e desempenho do 3D). O usuário pode
 * seguir no celular normalmente. Só aparece no mobile (useIsPhone) e uma vez por
 * abertura de simulação (o componente remonta a cada entrada vinda do menu).
 */
export function AvisoMobile() {
  const phone = useIsPhone()
  const setView = useSim((s) => s.setView)
  const [aberto, setAberto] = useState(true)
  if (!phone || !aberto) return null

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-5 pointer-events-auto"
      style={{ background: 'rgba(7,10,14,0.86)', backdropFilter: 'blur(5px)' }}
    >
      <div className="hud-glass rounded-[18px] p-6 w-[400px] max-w-[92vw] text-center">
        <img
          src={asset('brand/logo-horizontal.png')}
          alt="SimuPower"
          className="h-7 w-auto mx-auto mb-4 select-none"
          style={{ opacity: 0.92 }}
          aria-hidden
        />
        <div
          className="mx-auto mb-4 grid place-items-center rounded-full"
          style={{ width: 56, height: 56, background: color.accent + '1f', border: `1px solid ${color.accent}55` }}
        >
          <IconDesktop />
        </div>
        <h2 className="font-display font-bold text-[19px] mb-2" style={{ color: color.text }}>
          Melhor no computador
        </h2>
        <p className="text-[13px] leading-relaxed mb-5" style={{ color: color.textMuted }}>
          Esta simulação 3D foi pensada para o <b style={{ color: color.text }}>desktop</b> — há mais
          espaço para o equipamento e os instrumentos, e o desempenho fica melhor. Você pode continuar
          no celular mesmo assim.
        </p>
        <button
          onClick={() => setAberto(false)}
          className="w-full py-3 rounded-[12px] font-display font-semibold text-[15px]"
          style={{ background: color.accent, color: '#0B0F14', boxShadow: `0 0 22px ${color.accent}44` }}
        >
          Continuar no celular
        </button>
        <button
          onClick={() => setView('menu')}
          className="w-full mt-2 py-2.5 rounded-[12px] text-[13px] font-medium"
          style={{ background: 'transparent', color: color.textMuted, border: `1px solid ${color.hairline}` }}
        >
          Voltar ao menu
        </button>
      </div>
    </div>
  )
}

function IconDesktop() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

import { color } from '../design/tokens'

/**
 * Apresentador — avatar estilizado (técnico de capacete) que "fala" enquanto a
 * locução toca (boca anima + leve balanço). `falando` controla a animação.
 * `onReplay` repete a narração da etapa.
 */
export function Apresentador({ falando, onReplay }: { falando: boolean; onReplay: () => void }) {
  return (
    <div
      className={`hud-glass rounded-[14px] p-2.5 flex items-center gap-2.5 ${falando ? 'voz-falando' : ''}`}
      style={{ width: 200 }}
    >
      <div className="relative" style={{ width: 52, height: 52, flex: '0 0 auto' }}>
        <svg viewBox="0 0 52 52" width="52" height="52" className="voz-cabeca">
          {/* ombros / uniforme */}
          <path d="M6 52 C6 42 14 38 26 38 C38 38 46 42 46 52 Z" fill="#1f6f8b" />
          <path d="M6 52 C6 42 14 38 26 38 C38 38 46 42 46 52 Z" fill="none" stroke="#0c1117" strokeWidth="1" />
          {/* pescoço */}
          <rect x="22" y="33" width="8" height="8" rx="2" fill="#d8a07a" />
          {/* rosto */}
          <ellipse cx="26" cy="26" rx="11" ry="12" fill="#e7b08a" />
          {/* capacete */}
          <path d="M13 23 C13 13 18 8 26 8 C34 8 39 13 39 23 Z" fill={color.accent} />
          <rect x="12" y="22" width="28" height="3.5" rx="1.75" fill={color.accent} />
          <rect x="24.5" y="9" width="3" height="13" fill="#d9871a" opacity="0.7" />
          {/* olhos */}
          <circle cx="21.5" cy="25" r="1.5" fill="#1a1d22" />
          <circle cx="30.5" cy="25" r="1.5" fill="#1a1d22" />
          {/* boca (anima ao falar) */}
          <rect className="voz-boca" x="22" y="30" width="8" height="3.4" rx="1.7" fill="#7a3b32" />
        </svg>
        {/* indicador de fala */}
        {falando && (
          <span
            className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full"
            style={{ background: color.status.pass, boxShadow: `0 0 8px ${color.status.pass}`, border: '2px solid #11161d' }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-display font-semibold text-[12px] leading-tight" style={{ color: color.text }}>
          Instrutor
        </div>
        <div className="text-[10px] leading-tight" style={{ color: falando ? color.status.pass : color.textFaint }}>
          {falando ? 'narrando…' : 'locução'}
        </div>
      </div>

      <button
        onClick={onReplay}
        aria-label="Repetir narração"
        className="text-[14px] leading-none px-1.5 py-1 rounded-[8px]"
        style={{ color: color.accentCool, border: `1px solid ${color.hairline}` }}
      >
        🔁
      </button>
    </div>
  )
}

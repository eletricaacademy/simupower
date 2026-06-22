import { useEffect, useState, type ReactNode } from 'react'
import { useOrientacao } from '../sim/orientStore'
import { color } from '../design/tokens'

/**
 * LandscapeFrame — orientação da simulação no mobile.
 *
 * Padrão 'horizontal': se o aparelho está em RETRATO, mostra uma tela limpa
 * pedindo para girar o celular (nada de conteúdo torto). Ao girar para
 * paisagem, o app aparece nativo (layout largo, eventos 3D corretos).
 * O usuário pode optar por 'vertical' a qualquer momento pelo switch.
 */
function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('orientationchange', on)
    }
  }, [])
  return vp
}

export function LandscapeFrame({ children }: { children: ReactNode }) {
  const orientacao = useOrientacao((s) => s.orientacao)
  const alternar = useOrientacao((s) => s.alternar)
  const { w, h } = useViewport()
  const portrait = h > w
  const pedirGiro = orientacao === 'horizontal' && portrait

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {children}

      {pedirGiro && <RotatePrompt onVertical={alternar} />}

      {!pedirGiro && (
        <button
          onClick={alternar}
          aria-label={orientacao === 'horizontal' ? 'Usar na vertical' : 'Usar na horizontal'}
          title={orientacao === 'horizontal' ? 'Vertical' : 'Horizontal'}
          style={switchBtnStyle}
        >
          <IconRotate size={16} />
        </button>
      )}
    </div>
  )
}

const switchBtnStyle: React.CSSProperties = {
  position: 'fixed',
  left: 10,
  bottom: 10,
  zIndex: 70,
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 10,
  border: `1px solid ${color.hairline}`,
  background: color.surfaceGlass,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: color.textMuted,
  cursor: 'pointer',
}

function RotatePrompt({ onVertical }: { onVertical: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: `radial-gradient(120% 100% at 50% 0%, #141B24 0%, ${color.viewport} 70%)`,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 320 }}>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 22 }}>
          <div className="rotate-hint" style={{ color: color.accent }}>
            <PhoneRotate />
          </div>
        </div>
        <h2
          style={{
            fontFamily: 'Space Grotesk, Inter, sans-serif',
            fontWeight: 700,
            fontSize: 22,
            color: color.text,
            margin: '0 0 8px',
          }}
        >
          Gire o celular
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: color.textMuted, margin: '0 0 26px' }}>
          A simulação 3D fica muito melhor no modo <b style={{ color: color.text }}>paisagem</b> —
          mais espaço para o equipamento e os instrumentos.
        </p>
        <button
          onClick={onVertical}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: `1px solid ${color.hairline}`,
            color: color.textMuted,
            borderRadius: 10,
            padding: '11px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <IconRotate size={15} /> Continuar na vertical
        </button>
      </div>

      <style>{`
        @keyframes spp-rot { 0%,18% { transform: rotate(0deg) } 50%,68% { transform: rotate(-90deg) } 100% { transform: rotate(-90deg) } }
        .rotate-hint { animation: spp-rot 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .rotate-hint { animation: none; transform: rotate(-90deg); } }
      `}</style>
    </div>
  )
}

function PhoneRotate() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  )
}

function IconRotate({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </svg>
  )
}

import { useEffect, useState, type ReactNode, type CSSProperties } from 'react'
import { useOrientacao } from '../sim/orientStore'
import { color } from '../design/tokens'

/**
 * LandscapeFrame — força a simulação em paisagem no celular.
 *
 * Quando a preferência é 'horizontal' e o aparelho está em retrato (mais alto
 * que largo), rotaciona o conteúdo 90°. O `transform` no container vira o bloco
 * de contenção dos filhos `position:fixed`/`absolute`, então TODO o HUD gira
 * junto com o palco 3D — nada fica "torto". O botão de switch alterna o modo.
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
  const girar = orientacao === 'horizontal' && portrait

  const frameStyle: CSSProperties = girar
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: h,
        height: w,
        transformOrigin: 'top left',
        transform: `translateX(${w}px) rotate(90deg)`,
        overflow: 'hidden',
        background: color.viewport,
      }
    : { position: 'absolute', inset: 0, overflow: 'hidden' }

  return (
    <div style={frameStyle}>
      {children}
      <button
        onClick={alternar}
        aria-label={girar ? 'Mudar para vertical' : 'Mudar para horizontal'}
        title={girar ? 'Vertical' : 'Horizontal'}
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 70,
          width: 34,
          height: 34,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 10,
          border: `1px solid ${color.hairline}`,
          background: color.surfaceGlass,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: color.textMuted,
          cursor: 'pointer',
        }}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 4v5h-5" />
        </svg>
      </button>
    </div>
  )
}

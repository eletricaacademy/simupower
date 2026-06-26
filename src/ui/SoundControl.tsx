import { useState } from 'react'
import { useAudio } from '../sim/audioStore'
import { useIsPhone } from './useIsPhone'
import { color } from '../design/tokens'

/**
 * SoundControl — controle de som permanente na tela: mudo + volume.
 *
 * Desktop: ícone de mudo + slider inline.
 * Celular: só o ícone na barra (economiza largura); tocar abre um popover com
 * o mudo + o slider — assim o volume continua acessível e funcional no mobile.
 */
export function SoundControl() {
  const volume = useAudio((s) => s.volume)
  const mudo = useAudio((s) => s.mudo)
  const setVolume = useAudio((s) => s.setVolume)
  const toggleMudo = useAudio((s) => s.toggleMudo)
  const phone = useIsPhone()
  const [aberto, setAberto] = useState(false)
  const val = mudo ? 0 : volume
  const icone = mudo || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'

  const Slider = (
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={val}
      onChange={(e) => setVolume(Number(e.target.value))}
      aria-label="Volume"
      className="w-24 accent-current"
      style={{ accentColor: color.accent }}
    />
  )

  // Celular: ícone na barra + popover com mudo e slider.
  if (phone) {
    return (
      <div className="relative pointer-events-auto">
        <button
          onClick={() => setAberto((v) => !v)}
          aria-label="Som e volume"
          aria-expanded={aberto}
          className="hud-glass rounded-[10px] px-3 py-2 text-[15px] leading-none"
          style={{ color: aberto ? color.accent : mudo ? color.textFaint : color.accent }}
        >
          {icone}
        </button>
        {aberto && (
          <div
            className="absolute right-0 mt-1.5 hud-glass rounded-[12px] px-2.5 py-2 flex items-center gap-2"
            style={{ zIndex: 60 }}
          >
            <button
              onClick={toggleMudo}
              aria-label={mudo ? 'Ativar som' : 'Silenciar'}
              className="text-[15px] leading-none"
              style={{ color: mudo ? color.textFaint : color.accent }}
            >
              {icone}
            </button>
            {Slider}
          </div>
        )}
      </div>
    )
  }

  // Desktop: mudo + slider inline.
  return (
    <div className="hud-glass rounded-[12px] px-2.5 py-1.5 flex items-center gap-2 pointer-events-auto">
      <button
        onClick={toggleMudo}
        aria-label={mudo ? 'Ativar som' : 'Silenciar'}
        className="text-[15px] leading-none"
        style={{ color: mudo ? color.textFaint : color.accent }}
      >
        {icone}
      </button>
      {Slider}
    </div>
  )
}

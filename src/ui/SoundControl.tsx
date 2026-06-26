import { useAudio } from '../sim/audioStore'
import { useIsPhone } from './useIsPhone'
import { color } from '../design/tokens'

/**
 * SoundControl — controle de som permanente na tela: botão mudo + volume.
 * Usado nos módulos de subestação (inspeção e desenergização).
 *
 * No celular (useIsPhone) some o slider e fica só o ícone de mudo (toque) —
 * o slider rouba muita largura da barra superior em tela estreita.
 */
export function SoundControl() {
  const volume = useAudio((s) => s.volume)
  const mudo = useAudio((s) => s.mudo)
  const setVolume = useAudio((s) => s.setVolume)
  const toggleMudo = useAudio((s) => s.toggleMudo)
  const phone = useIsPhone()
  const val = mudo ? 0 : volume

  return (
    <div className="hud-glass rounded-[12px] px-2.5 py-1.5 flex items-center gap-2 pointer-events-auto">
      <button
        onClick={toggleMudo}
        aria-label={mudo ? 'Ativar som' : 'Silenciar'}
        className="text-[15px] leading-none"
        style={{ color: mudo ? color.textFaint : color.accent }}
      >
        {mudo || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
      </button>
      {!phone && (
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
      )}
    </div>
  )
}

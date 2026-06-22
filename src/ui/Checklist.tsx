import { useSim } from '../sim/store'
import { color } from '../design/tokens'

/**
 * Checklist — visão geral dos 7 passos com estado (cumprido/atual/bloqueado).
 * Permite revisitar um passo já alcançado. Colapsável no mobile via Hud.
 */
export function Checklist() {
  const ensaio = useSim((s) => s.ensaio)
  const cumpridos = useSim((s) => s.cumpridos)
  const passoIndex = useSim((s) => s.passoIndex)
  const irParaPasso = useSim((s) => s.irParaPasso)

  return (
    <ol className="hud-scroll flex flex-col gap-1 max-h-[42vh] overflow-y-auto pr-1">
      {ensaio.steps.map((s, i) => {
        const feito = !!cumpridos[s.id]
        const atual = i === passoIndex
        const alcancavel = feito || i <= passoIndex
        return (
          <li key={s.id}>
            <button
              onClick={() => alcancavel && irParaPasso(i)}
              disabled={!alcancavel}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px] text-left transition-colors"
              style={{
                background: atual ? '#0c1117' : 'transparent',
                border: `1px solid ${atual ? color.accent + '66' : 'transparent'}`,
                cursor: alcancavel ? 'pointer' : 'default',
              }}
            >
              <span
                className="flex items-center justify-center w-5 h-5 rounded-full font-mono text-[10px] shrink-0"
                style={{
                  background: feito ? color.status.pass + '22' : atual ? color.accent : '#0c1117',
                  color: feito ? color.status.pass : atual ? '#0B0F14' : color.textFaint,
                  border: `1px solid ${feito ? color.status.pass + '66' : atual ? color.accent : color.hairline}`,
                  fontWeight: atual ? 700 : 400,
                }}
              >
                {feito ? '✓' : i + 1}
              </span>
              <span
                className="text-[12px] truncate"
                style={{ color: atual ? color.text : feito ? color.textMuted : color.textFaint }}
              >
                {s.titulo}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

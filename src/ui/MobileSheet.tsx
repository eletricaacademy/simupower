import { useState, type ReactNode } from 'react'
import { useSim } from '../sim/store'
import { color } from '../design/tokens'

/**
 * MobileSheet — dock inferior padrão das simulações no celular. Envolve as abas
 * (passadas em `tabs`) e o conteúdo do card (children), e acrescenta:
 *  • Minimizar (▾) → recolhe o painel num botão "▴ Mostrar painel", liberando a
 *    cena 3D por inteiro.
 *  • Opções (⋯) → Reiniciar / Sair da simulação, com confirmação (evita perder
 *    o progresso por toque acidental).
 *
 * O card (children) fica em .hud-dock-body, que o tier "telefone" do index.css
 * compacta (largura cheia, fontes/altura menores). Só aparece no layout mobile
 * (md:hidden); o desktop usa os painéis próprios de cada HUD.
 */
export function MobileSheet({
  tabs,
  onReiniciar,
  children,
}: {
  tabs?: ReactNode
  /** ação de reiniciar do HUD (reset dos stores). Sem isto, só "Sair" aparece. */
  onReiniciar?: () => void
  children: ReactNode
}) {
  const [minimizado, setMinimizado] = useState(false)
  const [opcoes, setOpcoes] = useState(false)
  const [confirmar, setConfirmar] = useState<null | 'sair' | 'reiniciar'>(null)
  const setView = useSim((s) => s.setView)

  const fecharOpcoes = () => {
    setOpcoes(false)
    setConfirmar(null)
  }

  return (
    <div
      className="md:hidden absolute inset-x-0 bottom-0 pointer-events-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* popover de opções (acima das abas) */}
      {opcoes && !minimizado && (
        <div className="px-3 mb-2 flex justify-center">
          <div className="hud-glass rounded-[12px] p-2 w-full">
            {confirmar ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] leading-snug flex-1" style={{ color: color.text }}>
                  {confirmar === 'sair'
                    ? 'Sair da simulação? O progresso atual será perdido.'
                    : 'Reiniciar do começo? O progresso atual será perdido.'}
                </span>
                <button
                  onClick={() => {
                    if (confirmar === 'sair') setView('menu')
                    else onReiniciar?.()
                    fecharOpcoes()
                  }}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] font-display font-semibold shrink-0"
                  style={{ background: confirmar === 'sair' ? color.status.fail : color.accent, color: '#0B0F14' }}
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmar(null)}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] shrink-0"
                  style={{ background: '#0c1117', color: color.textMuted, border: `1px solid ${color.hairline}` }}
                >
                  Não
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                {onReiniciar && (
                  <button
                    onClick={() => setConfirmar('reiniciar')}
                    className="flex-1 py-2 rounded-[8px] text-[12px] font-medium"
                    style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}
                  >
                    ↺ Reiniciar
                  </button>
                )}
                <button
                  onClick={() => setConfirmar('sair')}
                  className="flex-1 py-2 rounded-[8px] text-[12px] font-medium"
                  style={{ background: '#0c1117', color: color.status.fail, border: `1px solid ${color.hairline}` }}
                >
                  ✕ Sair da simulação
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {minimizado ? (
        <div className="px-3 pb-2 flex justify-center">
          <button
            onClick={() => setMinimizado(false)}
            className="hud-glass rounded-full px-4 py-2 text-[12px] font-medium flex items-center gap-1.5"
            style={{ color: color.text }}
          >
            <span aria-hidden style={{ color: color.accent }}>
              ▴
            </span>
            Mostrar painel
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 px-3 mb-2">
            {tabs}
            {!tabs && <div className="flex-1" />}
            <button
              onClick={() => {
                setOpcoes((v) => !v)
                setConfirmar(null)
              }}
              aria-label="Opções da simulação"
              className="hud-glass rounded-[10px] px-2.5 py-2 text-[13px] leading-none shrink-0"
              style={{ color: opcoes ? color.accent : color.textMuted }}
            >
              ⋯
            </button>
            <button
              onClick={() => {
                setMinimizado(true)
                fecharOpcoes()
              }}
              aria-label="Minimizar painel"
              className="hud-glass rounded-[10px] px-2.5 py-2 text-[13px] leading-none shrink-0"
              style={{ color: color.textMuted }}
            >
              ▾
            </button>
          </div>
          <div className="hud-dock-body px-3 pb-3 flex justify-center">{children}</div>
        </>
      )}
    </div>
  )
}

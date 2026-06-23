import type { ReactNode } from 'react'
import { useSim } from '../sim/store'
import { ViewControls } from './ViewControls'
import { asset } from '../lib/asset'
import { color } from '../design/tokens'

/**
 * HudTopBar — barra superior padrão de TODAS as simulações: retorno ao menu +
 * logo SimuPower (à esq.), título (centro) e os controles à direita (vistas de
 * câmera, e o que cada HUD passar em `right`: som, ⚙, etc.). Mantém a tela limpa
 * deixando o 3D em destaque.
 */
export function HudTopBar({
  onConfig,
  configAberto,
  right,
  views = true,
}: {
  onConfig?: () => void
  configAberto?: boolean
  /** controles extras (ex.: SoundControl) à esquerda do ⚙ */
  right?: ReactNode
  /** mostrar os controles de vista de câmera (default true) */
  views?: boolean
}) {
  const setView = useSim((s) => s.setView)
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  return (
    <div
      className="absolute top-0 inset-x-0 flex items-center gap-2 px-3 pointer-events-none"
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
    >
      {/* esquerda: voltar ao menu + logo SimuPower */}
      <button
        onClick={() => setView('menu')}
        aria-label="Voltar ao menu principal"
        className="hud-glass rounded-[10px] px-3 py-2 text-[12.5px] pointer-events-auto flex items-center gap-1.5 shrink-0"
        style={{ color: color.text }}
      >
        <span aria-hidden style={{ color: color.accent }}>‹</span> Menu
      </button>
      <img
        src={asset('brand/logo-horizontal.png')}
        alt="SimuPower"
        className="h-7 w-auto shrink-0 hidden sm:block select-none"
        style={{ opacity: 0.92 }}
        aria-hidden
      />

      {/* centro: título compacto */}
      <div className="flex-1 min-w-0 flex justify-center">
        <div className="hud-glass rounded-[10px] px-3 py-1.5 flex items-baseline gap-2 max-w-full overflow-hidden">
          <span className="font-display font-semibold text-[12px] truncate" style={{ color: color.text }}>
            {equipamento.nome}
          </span>
          <span className="text-[10px] truncate hidden lg:inline" style={{ color: color.textFaint }}>
            {ensaio.norma}
          </span>
        </div>
      </div>

      {/* direita: controles */}
      <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
        {views && <ViewControls compact />}
        {right}
        {onConfig && (
          <button
            onClick={onConfig}
            aria-label="Configurações"
            className="hud-glass rounded-[10px] px-3 py-2 text-[14px]"
            style={{ color: configAberto ? color.accent : color.textMuted }}
          >
            ⚙
          </button>
        )}
      </div>
    </div>
  )
}

import { useSim } from '../sim/store'
import { useOrchestrator } from '../sim/orchestrator'
import { color } from '../design/tokens'
import { formatarTempo } from './format'

/**
 * GuidedPanel — passo atual + ação. Âncora do procedimento guiado.
 * O botão de ação é a única "ação principal" em âmbar.
 */
export function GuidedPanel() {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const tensao = useSim((s) => s.tensao)
  const tempo = useSim((s) => s.tempo)
  const duracao = useSim((s) => s.ensaio.duracaoS)
  const setTensao = useSim((s) => s.setTensao)
  const { passo, habilitado, jaCumprido, rodando, isTeste, executarAcao } = useOrchestrator()

  if (!passo) return null
  const total = ensaio.steps.length
  const progressoTeste = isTeste && rodando ? tempo / duracao : 0

  return (
    <div className="guided-panel hud-glass rounded-[14px] p-4 w-[352px] max-w-[88vw]">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="font-mono text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: '#0c1117', color: color.accent, border: `1px solid ${color.hairline}` }}
        >
          PASSO {passoIndex + 1}/{total}
        </span>
        {passo.norma && (
          <span className="text-[10px]" style={{ color: color.textFaint }}>
            {passo.norma}
          </span>
        )}
      </div>

      <h2 className="font-display font-semibold text-[18px] mb-1" style={{ color: color.text }}>
        {passo.titulo}
      </h2>
      <p className="text-[13px] leading-snug mb-3" style={{ color: color.textMuted }}>
        {passo.descricao}
      </p>

      {/* controle de tensão, quando o passo pede */}
      {passo.control === 'voltage' && (
        <div className="flex gap-1.5 mb-3" role="radiogroup" aria-label="Tensão de ensaio">
          {ensaio.tensoes.map((v) => {
            const ativo = v === tensao
            return (
              <button
                key={v}
                role="radio"
                aria-checked={ativo}
                onClick={() => setTensao(v as 250 | 500 | 1000 | 2500)}
                className="flex-1 font-mono text-[13px] py-1.5 rounded-[8px] transition-colors"
                style={{
                  background: ativo ? color.accent : '#0c1117',
                  color: ativo ? '#0B0F14' : color.textMuted,
                  border: `1px solid ${ativo ? color.accent : color.hairline}`,
                  fontWeight: ativo ? 700 : 400,
                }}
              >
                {v}V
              </button>
            )
          })}
        </div>
      )}

      {/* barra de progresso do teste energizado */}
      {isTeste && (rodando || progressoTeste > 0) && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: color.textFaint }}>
            <span>Energizado</span>
            <span className="font-mono">
              {formatarTempo(tempo)} / {formatarTempo(duracao)}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#0c1117' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressoTeste * 100}%`,
                background: color.accent,
                boxShadow: `0 0 10px ${color.accent}`,
                transition: 'width .15s linear',
              }}
            />
          </div>
        </div>
      )}

      {/* ação principal */}
      <button
        onClick={executarAcao}
        disabled={!habilitado || jaCumprido}
        className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[14px] transition-all"
        style={{
          background: jaCumprido ? '#0c1117' : habilitado ? color.accent : '#0c1117',
          color: jaCumprido ? color.status.pass : habilitado ? '#0B0F14' : color.textFaint,
          border: `1px solid ${jaCumprido ? color.status.pass + '55' : habilitado ? color.accent : color.hairline}`,
          cursor: !habilitado || jaCumprido ? 'default' : 'pointer',
          boxShadow: habilitado && !jaCumprido ? `0 0 20px ${color.accent}44` : 'none',
        }}
      >
        {jaCumprido ? '✓ Concluído' : rodando ? 'Em ensaio…' : passo.acao}
      </button>

      {!habilitado && !jaCumprido && (
        <p className="text-[11px] mt-2 text-center" style={{ color: color.textFaint }}>
          Cumpra os passos anteriores para liberar.
        </p>
      )}
    </div>
  )
}

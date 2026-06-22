import { useMemo } from 'react'
import { useSim } from '../sim/store'
import { color } from '../design/tokens'
import { formatarLeitura, formatarRazao, formatarTempo } from './format'

/**
 * Instrument — elemento-assinatura: readout grande em mono + curva R×tempo
 * estilo osciloscópio que se desenha ao vivo durante os 60 s do ensaio,
 * emoldurada como painel calibrado. Mostra DAR/PI/R@40 °C/veredito ao concluir.
 */
export function Instrument() {
  const amostras = useSim((s) => s.amostras)
  const leitura = useSim((s) => s.leituraAtual)
  const tempo = useSim((s) => s.tempo)
  const fase = useSim((s) => s.fase)
  const tensao = useSim((s) => s.tensao)
  const duracao = useSim((s) => s.ensaio.duracaoS)
  const resultado = useSim((s) => s.resultado)

  const W = 320
  const H = 120
  const pad = { l: 4, r: 4, t: 8, b: 14 }

  const path = useMemo(() => {
    if (amostras.length < 2) return ''
    const maxR = Math.max(...amostras.map((a) => a.r), 1)
    const innerW = W - pad.l - pad.r
    const innerH = H - pad.t - pad.b
    const x = (t: number) => pad.l + (t / duracao) * innerW
    const y = (r: number) => pad.t + innerH - (r / maxR) * innerH
    return amostras
      .map((a, i) => `${i === 0 ? 'M' : 'L'}${x(a.t).toFixed(1)},${y(a.r).toFixed(1)}`)
      .join(' ')
  }, [amostras, duracao])

  const corVer =
    resultado?.cor === 'pass'
      ? color.status.pass
      : resultado?.cor === 'marginal'
        ? color.status.marginal
        : color.status.fail

  const x30 = pad.l + (30 / duracao) * (W - pad.l - pad.r)
  const x60 = pad.l + (60 / duracao) * (W - pad.l - pad.r)

  return (
    <div className="instrument-panel rounded-[14px] p-4 w-[352px] max-w-[88vw]">
      <div className="flex items-baseline justify-between mb-2">
        <span
          className="text-[11px] uppercase tracking-[0.18em]"
          style={{ color: color.textFaint }}
        >
          Instrumento · Megômetro
        </span>
        <span className="font-mono text-[11px]" style={{ color: color.textFaint }}>
          {tensao}V · {formatarTempo(tempo)}/{formatarTempo(duracao)}
        </span>
      </div>

      {/* readout grande */}
      <div className="flex items-end gap-2 mb-3">
        <span
          className="font-mono font-bold leading-none tabular-nums"
          style={{
            fontSize: 46,
            color: fase === 'rodando' ? color.accentCool : color.text,
            textShadow:
              fase === 'rodando' ? `0 0 18px ${color.accentCool}55` : 'none',
            transition: 'color .3s',
          }}
        >
          {fase === 'idle' ? '———' : formatarLeitura(leitura)}
        </span>
        <span className="font-mono text-sm mb-1" style={{ color: color.textMuted }}>
          MΩ
        </span>
      </div>

      {/* osciloscópio R×t */}
      <div
        className="rounded-[10px] overflow-hidden"
        style={{ background: '#070a0e', border: `1px solid ${color.hairline}` }}
      >
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Curva resistência por tempo">
          {/* grade */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={pad.t + (H - pad.t - pad.b) * f}
              y2={pad.t + (H - pad.t - pad.b) * f}
              stroke={color.hairline}
              strokeWidth={1}
            />
          ))}
          {/* marcadores 30s / 60s */}
          {[
            { x: x30, label: '30s' },
            { x: x60, label: '60s' },
          ].map((m) => (
            <g key={m.label}>
              <line
                x1={m.x}
                x2={m.x}
                y1={pad.t}
                y2={H - pad.b}
                stroke={color.textFaint}
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.6}
              />
              <text
                x={m.x}
                y={H - 3}
                fontSize={9}
                fill={color.textFaint}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
              >
                {m.label}
              </text>
            </g>
          ))}
          {/* curva */}
          {path && (
            <path
              d={path}
              fill="none"
              stroke={color.accentCool}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${color.accentCool}88)` }}
            />
          )}
          {/* ponto da leitura atual */}
          {amostras.length > 0 && fase === 'rodando' && (
            <circle
              cx={pad.l + (tempo / duracao) * (W - pad.l - pad.r)}
              cy={
                pad.t +
                (H - pad.t - pad.b) -
                (leitura / Math.max(...amostras.map((a) => a.r), 1)) * (H - pad.t - pad.b)
              }
              r={3}
              fill={color.accent}
            />
          )}
        </svg>
      </div>

      {/* resultados */}
      {resultado && fase === 'concluido' && (
        <div className="mt-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Metric rotulo="DAR" valor={formatarRazao(resultado.dar)} />
            <Metric rotulo="PI" valor={formatarRazao(resultado.pi)} />
            <Metric rotulo="R@40°C" valor={formatarLeitura(resultado.r40) + ' MΩ'} />
          </div>
          <div
            className="rounded-[10px] px-3 py-2 flex items-center justify-between"
            style={{ background: corVer + '1a', border: `1px solid ${corVer}66` }}
          >
            <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: color.textMuted }}>
              Veredito
            </span>
            <span
              className="font-display font-semibold text-[15px]"
              style={{ color: corVer }}
            >
              {resultado.veredito}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div
      className="rounded-[8px] px-2 py-1.5"
      style={{ background: '#0c1117', border: `1px solid ${color.hairline}` }}
    >
      <div className="text-[10px] uppercase tracking-wider" style={{ color: color.textFaint }}>
        {rotulo}
      </div>
      <div className="font-mono text-[13px] font-medium tabular-nums" style={{ color: color.text }}>
        {valor}
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { useSim } from '../sim/store'
import { color } from '../design/tokens'
import { resolverQualidade, lerRenderer, type QualidadePref } from '../scene/quality'

const QUALIDADES: { id: QualidadePref; rotulo: string }[] = [
  { id: 'auto', rotulo: 'Auto' },
  { id: 'alto', rotulo: 'Alto' },
  { id: 'medio', rotulo: 'Médio' },
  { id: 'baixo', rotulo: 'Baixo' },
]

/** Seletor de qualidade gráfica + indicador da GPU em uso (reutilizável). */
export function QualityPicker() {
  const qualidadePref = useSim((s) => s.qualidadePref)
  const setQualidadePref = useSim((s) => s.setQualidadePref)
  const tierAtivo = resolverQualidade(qualidadePref).tier

  const gpu = useMemo(() => {
    const r = lerRenderer()
    const m = r.match(/angle \(([^,]+),\s*([^,]+)/)
    const nome = m ? m[2] : r
    return nome.replace(/\s+(direct3d|opengl|vulkan).*$/i, '').trim() || '—'
  }, [])
  const usandoIntegrada = /intel|uhd|hd graphics/i.test(gpu)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: color.textFaint }}>
          Qualidade gráfica
        </span>
        {qualidadePref === 'auto' && (
          <span className="text-[10px] font-mono" style={{ color: color.accentCool }}>
            auto → {tierAtivo}
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {QUALIDADES.map((q) => {
          const ativo = q.id === qualidadePref
          return (
            <button
              key={q.id}
              onClick={() => setQualidadePref(q.id)}
              className="text-[11px] py-1.5 rounded-[8px] transition-colors"
              style={{
                background: ativo ? color.accent : '#0c1117',
                color: ativo ? '#0B0F14' : color.textMuted,
                border: `1px solid ${ativo ? color.accent : color.hairline}`,
                fontWeight: ativo ? 700 : 400,
              }}
            >
              {q.rotulo}
            </button>
          )
        })}
      </div>
      <div
        className="rounded-[8px] px-2.5 py-1.5 flex items-center gap-1.5"
        style={{
          background: '#0c1117',
          border: `1px solid ${usandoIntegrada ? color.status.marginal + '55' : color.hairline}`,
        }}
        title={gpu}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: usandoIntegrada ? color.status.marginal : color.status.pass }}
        />
        <span className="text-[10px] truncate" style={{ color: color.textMuted }}>
          GPU: <span className="font-mono">{gpu}</span>
          {usandoIntegrada && ' (integrada)'}
        </span>
      </div>
    </div>
  )
}

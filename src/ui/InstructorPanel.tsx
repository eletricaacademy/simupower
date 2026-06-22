import { useMemo } from 'react'
import { useSim } from '../sim/store'
import { color } from '../design/tokens'
import type { Perfil } from '../engine/insulation'
import { resolverQualidade, lerRenderer, type QualidadePref } from '../scene/quality'
import { useDraggable } from './useDraggable'

const QUALIDADES: { id: QualidadePref; rotulo: string }[] = [
  { id: 'auto', rotulo: 'Auto' },
  { id: 'alto', rotulo: 'Alto' },
  { id: 'medio', rotulo: 'Médio' },
  { id: 'baixo', rotulo: 'Baixo' },
]

const PERFIS: { id: Perfil; rotulo: string; cor: string }[] = [
  { id: 'bom', rotulo: 'Bom', cor: color.status.pass },
  { id: 'atencao', rotulo: 'Atenção', cor: color.status.marginal },
  { id: 'ruim', rotulo: 'Ruim / úmido', cor: color.status.fail },
]

const VELOCIDADES = [1, 4, 8]

/**
 * InstructorPanel — "modo instrutor": troca a condição do isolamento, a
 * temperatura (correção IEEE 43) e a velocidade do ensaio para demonstração.
 */
export function InstructorPanel({ onClose }: { onClose: () => void }) {
  const perfil = useSim((s) => s.perfil)
  const tempC = useSim((s) => s.tempC)
  const velocidade = useSim((s) => s.velocidade)
  const fase = useSim((s) => s.fase)
  const setPerfil = useSim((s) => s.setPerfil)
  const setTempC = useSim((s) => s.setTempC)
  const setVelocidade = useSim((s) => s.setVelocidade)
  const qualidadePref = useSim((s) => s.qualidadePref)
  const setQualidadePref = useSim((s) => s.setQualidadePref)
  const pickMode = useSim((s) => s.pickMode)
  const setPickMode = useSim((s) => s.setPickMode)
  const peca = useSim((s) => s.peca)
  const reset = useSim((s) => s.reset)

  const tierAtivo = resolverQualidade(qualidadePref).tier
  const gpu = useMemo(() => {
    const r = lerRenderer()
    // limpa o invólucro ANGLE p/ ler só o nome da GPU
    const m = r.match(/angle \(([^,]+),\s*([^,]+)/)
    const nome = m ? m[2] : r
    return nome.replace(/\s+(direct3d|opengl|vulkan).*$/i, '').trim() || '—'
  }, [])
  const usandoIntegrada = /intel|uhd|hd graphics/i.test(gpu)

  const { style: dragStyle, handlers, handleStyle } = useDraggable()

  return (
    <div
      className="hud-glass rounded-[14px] p-4 w-[300px] max-w-[88vw] max-h-[82vh] overflow-y-auto hud-scroll"
      style={dragStyle}
    >
      <div className="flex items-center justify-between mb-3 select-none" style={handleStyle} {...handlers}>
        <span className="font-display font-semibold text-[14px]" style={{ color: color.text }}>
          ⠿ Modo instrutor
        </span>
        <button
          onClick={onClose}
          aria-label="Fechar modo instrutor"
          className="text-[16px] leading-none"
          style={{ color: color.textMuted }}
        >
          ×
        </button>
      </div>

      <Label>Condição do isolamento</Label>
      <div className="flex gap-1.5 mb-3">
        {PERFIS.map((p) => {
          const ativo = p.id === perfil
          return (
            <button
              key={p.id}
              onClick={() => setPerfil(p.id)}
              className="flex-1 text-[11px] py-1.5 rounded-[8px] transition-colors"
              style={{
                background: ativo ? p.cor + '22' : '#0c1117',
                color: ativo ? p.cor : color.textMuted,
                border: `1px solid ${ativo ? p.cor + '88' : color.hairline}`,
              }}
            >
              {p.rotulo}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between mb-1">
        <Label>Temperatura</Label>
        <span className="font-mono text-[12px]" style={{ color: color.accentCool }}>
          {tempC} °C
        </span>
      </div>
      <input
        type="range"
        min={5}
        max={70}
        value={tempC}
        onChange={(e) => setTempC(Number(e.target.value))}
        className="w-full mb-3"
        style={{ accentColor: color.accent }}
        aria-label="Temperatura do enrolamento"
      />

      <Label>Velocidade do ensaio</Label>
      <div className="flex gap-1.5 mb-3">
        {VELOCIDADES.map((v) => {
          const ativo = v === velocidade
          return (
            <button
              key={v}
              onClick={() => setVelocidade(v)}
              className="flex-1 font-mono text-[12px] py-1.5 rounded-[8px] transition-colors"
              style={{
                background: ativo ? color.accent : '#0c1117',
                color: ativo ? '#0B0F14' : color.textMuted,
                border: `1px solid ${ativo ? color.accent : color.hairline}`,
                fontWeight: ativo ? 700 : 400,
              }}
            >
              {v}×
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between mb-1">
        <Label>Qualidade gráfica</Label>
        {qualidadePref === 'auto' && (
          <span className="text-[10px] font-mono" style={{ color: color.accentCool }}>
            auto → {tierAtivo}
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-1">
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
      <p className="text-[10px] mb-2" style={{ color: color.textFaint }}>
        Níveis baixos desligam brilho/sombras e renderizam sob demanda — ideal p/ celular e PCs leves.
      </p>
      <div
        className="rounded-[8px] px-2.5 py-1.5 mb-3 flex items-center gap-1.5"
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

      {/* Calibrar pontos de conexão (garras) */}
      <Label>Calibrar conexão (garras)</Label>
      <button
        onClick={() => setPickMode(!pickMode)}
        className="w-full text-[12px] py-1.5 rounded-[8px] mb-1.5"
        style={{
          background: pickMode ? color.accent : '#0c1117',
          color: pickMode ? '#0B0F14' : color.text,
          border: `1px solid ${pickMode ? color.accent : color.hairline}`,
          fontWeight: pickMode ? 700 : 400,
        }}
      >
        🔍 {pickMode ? 'Clicando (ligado)' : 'Identificar ponto'}
      </button>
      {peca && (
        <div
          className="rounded-[8px] px-2.5 py-1.5 mb-2 font-mono text-[11px] break-all"
          style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}
        >
          {peca}
        </div>
      )}
      <p className="text-[10px] leading-snug mb-3" style={{ color: color.textFaint }}>
        Ligue e clique no ponto do motor (caixa de bornes p/ LINE, carcaça p/ EARTH); a coord é
        copiada — me envie que eu gravo as âncoras.
      </p>

      <button
        onClick={reset}
        disabled={fase === 'rodando'}
        className="w-full py-2 rounded-[10px] text-[13px] font-medium transition-colors"
        style={{
          background: '#0c1117',
          color: fase === 'rodando' ? color.textFaint : color.text,
          border: `1px solid ${color.hairline}`,
          cursor: fase === 'rodando' ? 'default' : 'pointer',
        }}
      >
        ↺ Reiniciar ensaio
      </button>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>
      {children}
    </div>
  )
}

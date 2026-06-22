import { useState, useEffect, useRef } from 'react'
import { useSim, passoHabilitado } from '../sim/store'
import { useArc } from '../sim/arcStore'
import { CLASSES } from '../engine/arcflash'
import { Checklist } from './Checklist'
import { QualityPicker } from './QualityPicker'
import { ArcLabel } from './ArcLabel'
import { ViewControls } from './ViewControls'
import { SoundControl } from './SoundControl'
import { Creditos } from './Creditos'
import { useDraggable } from './useDraggable'
import { ArcIntro } from './ArcIntro'
import { ambiente, somVoz, pararVoz } from './sons'
import { color } from '../design/tokens'

const COR: Record<'pass' | 'marginal' | 'fail', string> = {
  pass: color.status.pass,
  marginal: color.status.marginal,
  fail: color.status.fail,
}
const num = (v: number, c = 2) => v.toFixed(c).replace('.', ',')

/**
 * ArcFlashHud — HUD do estudo de arco elétrico. Mesmo padrão do megômetro:
 * topo, painel guiado + checklist à esquerda, leitura (energia incidente) à
 * direita, e abas no mobile.
 */
export function ArcFlashHud() {
  const [aba, setAba] = useState<'procedimento' | 'resultado'>('procedimento')
  const [configAberto, setConfigAberto] = useState(false)
  const [labelAberto, setLabelAberto] = useState(false)
  const [intro, setIntro] = useState(true) // abertura: investigação + vídeo
  const setView = useSim((s) => s.setView)
  const resetArc = useArc((s) => s.reset)
  const resultado = useArc((s) => s.resultado)
  const passoIndex = useSim((s) => s.passoIndex)
  const ensaio = useSim((s) => s.ensaio)
  const cfgDrag = useDraggable()
  const prevRes = useRef(false)

  // zera parâmetros/resultado ao abrir o módulo de arco
  useEffect(() => resetArc(), [resetArc])

  // som de fundo da cabine MT (~15%) — só após a intro/vídeo
  useEffect(() => {
    if (!intro) ambiente(true, '/sounds/cabine.mp3', 0.15)
    return () => ambiente(false)
  }, [intro])
  useEffect(() => () => pararVoz(), [])

  // locução: energia incidente ao calcular; resultado na etapa de EPI
  useEffect(() => {
    if (!intro && resultado && !prevRes.current) somVoz('arco-energia')
    prevRes.current = !!resultado
  }, [resultado, intro])
  useEffect(() => {
    if (!intro && ensaio.steps[passoIndex]?.id === 'af-epi') somVoz('arco-resultado')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passoIndex, intro])

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {labelAberto && <LabelModal onClose={() => setLabelAberto(false)} />}
      <button
        onClick={() => setView('menu')}
        aria-label="Voltar ao menu principal"
        className="absolute hud-glass rounded-[12px] px-3 py-2 text-[12px] pointer-events-auto flex items-center gap-1.5"
        style={{
          top: 'max(12px, env(safe-area-inset-top))',
          left: 'max(12px, env(safe-area-inset-left))',
          color: color.textMuted,
        }}
      >
        <span aria-hidden>‹</span> Menu
      </button>

      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto"
        style={{ top: 'max(12px, env(safe-area-inset-top))' }}
      >
        <ArcTopBar />
        <button
          onClick={() => setConfigAberto((v) => !v)}
          aria-label="Configurações"
          className="hud-glass rounded-[12px] px-3 py-2 text-[12px]"
          style={{ color: configAberto ? color.accent : color.textMuted }}
        >
          ⚙
        </button>
      </div>

      {/* barra de vistas de câmera (lateral direita) */}
      <div
        className="absolute pointer-events-auto"
        style={{ top: 'max(12px, env(safe-area-inset-top))', right: 'max(12px, env(safe-area-inset-right))' }}
      >
        <SoundControl />
      </div>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-auto">
        <ViewControls />
      </div>

      {configAberto && (
        <div className="absolute right-3 pointer-events-auto" style={{ top: 72 }}>
          <div className="hud-glass rounded-[14px] p-4 w-[280px]" style={cfgDrag.style}>
            <div
              className="font-display font-semibold text-[14px] mb-3 select-none"
              style={{ color: color.text, ...cfgDrag.handleStyle }}
              {...cfgDrag.handlers}
            >
              ⠿ Configurações
            </div>
            <QualityPicker />
          </div>
        </div>
      )}

      {/* DESKTOP */}
      <div className="hidden md:flex absolute left-4 bottom-4 flex-col gap-3 pointer-events-auto">
        <ArcGuidedPanel />
        <div className="hud-glass rounded-[14px] p-3 w-[360px]">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: color.textFaint }}>
            Procedimento
          </div>
          <Checklist />
        </div>
      </div>

      <div className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
        <ArcResult onVerEtiqueta={() => setLabelAberto(true)} />
      </div>

      {/* MOBILE */}
      <div
        className="md:hidden absolute inset-x-0 bottom-0 pointer-events-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex gap-1.5 px-3 mb-2">
          <Tab ativo={aba === 'procedimento'} onClick={() => setAba('procedimento')}>
            Procedimento
          </Tab>
          <Tab ativo={aba === 'resultado'} onClick={() => setAba('resultado')}>
            Resultado
          </Tab>
        </div>
        <div className="px-3 pb-3 flex justify-center">
          {aba === 'procedimento' ? <ArcGuidedPanel /> : <ArcResult onVerEtiqueta={() => setLabelAberto(true)} />}
        </div>
      </div>

      <div className="hidden md:block">
        <Creditos />
      </div>

      {intro && <ArcIntro onClose={() => setIntro(false)} onCancel={() => setView('menu')} />}
    </div>
  )
}

function Tab({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 hud-glass rounded-[10px] py-2 text-[12px] font-medium"
      style={{ color: ativo ? color.accent : color.textMuted, borderColor: ativo ? color.accent + '66' : undefined }}
    >
      {children}
    </button>
  )
}

function ArcTopBar() {
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  const voc = useArc((s) => s.voc)
  const resultado = useArc((s) => s.resultado)

  const estado = resultado
    ? { txt: `${resultado.categoria.rotulo.toUpperCase()}`, cor: COR[resultado.cor] }
    : { txt: 'ANÁLISE PENDENTE', cor: color.textMuted }

  return (
    <div className="hud-glass rounded-[12px] px-4 py-2 flex items-center gap-4 max-w-[94vw]">
      <div className="flex items-center gap-2">
        <div className="leading-tight">
          <div className="font-display font-semibold text-[13px]" style={{ color: color.text }}>
            {equipamento.nome}
          </div>
          <div className="text-[10px]" style={{ color: color.textFaint }}>
            {ensaio.nome} · {ensaio.norma}
          </div>
        </div>
      </div>
      <div className="h-7 w-px" style={{ background: color.hairline }} />
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: estado.cor, boxShadow: `0 0 8px ${estado.cor}` }} />
        <span className="font-mono text-[11px]" style={{ color: estado.cor }}>
          {estado.txt}
        </span>
      </div>
      <div className="h-7 w-px hidden sm:block" style={{ background: color.hairline }} />
      <div className="hidden sm:flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: color.textFaint }}>
          Tensão
        </span>
        <span className="font-mono text-[12px]" style={{ color: color.accentCool }}>
          {num(voc, voc < 1 ? 2 : 1)} kV
        </span>
      </div>
    </div>
  )
}

function ArcGuidedPanel() {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const cumprirPasso = useSim((s) => s.cumprirPasso)
  const habilitado = useSim((s) => {
    const p = s.ensaio.steps[s.passoIndex]
    return p ? passoHabilitado(s, p.id) : false
  })
  const jaCumprido = useSim((s) => {
    const p = s.ensaio.steps[s.passoIndex]
    return p ? !!s.cumpridos[p.id] : false
  })
  const calcular = useArc((s) => s.calcular)

  const passo = ensaio.steps[passoIndex]
  if (!passo) return null

  function acao() {
    if (!passo) return
    if (passo.control === 'af-calcular') calcular()
    cumprirPasso(passo.id)
  }

  return (
    <div className="hud-glass rounded-[14px] p-4 w-[360px] max-w-[88vw]">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="font-mono text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: '#0c1117', color: color.accent, border: `1px solid ${color.hairline}` }}
        >
          PASSO {passoIndex + 1}/{ensaio.steps.length}
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

      <Controle control={passo.control} />

      <button
        onClick={acao}
        disabled={!habilitado || jaCumprido}
        className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[14px] transition-all mt-1"
        style={{
          background: jaCumprido ? '#0c1117' : habilitado ? color.accent : '#0c1117',
          color: jaCumprido ? color.status.pass : habilitado ? '#0B0F14' : color.textFaint,
          border: `1px solid ${jaCumprido ? color.status.pass + '55' : habilitado ? color.accent : color.hairline}`,
          cursor: !habilitado || jaCumprido ? 'default' : 'pointer',
          boxShadow: habilitado && !jaCumprido ? `0 0 20px ${color.accent}44` : 'none',
        }}
      >
        {jaCumprido ? '✓ Concluído' : passo.acao}
      </button>
    </div>
  )
}

function Controle({ control }: { control?: string }) {
  const arc = useArc()
  if (control === 'af-tensao') {
    const opcoes = [
      { v: 0.48, label: '0,48 kV' },
      { v: 4.16, label: '4,16 kV' },
      { v: 13.8, label: '13,8 kV' },
    ]
    return (
      <Grupo>
        {opcoes.map((o) => (
          <Pill key={o.v} ativo={arc.voc === o.v} onClick={() => arc.setVoc(o.v)}>
            {o.label}
          </Pill>
        ))}
      </Grupo>
    )
  }
  if (control === 'af-corrente') {
    return (
      <div className="mb-3">
        <Range rotulo="Icc (curto presumido)" valor={`${num(arc.ibf, 0)} kA`} min={1} max={63} step={1} value={arc.ibf} onChange={arc.setIbf} />
      </div>
    )
  }
  if (control === 'af-tempo') {
    const opcoes = [0.05, 0.1, 0.2, 0.5]
    return (
      <Grupo>
        {opcoes.map((t) => (
          <Pill key={t} ativo={arc.t === t} onClick={() => arc.setT(t)}>
            {t * 1000} ms
          </Pill>
        ))}
      </Grupo>
    )
  }
  if (control === 'af-config') {
    return (
      <div className="mb-3 space-y-2.5">
        <div>
          <Rotulo>Classe do equipamento</Rotulo>
          <Grupo>
            {Object.values(CLASSES).map((c) => (
              <Pill key={c.id} ativo={arc.classeId === c.id} onClick={() => arc.setClasse(c.id)} pequeno>
                {c.nome.split(' ')[0]}
              </Pill>
            ))}
          </Grupo>
        </div>
        <Range rotulo="Distância de trabalho" valor={`${num(arc.distancia, 0)} mm`} min={150} max={1200} step={5} value={arc.distancia} onChange={arc.setDistancia} />
        <div>
          <Rotulo>Aterramento</Rotulo>
          <Grupo>
            <Pill ativo={arc.aterramento === 'aterrado'} onClick={() => arc.setAterramento('aterrado')}>
              Aterrado
            </Pill>
            <Pill ativo={arc.aterramento === 'isolado'} onClick={() => arc.setAterramento('isolado')}>
              Isolado
            </Pill>
          </Grupo>
        </div>
      </div>
    )
  }
  return null
}

function Grupo({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5 mb-3">{children}</div>
}
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: color.textFaint }}>
      {children}
    </div>
  )
}
function Pill({ ativo, onClick, children, pequeno = false }: { ativo: boolean; onClick: () => void; children: React.ReactNode; pequeno?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono rounded-[8px] transition-colors ${pequeno ? 'text-[11px] px-2 py-1' : 'text-[13px] px-3 py-1.5 flex-1'}`}
      style={{
        background: ativo ? color.accent : '#0c1117',
        color: ativo ? '#0B0F14' : color.textMuted,
        border: `1px solid ${ativo ? color.accent : color.hairline}`,
        fontWeight: ativo ? 700 : 400,
      }}
    >
      {children}
    </button>
  )
}
function Range({ rotulo, valor, min, max, step, value, onChange }: { rotulo: string; valor: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <Rotulo>{rotulo}</Rotulo>
        <span className="font-mono text-[12px]" style={{ color: color.accentCool }}>
          {valor}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color.accent }}
      />
    </div>
  )
}

function ArcResult({ onVerEtiqueta }: { onVerEtiqueta: () => void }) {
  const r = useArc((s) => s.resultado)
  const cor = r ? COR[r.cor] : color.textFaint

  return (
    <div className="instrument-panel rounded-[14px] p-4 w-[360px] max-w-[88vw]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: color.textFaint }}>
          Energia Incidente
        </span>
        <span className="font-mono text-[11px]" style={{ color: color.textFaint }}>
          IEEE 1584
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span
          className="font-mono font-bold leading-none tabular-nums"
          style={{ fontSize: 46, color: r ? cor : color.text, textShadow: r ? `0 0 18px ${cor}55` : 'none' }}
        >
          {r ? num(r.energia) : '———'}
        </span>
        <span className="font-mono text-sm mb-1" style={{ color: color.textMuted }}>
          cal/cm²
        </span>
      </div>

      {r ? (
        <>
          <div
            className="rounded-[10px] px-3 py-2 flex items-center justify-between mb-3"
            style={{ background: cor + '1a', border: `1px solid ${cor}66` }}
          >
            <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: color.textMuted }}>
              EPI
            </span>
            <span className="font-display font-semibold text-[15px]" style={{ color: cor }}>
              {r.categoria.rotulo}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Metric rotulo="Fronteira" valor={`${num(r.afb / 1000)} m`} />
            <Metric rotulo="I arco" valor={`${num(r.ia, 1)} kA`} />
            <Metric rotulo="EPI mín." valor={r.categoria.epiCal ? `${r.categoria.epiCal} cal` : '—'} />
          </div>
          <button
            onClick={onVerEtiqueta}
            className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[13px]"
            style={{ background: '#0c1117', color: color.accent, border: `1px solid ${color.accent}66` }}
          >
            🏷 Ver etiqueta de arco
          </button>
        </>
      ) : (
        <p className="text-[12px]" style={{ color: color.textFaint }}>
          Defina os parâmetros e calcule para ver a energia incidente, a fronteira de arco e a categoria de EPI.
        </p>
      )}
    </div>
  )
}

function Metric({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-[8px] px-2 py-1.5" style={{ background: '#0c1117', border: `1px solid ${color.hairline}` }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: color.textFaint }}>
        {rotulo}
      </div>
      <div className="font-mono text-[13px] font-medium tabular-nums" style={{ color: color.text }}>
        {valor}
      </div>
    </div>
  )
}

/** Modal com a etiqueta de arco preenchida (visualização ampliada). */
function LabelModal({ onClose }: { onClose: () => void }) {
  const r = useArc((s) => s.resultado)
  const voc = useArc((s) => s.voc)
  const distancia = useArc((s) => s.distancia)
  const nome = useSim((s) => s.equipamento.nome)
  if (!r) return null

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto p-4 hud-scroll overflow-auto"
      style={{ background: 'rgba(7,10,14,0.78)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="relative">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full font-bold"
          style={{ background: color.surface, color: color.text, border: `1px solid ${color.hairline}` }}
        >
          ×
        </button>
        <div style={{ transform: 'scale(0.92)', transformOrigin: 'center' }}>
          <ArcLabel resultado={r} voc={voc} distancia={distancia} nomeEquip={nome} />
        </div>
      </div>
    </div>
  )
}

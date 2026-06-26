import { useState, useEffect } from 'react'
import { useSim, passoHabilitado } from '../sim/store'
import { useInsp } from '../sim/inspStore'
import { avaliarInspecao, type StatusItem } from '../engine/inspection'
import { Checklist } from './Checklist'
import { QualityPicker } from './QualityPicker'
import { HudTopBar } from './HudTopBar'
import { MobileSheet } from './MobileSheet'
import { Creditos } from './Creditos'
import { useDraggable } from './useDraggable'
import { ambiente, somVoz, pararVoz } from './sons'
import { SoundControl } from './SoundControl'
import { Apresentador } from './Apresentador'
import { BemVindo } from './BemVindo'
import { Detalhes } from './Detalhes'
import { color } from '../design/tokens'

const COR: Record<'pass' | 'marginal' | 'fail', string> = {
  pass: color.status.pass,
  marginal: color.status.marginal,
  fail: color.status.fail,
}

/**
 * InspectionHud — HUD da inspeção de subestação. Mesmo padrão dos demais: topo,
 * painel guiado (Conforme / Não conforme por item) + checklist à esquerda, e o
 * resultado de conformidade à direita.
 */
export function InspectionHud() {
  const [aba, setAba] = useState<'procedimento' | 'resultado'>('procedimento')
  const [configAberto, setConfigAberto] = useState(false)
  const [falando, setFalando] = useState(false)
  const [pronto, setPronto] = useState(false)
  const tourAtivo = useSim((s) => s.tourAtivo)
  const passoIndex = useSim((s) => s.passoIndex)
  const ensaio = useSim((s) => s.ensaio)
  const resetInsp = useInsp((s) => s.reset)
  const cfgDrag = useDraggable()

  useEffect(() => resetInsp(), [resetInsp])

  // subestação energizada: zumbido de alta tensão constante em loop
  useEffect(() => {
    ambiente(true)
    return () => {
      ambiente(false)
      pararVoz()
    }
  }, [])

  // locução: narra cada ponto durante o tour guiado (avatar "fala")
  function narrar() {
    const id = ensaio.steps[passoIndex]?.id
    if (!id) return
    const a = somVoz(id)
    if (!a) {
      setFalando(false)
      return
    }
    setFalando(true)
    const fim = () => setFalando(false)
    a.addEventListener('ended', fim)
    a.addEventListener('error', fim)
  }
  useEffect(() => {
    if (tourAtivo) narrar()
    else pararVoz()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passoIndex, tourAtivo])

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <HudTopBar onConfig={() => setConfigAberto((v) => !v)} configAberto={configAberto} right={<SoundControl />} />

      {/* avatar do apresentador (narração) */}
      <div className="absolute pointer-events-auto" style={{ top: 60, left: 'max(12px, env(safe-area-inset-left))' }}>
        <Apresentador falando={falando} onReplay={narrar} />
      </div>

      {/* toggles grade/paredes (inspeção) — abaixo da barra superior */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto"
        style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 48px)' }}
      >
        <ToggleBar />
      </div>

      {configAberto && (
        <div className="absolute right-3 pointer-events-auto" style={{ top: 72 }}>
          <div
            className="hud-glass rounded-[14px] p-4 w-[280px] max-h-[80vh] overflow-y-auto hud-scroll"
            style={cfgDrag.style}
          >
            <div
              className="font-display font-semibold text-[14px] mb-3 select-none"
              style={{ color: color.text, ...cfgDrag.handleStyle }}
              {...cfgDrag.handlers}
            >
              ⠿ Configurações
            </div>
            <QualityPicker />
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <IdentificarPeca />
          </div>
        </div>
      )}

      {/* DESKTOP */}
      <div className="hidden md:flex absolute left-4 bottom-4 flex-col gap-3 pointer-events-auto">
        {tourAtivo ? <InspGuidedPanel /> : <IntroCard />}
        <div className="hud-glass rounded-[14px] p-3 w-[360px]">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: color.textFaint }}>
            Roteiro de inspeção
          </div>
          <Checklist />
        </div>
      </div>

      <div className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
        <InspResult />
      </div>

      {/* MOBILE */}
      <MobileSheet
        onReiniciar={() => {
          resetInsp()
          useSim.getState().reset()
        }}
        tabs={
          <>
            <Tab ativo={aba === 'procedimento'} onClick={() => setAba('procedimento')}>
              Roteiro
            </Tab>
            <Tab ativo={aba === 'resultado'} onClick={() => setAba('resultado')}>
              Conformidade
            </Tab>
          </>
        }
      >
        {aba === 'procedimento' ? tourAtivo ? <InspGuidedPanel /> : <IntroCard /> : <InspResult />}
      </MobileSheet>

      {!pronto && <BemVindo onClose={() => setPronto(true)} />}

      <div className="hidden md:block">
        <Creditos />
      </div>
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

function useResultado() {
  const ensaio = useSim((s) => s.ensaio)
  const status = useInsp((s) => s.status)
  const checks = ensaio.steps.filter((st) => st.control === 'insp-check')
  const arr: StatusItem[] = checks.map((st) => status[st.id] ?? 'pendente')
  return avaliarInspecao(arr)
}


/** Cartão inicial: explorar livre e iniciar a visita guiada. */
function IntroCard() {
  const setTour = useSim((s) => s.setTour)
  const irParaPasso = useSim((s) => s.irParaPasso)
  const equipamento = useSim((s) => s.equipamento)

  function iniciar() {
    irParaPasso(0)
    setTour(true)
  }

  return (
    <div className="hud-glass rounded-[14px] p-4 w-[360px] max-w-[88vw]">
      <span
        className="font-mono text-[11px] px-2 py-0.5 rounded-full inline-block mb-2"
        style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}
      >
        VISITA GUIADA
      </span>
      <h2 className="font-display font-semibold text-[18px] mb-1" style={{ color: color.text }}>
        {equipamento.nome}
      </h2>
      <p className="text-[13px] leading-snug mb-4" style={{ color: color.textMuted }}>
        Explore a subestação livremente (arraste, gire e use as vistas). Quando estiver pronto, inicie
        a visita guiada — cada etapa leva você a um ponto de inspeção para avaliar.
      </p>
      <button
        onClick={iniciar}
        className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
        style={{ background: color.accent, color: '#0B0F14', boxShadow: `0 0 20px ${color.accent}44` }}
      >
        ▶ Iniciar visita guiada
      </button>
    </div>
  )
}

function InspGuidedPanel() {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const cumprirPasso = useSim((s) => s.cumprirPasso)
  const setTour = useSim((s) => s.setTour)
  const habilitado = useSim((s) => {
    const p = s.ensaio.steps[s.passoIndex]
    return p ? passoHabilitado(s, p.id) : false
  })
  const jaCumprido = useSim((s) => {
    const p = s.ensaio.steps[s.passoIndex]
    return p ? !!s.cumpridos[p.id] : false
  })
  const setStatus = useInsp((s) => s.setStatus)
  const statusAtual = useInsp((s) => {
    const p = ensaio.steps[passoIndex]
    return p ? s.status[p.id] : undefined
  })

  const passo = ensaio.steps[passoIndex]
  if (!passo) return null
  const isCheck = passo.control === 'insp-check'

  function marcar(s: StatusItem) {
    if (!passo) return
    setStatus(passo.id, s)
    cumprirPasso(passo.id)
  }

  return (
    <div className="hud-glass rounded-[14px] p-4 w-[360px] max-w-[88vw]">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="font-mono text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: '#0c1117', color: color.accent, border: `1px solid ${color.hairline}` }}
        >
          ITEM {passoIndex + 1}/{ensaio.steps.length}
        </span>
        <button
          onClick={() => setTour(false)}
          className="text-[10px]"
          style={{ color: color.textFaint }}
        >
          ↺ explorar livre
        </button>
      </div>

      <h2 className="font-display font-semibold text-[18px] mb-1" style={{ color: color.text }}>
        {passo.titulo}
      </h2>
      <p className="text-[13px] leading-snug mb-2" style={{ color: color.textMuted }}>
        {passo.descricao}
      </p>

      <Detalhes itens={passo.detalhes} className="mb-3" />

      {isCheck ? (
        <div className="flex gap-2">
          <BotaoStatus
            ativo={statusAtual === 'conforme'}
            cor={color.status.pass}
            disabled={!habilitado}
            onClick={() => marcar('conforme')}
          >
            ✓ Conforme
          </BotaoStatus>
          <BotaoStatus
            ativo={statusAtual === 'nao-conforme'}
            cor={color.status.fail}
            disabled={!habilitado}
            onClick={() => marcar('nao-conforme')}
          >
            ✗ Não conforme
          </BotaoStatus>
        </div>
      ) : (
        <button
          onClick={() => cumprirPasso(passo.id)}
          disabled={!habilitado || jaCumprido}
          className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
          style={{
            background: jaCumprido ? '#0c1117' : habilitado ? color.accent : '#0c1117',
            color: jaCumprido ? color.status.pass : habilitado ? '#0B0F14' : color.textFaint,
            border: `1px solid ${jaCumprido ? color.status.pass + '55' : habilitado ? color.accent : color.hairline}`,
            cursor: !habilitado || jaCumprido ? 'default' : 'pointer',
          }}
        >
          {jaCumprido ? '✓ Concluído' : passo.acao}
        </button>
      )}
    </div>
  )
}

function BotaoStatus({
  ativo,
  cor,
  disabled,
  onClick,
  children,
}: {
  ativo: boolean
  cor: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-2.5 rounded-[10px] font-display font-semibold text-[13px] transition-colors"
      style={{
        background: ativo ? cor + '22' : '#0c1117',
        color: disabled ? color.textFaint : ativo ? cor : color.textMuted,
        border: `1px solid ${ativo ? cor : color.hairline}`,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function InspResult() {
  const r = useResultado()
  const cor = COR[r.cor]
  return (
    <div className="instrument-panel rounded-[14px] p-4 w-[360px] max-w-[88vw]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: color.textFaint }}>
          Conformidade
        </span>
        <span className="font-mono text-[11px]" style={{ color: color.textFaint }}>
          NR-10
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span
          className="font-mono font-bold leading-none tabular-nums"
          style={{ fontSize: 46, color: cor, textShadow: `0 0 18px ${cor}44` }}
        >
          {r.percentual}
        </span>
        <span className="font-mono text-sm mb-1" style={{ color: color.textMuted }}>
          %
        </span>
      </div>

      <div
        className="rounded-[10px] px-3 py-2 flex items-center justify-between mb-3"
        style={{ background: cor + '1a', border: `1px solid ${cor}66` }}
      >
        <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: color.textMuted }}>
          Veredito
        </span>
        <span className="font-display font-semibold text-[15px]" style={{ color: cor }}>
          {r.veredito}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric rotulo="Conformes" valor={`${r.conformes}`} cor={color.status.pass} />
        <Metric rotulo="Não conf." valor={`${r.naoConformes}`} cor={color.status.fail} />
        <Metric rotulo="Pendentes" valor={`${r.pendentes}`} cor={color.textMuted} />
      </div>
    </div>
  )
}

function Metric({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) {
  return (
    <div className="rounded-[8px] px-2 py-1.5" style={{ background: '#0c1117', border: `1px solid ${color.hairline}` }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: color.textFaint }}>
        {rotulo}
      </div>
      <div className="font-mono text-[15px] font-medium tabular-nums" style={{ color: cor }}>
        {valor}
      </div>
    </div>
  )
}

/** Identificar peça: liga o modo, clique numa peça → coord (p/ remoção precisa). */
function IdentificarPeca() {
  const pickMode = useSim((s) => s.pickMode)
  const setPickMode = useSim((s) => s.setPickMode)
  const peca = useSim((s) => s.peca)
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>
        Identificar peça
      </div>
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
        🔍 {pickMode ? 'Clicando (ligado)' : 'Ativar identificação'}
      </button>
      {peca && (
        <div
          className="rounded-[8px] px-2.5 py-1.5 font-mono text-[11px] break-all"
          style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}
        >
          {peca}
        </div>
      )}
      <p className="text-[10px] leading-snug mt-1" style={{ color: color.textFaint }}>
        Ligue e clique na peça que quer remover; a coordenada é copiada — me envie que eu apago a peça
        certa.
      </p>
    </div>
  )
}

/** Barra fixa no topo: mostrar/ocultar Grade e Paredes da subestação. */
function ToggleBar() {
  const grade = useInsp((s) => s.mostrarGrade)
  const setGrade = useInsp((s) => s.setMostrarGrade)
  const paredes = useInsp((s) => s.mostrarParedes)
  const setParedes = useInsp((s) => s.setMostrarParedes)
  return (
    <div className="hud-glass rounded-[12px] px-1.5 py-1 flex items-center gap-1.5">
      <Toggle ativo={grade} onClick={() => setGrade(!grade)} label="Grade" />
      <Toggle ativo={paredes} onClick={() => setParedes(!paredes)} label="Paredes" />
    </div>
  )
}

function Toggle({ ativo, onClick, label }: { ativo: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      title={`${ativo ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[12px] transition-colors"
      style={{
        background: ativo ? color.accent + '22' : 'transparent',
        color: ativo ? color.accent : color.textMuted,
        border: `1px solid ${ativo ? color.accent + '66' : color.hairline}`,
      }}
    >
      <span aria-hidden>{ativo ? '👁' : '🚫'}</span>
      {label}
    </button>
  )
}

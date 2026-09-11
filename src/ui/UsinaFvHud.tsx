import { useEffect, useState, type ReactNode } from 'react'
import { useSim, passoHabilitado } from '../sim/store'
import { useUsinaFv, continuidadeCompleta, toquePassoCompleto, malhaDoSolo } from '../sim/usinaFvStore'
import { useView } from '../sim/viewStore'
import {
  resistenciaAparenteFv,
  patamarRegistrado,
  leituraNaPosicao,
  POSICOES_PATAMAR,
  POS_62,
  LIMITE_PATAMAR_PCT,
  LIMITE_MALHA_OHM,
  LIMITE_EQUIPOT_CONFORME,
  LIMITE_EQUIPOT_ATENCAO,
  RESISTIVIDADE_SOLO,
  ROTULO_SOLO,
  I_MALHA_A,
  I_TESTE_A,
  T_ELIMINACAO_S,
  RHO_BRITA,
  H_BRITA_M,
  type CenarioFv,
  type PerfilSoloFv,
  type PontoCurvaFv,
  type MalhaFv,
} from '../engine/usinaFv'
import { R_PONTAS, formatarLeitura } from '../engine/spda'
import {
  USINA,
  POTENCIA_DC_KWP,
  MODULOS_TOTAL,
  DIAGONAL_MALHA_M,
  DISTANCIAS_C_M,
  AREA_MALHA_M2,
  PONTOS_CONTINUIDADE_FV,
  PONTOS_TOQUE_PASSO_FV,
  VISTAS_FV,
  comprimentoEnterradoM,
  getPontoContinuidadeFv,
  getPontoToquePassoFv,
} from '../catalog/usinaFvPontos'
import { ambiente } from './sons'
import { QualityPicker } from './QualityPicker'
import { SoundControl } from './SoundControl'
import { HudTopBar } from './HudTopBar'
import { Creditos } from './Creditos'
import { useDraggable } from './useDraggable'
import { MobileSheet } from './MobileSheet'
import { Detalhes } from './Detalhes'
import { color } from '../design/tokens'

const CORV: Record<'pass' | 'marginal' | 'fail', string> = {
  pass: color.status.pass,
  marginal: color.status.marginal,
  fail: color.status.fail,
}

const botao = { background: color.surface, color: color.textMuted, border: `1px solid ${color.hairline}` }

/**
 * UsinaFvHud — ATERRAMENTO EM USINA FOTOVOLTAICA (100 kW).
 * Passos guiados à esquerda; à direita, o instrumento da etapa: dados da planta,
 * miliohmímetro (continuidade), terrômetro (queda de potencial) ou medidor de
 * toque/passo. Laudo consolidado ao final.
 */
export function UsinaFvHud() {
  const [configAberto, setConfigAberto] = useState(false)
  const [aba, setAba] = useState<'procedimento' | 'medicao'>('procedimento')
  const [laudoFechado, setLaudoFechado] = useState(false)
  const laudo = useUsinaFv((s) => s.laudo)
  const setView = useSim((s) => s.setView)
  const setTour = useSim((s) => s.setTour)
  const cfgDrag = useDraggable()

  const reiniciar = () => {
    useUsinaFv.getState().reset()
    useSim.getState().reset()
    setTour(true)
    setLaudoFechado(false)
    setConfigAberto(false)
  }

  // câmera guiada pelas vistas do procedimento
  useEffect(() => {
    setTour(true)
    useUsinaFv.getState().reset()
  }, [setTour])

  // som de campo aberto a 30%, mesma política dos módulos externos: para após
  // 2 min sem interação e religa ao interagir.
  useEffect(() => {
    let parado = false
    let timer: ReturnType<typeof setTimeout>
    const parar = () => {
      if (!parado) {
        parado = true
        ambiente(false)
      }
    }
    const reset = () => {
      if (parado) {
        parado = false
        ambiente(true, 'sounds/campo.mp3', 0.3)
      }
      clearTimeout(timer)
      timer = setTimeout(parar, 120000)
    }
    const ev: (keyof DocumentEventMap)[] = ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart']
    ambiente(true, 'sounds/campo.mp3', 0.3)
    ev.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    timer = setTimeout(parar, 120000)
    return () => {
      clearTimeout(timer)
      ev.forEach((e) => window.removeEventListener(e, reset))
      ambiente(false)
    }
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <HudTopBar onConfig={() => setConfigAberto((v) => !v)} configAberto={configAberto} right={<SoundControl />} />

      {configAberto && (
        <div className="absolute right-3 z-50 pointer-events-auto" style={{ top: 72 }}>
          <div className="hud-glass rounded-[14px] p-4 w-[290px] max-h-[80vh] overflow-y-auto hud-scroll" style={cfgDrag.style}>
            <div className="font-display font-semibold text-[14px] mb-3 select-none" style={{ color: color.text, ...cfgDrag.handleStyle }} {...cfgDrag.handlers}>
              ⠿ Configurações
            </div>
            <Rotulo>Simulação</Rotulo>
            <div className="flex gap-1.5">
              <button onClick={reiniciar} className="flex-1 text-[12px] py-1.5 rounded-[8px]" style={{ ...botao, color: color.accentCool }}>
                ↺ Novo ensaio
              </button>
              <button onClick={() => setView('menu')} className="flex-1 text-[12px] py-1.5 rounded-[8px]" style={{ ...botao, color: color.status.fail }}>
                ✕ Encerrar
              </button>
            </div>
            <Divisor />
            <CenarioPicker />
            <Divisor />
            <SoloPicker />
            <Divisor />
            <MalhaToggle />
            <Divisor />
            <QualityPicker />
            <Calibracao />
          </div>
        </div>
      )}

      {/* DESKTOP */}
      <div className="hidden md:block absolute left-4 bottom-4 pointer-events-auto">
        <GuidedCard />
      </div>
      <div className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
        <PainelEtapa onAbrirLaudo={() => setLaudoFechado(false)} />
      </div>

      {/* MOBILE */}
      <MobileSheet
        onReiniciar={reiniciar}
        tabs={
          <>
            <Tab ativo={aba === 'procedimento'} onClick={() => setAba('procedimento')}>Procedimento</Tab>
            <Tab ativo={aba === 'medicao'} onClick={() => setAba('medicao')}>Medição</Tab>
          </>
        }
      >
        {aba === 'procedimento' ? <GuidedCard /> : <PainelEtapa onAbrirLaudo={() => setLaudoFechado(false)} />}
      </MobileSheet>

      <div className="hidden md:block">
        <Creditos />
      </div>

      {laudo && !laudoFechado && <ResumoLaudo onClose={() => setLaudoFechado(true)} onMenu={() => setView('menu')} onNova={reiniciar} />}
    </div>
  )
}

// ─── Peças visuais pequenas ──────────────────────────────────────────────────

function Rotulo({ children }: { children: ReactNode }) {
  return <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>{children}</div>
}

function Divisor() {
  return <div className="my-3 h-px" style={{ background: color.hairline }} />
}

function Tab({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="flex-1 hud-glass rounded-[10px] py-2 text-[12px] font-medium" style={{ color: ativo ? color.accent : color.textMuted }}>
      {children}
    </button>
  )
}

function Chip({ children, cor = color.accentCool }: { children: ReactNode; cor?: string }) {
  return (
    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ color: cor, border: `1px solid ${cor}55` }}>
      {children}
    </span>
  )
}

function Visor({ valor, unidade, cor }: { valor: string; unidade: string; cor: string }) {
  return (
    <div className="rounded-[10px] px-3 py-2 mb-2 flex items-baseline justify-between" style={{ background: color.surface, border: `1px solid ${color.hairline}` }}>
      <span className="font-mono font-bold text-[30px]" style={{ color: cor }}>{valor}</span>
      <span className="font-mono text-[14px]" style={{ color: color.textMuted }}>{unidade}</span>
    </div>
  )
}

function BotaoPrincipal({ onClick, ativo, children }: { onClick: () => void; ativo: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={!ativo}
      className="flex-1 py-2 rounded-[9px] font-display font-semibold text-[13px]"
      style={{
        background: ativo ? color.accent : color.surface,
        color: ativo ? color.viewport : color.textFaint,
        border: `1px solid ${ativo ? color.accent : color.hairline}`,
        cursor: ativo ? 'pointer' : 'default',
      }}
    >
      {children}
    </button>
  )
}

function Painel({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <div className="instrument-panel rounded-[12px] p-3 w-[340px] max-w-[90vw] max-h-[calc(100dvh-88px)] overflow-y-auto hud-scroll">
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: color.textFaint }}>{titulo}</span>
        {subtitulo && <span className="font-mono text-[10px] truncate" style={{ color: color.textFaint }}>{subtitulo}</span>}
      </div>
      {children}
    </div>
  )
}

function Aviso({ children, cor = color.textFaint }: { children: ReactNode; cor?: string }) {
  return <div className="text-[10.5px] mt-1.5 text-center leading-snug" style={{ color: cor }}>{children}</div>
}

// ─── Cartão guiado ───────────────────────────────────────────────────────────

function GuidedCard() {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const marcarPasso = useSim((s) => s.marcarPasso)
  const irParaPasso = useSim((s) => s.irParaPasso)
  const cumpridos = useSim((s) => s.cumpridos)
  const continuidade = useUsinaFv((s) => s.continuidade)
  const malha = useUsinaFv((s) => s.malha)
  const toquePasso = useUsinaFv((s) => s.toquePasso)
  const emitir = useUsinaFv((s) => s.emitir)
  const habilitado = useSim((s) => {
    const p = s.ensaio.steps[s.passoIndex]
    return p ? passoHabilitado(s, p.id) : false
  })
  const jaCumprido = useSim((s) => {
    const p = s.ensaio.steps[s.passoIndex]
    return p ? !!s.cumpridos[p.id] : false
  })

  const passo = ensaio.steps[passoIndex]
  if (!passo) return null
  const total = ensaio.steps.length
  const ultimo = passoIndex >= total - 1

  // travas próprias de cada ensaio
  const nCont = PONTOS_CONTINUIDADE_FV.filter((p) => continuidade[p.id]).length
  const nTP = PONTOS_TOQUE_PASSO_FV.filter((p) => toquePasso[p.id]).length
  const pendencia =
    passo.id === 'fv-continuidade' && !continuidadeCompleta(continuidade)
      ? { texto: <>meça os <b>{PONTOS_CONTINUIDADE_FV.length} pontos</b> no miliohmímetro (à direita).</>, contador: `${nCont}/${PONTOS_CONTINUIDADE_FV.length}` }
      : passo.id === 'fv-resistencia' && !malha
        ? { texto: <>crave as estacas, registre P a <b>52 %, 62 % e 72 %</b> e clique em <b>Calcular</b>.</>, contador: 'curva' }
        : passo.id === 'fv-toque-passo' && !toquePassoCompleto(toquePasso)
          ? { texto: <>meça os <b>{PONTOS_TOQUE_PASSO_FV.length} pontos</b> de toque e passo.</>, contador: `${nTP}/${PONTOS_TOQUE_PASSO_FV.length}` }
          : null
  const acaoLiberada = habilitado && !pendencia

  const concluir = () => {
    if (passo.id === 'fv-laudo') emitir()
    marcarPasso(passo.id)
  }

  return (
    <div className="hud-glass rounded-[12px] p-3 w-[340px] max-w-[88vw] max-h-[calc(100dvh-88px)] overflow-y-auto hud-scroll">
      <div className="flex items-center gap-1.5 mb-2">
        {ensaio.steps.map((s, i) => {
          const done = !!cumpridos[s.id]
          const cur = i === passoIndex
          return (
            <button
              key={s.id}
              onClick={() => irParaPasso(i)}
              aria-label={`Passo ${i + 1}`}
              className="rounded-full transition-all"
              style={{ width: cur ? 18 : 8, height: 8, background: done ? color.status.pass : cur ? color.accent : color.textFaint }}
            />
          )
        })}
        <span className="ml-1 font-mono text-[10px]" style={{ color: color.textFaint }}>{passoIndex + 1}/{total}</span>
        {passo.norma && <span className="ml-auto text-[9px] truncate" style={{ color: color.textFaint }}>{passo.norma}</span>}
      </div>

      <h2 className="font-display font-semibold text-[15px] mb-1" style={{ color: color.text }}>{passo.titulo}</h2>
      <p className="text-[12px] leading-snug mb-2" style={{ color: color.textMuted }}>{passo.descricao}</p>
      <Detalhes itens={passo.detalhes} className="mb-2.5" />

      {passo.cuidados && passo.cuidados.length > 0 && (
        <div className="rounded-[10px] px-3 py-2 mb-2.5 text-[12px] leading-snug" style={{ background: color.status.marginal + '12', border: `1px solid ${color.status.marginal}44`, color: color.text }}>
          <b style={{ color: color.status.marginal }}>Cuidados:</b> {passo.cuidados.join(' ')}
        </div>
      )}

      {jaCumprido && passo.feito && (
        <div className="rounded-[10px] px-3 py-2 mb-3 text-[12.5px] flex gap-1.5" style={{ background: color.status.pass + '14', border: `1px solid ${color.status.pass}55`, color: color.text }}>
          <span aria-hidden style={{ color: color.status.pass }}>✓</span>
          <span>{passo.feito}</span>
        </div>
      )}

      {pendencia && !jaCumprido && (
        <div className="rounded-[10px] px-3 py-2 mb-3 text-[12px] leading-snug" style={{ background: color.accentCool + '14', border: `1px solid ${color.accentCool}55`, color: color.text }}>
          <b>Como concluir:</b> {pendencia.texto} <span className="font-mono" style={{ color: color.accentCool }}>{pendencia.contador}</span>
        </div>
      )}

      <button
        onClick={concluir}
        disabled={!acaoLiberada || jaCumprido}
        className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
        style={{
          background: jaCumprido ? color.surface : acaoLiberada ? color.accent : color.surface,
          color: jaCumprido ? color.status.pass : acaoLiberada ? color.viewport : color.textFaint,
          border: `1px solid ${jaCumprido ? color.status.pass + '55' : acaoLiberada ? color.accent : color.hairline}`,
          cursor: !acaoLiberada || jaCumprido ? 'default' : 'pointer',
        }}
      >
        {jaCumprido ? '✓ Concluído' : pendencia ? `${passo.acao} (${pendencia.contador})` : passo.acao}
      </button>

      <div className="flex items-center gap-2 mt-2.5">
        <button onClick={() => irParaPasso(passoIndex - 1)} disabled={passoIndex === 0} className="px-3 py-2 rounded-[10px] text-[13px]" style={{ ...botao, color: passoIndex === 0 ? color.textFaint : color.textMuted }}>
          ‹ Voltar
        </button>
        <button
          onClick={() => irParaPasso(passoIndex + 1)}
          disabled={!jaCumprido || ultimo}
          className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[13px]"
          style={{
            background: jaCumprido && !ultimo ? color.accentCool : color.surface,
            color: jaCumprido && !ultimo ? color.viewport : color.textFaint,
            border: `1px solid ${jaCumprido && !ultimo ? color.accentCool : color.hairline}`,
          }}
        >
          {ultimo ? 'Fim' : 'Próximo ›'}
        </button>
      </div>
    </div>
  )
}

// ─── Painel da etapa ─────────────────────────────────────────────────────────

function PainelEtapa({ onAbrirLaudo }: { onAbrirLaudo: () => void }) {
  const etapa = useSim((s) => s.ensaio.steps[s.passoIndex]?.id)
  if (etapa === 'fv-continuidade') return <Miliohmimetro />
  if (etapa === 'fv-resistencia') return <TerrometroFv />
  if (etapa === 'fv-toque-passo') return <MedidorToquePasso />
  return <PainelPlanta onAbrirLaudo={onAbrirLaudo} />
}

/** Dados da usina e atalhos de vista (etapas de preparação e laudo). */
function PainelPlanta({ onAbrirLaudo }: { onAbrirLaudo: () => void }) {
  const laudo = useUsinaFv((s) => s.laudo)
  const solo = useUsinaFv((s) => s.solo)
  const cenario = useUsinaFv((s) => s.cenario)
  const Linha = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
    <div className="flex justify-between gap-2 text-[11.5px] py-0.5">
      <span style={{ color: color.textFaint }}>{rotulo}</span>
      <span className="font-mono text-right" style={{ color: color.textMuted }}>{valor}</span>
    </div>
  )
  const vista = (v: keyof typeof VISTAS_FV) => useView.getState().pedirPose(VISTAS_FV[v])
  return (
    <Painel titulo="Usina FV de solo" subtitulo={`${USINA.potenciaCaKw} kW CA`}>
      <Linha rotulo="Arranjo" valor={`${MODULOS_TOTAL} × ${USINA.moduloWp} Wp = ${POTENCIA_DC_KWP.toFixed(1)} kWp`} />
      <Linha rotulo="Mesas fixas" valor={`${USINA.mesas} × 2P${USINA.modulosPorFileira} · ${USINA.inclinacaoGraus}° norte`} />
      <Linha rotulo="Skid" valor={`${USINA.inversores} inversores × ${USINA.inversorKw} kW + QGBT`} />
      <Linha rotulo="Transformador" valor={`${USINA.trafoKva} kVA · ${USINA.tensaoBtV} V / ${USINA.tensaoMtKv} kV`} />
      <Linha rotulo="Subestação" valor="Cabine de medição e proteção" />
      <Linha rotulo="Malha" valor={`${AREA_MALHA_M2} m² · ${Math.round(comprimentoEnterradoM())} m enterrados`} />
      <Linha rotulo="Rg calculada" valor={`${malhaDoSolo(solo, cenario).rg.toFixed(2)} Ω`} />
      <Linha rotulo="Solo (instrutor)" valor={`${ROTULO_SOLO[solo]} · ${RESISTIVIDADE_SOLO[solo]} Ω·m`} />
      <div className="my-2 h-px" style={{ background: color.hairline }} />
      <MalhaToggle />
      <div className="grid grid-cols-3 gap-1.5 mt-2 text-[11px]">
        {(['geral', 'planta', 'skid', 'trafo', 'estacas'] as const).map((v) => (
          <button key={v} onClick={() => vista(v)} className="rounded-[8px] py-1.5 capitalize" style={{ ...botao, color: color.accentCool }}>
            {v === 'planta' ? 'Vista de cima' : v === 'geral' ? 'Visão geral' : v}
          </button>
        ))}
      </div>
      {laudo && (
        <button onClick={onAbrirLaudo} className="w-full mt-3 py-2 rounded-[9px] font-display font-semibold text-[13px]" style={{ background: color.accent, color: color.viewport }}>
          Abrir laudo
        </button>
      )}
    </Painel>
  )
}

function MalhaToggle() {
  const mostrar = useUsinaFv((s) => s.mostrarMalha)
  const setMostrar = useUsinaFv((s) => s.setMostrarMalha)
  return (
    <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: color.textMuted }}>
      <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} style={{ accentColor: color.accent }} />
      Mostrar malha enterrada (anel, transversais e hastes)
    </label>
  )
}

// ─── Ensaio 1 · miliohmímetro ────────────────────────────────────────────────

function Miliohmimetro() {
  const pontoCont = useUsinaFv((s) => s.pontoCont)
  const continuidade = useUsinaFv((s) => s.continuidade)
  const pontasZeradas = useUsinaFv((s) => s.pontasZeradas)
  const zerarPontas = useUsinaFv((s) => s.zerarPontas)
  const setPontoCont = useUsinaFv((s) => s.setPontoCont)
  const medir = useUsinaFv((s) => s.medirContinuidade)
  const limpar = useUsinaFv((s) => s.limparContinuidade)

  const ponto = getPontoContinuidadeFv(pontoCont)
  const leitura = continuidade[pontoCont]
  const nMedidos = PONTOS_CONTINUIDADE_FV.filter((p) => continuidade[p.id]).length
  const selecionar = (id: string) => {
    setPontoCont(id)
    const v = getPontoContinuidadeFv(id)?.vista
    if (v) useView.getState().pedirPose(v)
  }

  return (
    <Painel titulo="Miliohmímetro · continuidade" subtitulo={`${nMedidos}/${PONTOS_CONTINUIDADE_FV.length} medidos`}>
      <div className="flex items-center justify-between mb-2 text-[10.5px]">
        <span style={{ color: color.textMuted }}>Garra fixa no <b style={{ color: color.text }}>BEP do skid</b></span>
        <span className="font-mono" style={{ color: pontasZeradas ? color.status.pass : color.status.marginal }}>
          {pontasZeradas ? '✓ pontas zeradas' : `⚠ +${R_PONTAS.toFixed(3)} Ω pontas`}
        </span>
      </div>
      {!pontasZeradas && (
        <button onClick={zerarPontas} className="w-full mb-2 py-2 rounded-[9px] text-[12px] font-medium" style={{ ...botao, color: color.accent, border: `1px solid ${color.accent}` }}>
          Zerar pontas (curto entre as garras + REL)
        </button>
      )}

      <Visor valor={leitura ? leitura.display : '- - -'} unidade="Ω" cor={leitura ? CORV[leitura.cor] : color.textFaint} />

      {ponto && (
        <div className="rounded-[10px] px-3 py-2 mb-2 text-[11.5px] leading-snug" style={{ background: color.surface, border: `1px solid ${color.hairline}`, color: color.textMuted }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Chip>{ponto.grupo}</Chip>
            <span className="font-display font-semibold text-[12px]" style={{ color: color.text }}>{ponto.nome}</span>
          </div>
          <div>BEP do skid → {ponto.ate}</div>
          <div className="mt-1" style={{ color: color.textFaint }}>{ponto.dica}</div>
          <div className="font-mono text-[10px] mt-1" style={{ color: color.textFaint }}>
            {ponto.trechos.map((t) => `${t.comprimentoM.toFixed(1)} m · ${t.secaoMm2} mm²`).join(' + ')} · {ponto.conexoes} conexões
            {leitura && ` · R teórica ${formatarLeitura(leitura.rTeorica)} Ω`}
          </div>
        </div>
      )}

      <div className="max-h-[170px] overflow-y-auto hud-scroll pr-0.5">
        {PONTOS_CONTINUIDADE_FV.map((p) => {
          const l = continuidade[p.id]
          const ativo = p.id === pontoCont
          return (
            <button
              key={p.id}
              onClick={() => selecionar(p.id)}
              className="w-full flex items-center gap-2 text-left rounded-[9px] px-2.5 py-1.5 mb-1"
              style={{ background: ativo ? color.accent + '18' : color.surface, border: `1px solid ${ativo ? color.accent : color.hairline}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: l ? CORV[l.cor] : color.textFaint }} />
              <span className="flex-1 text-[11.5px] truncate" style={{ color: ativo ? color.text : color.textMuted }}>{p.nome}</span>
              <span className="font-mono text-[11px]" style={{ color: l ? CORV[l.cor] : color.textFaint }}>{l ? l.display : '—'}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mt-2">
        <BotaoPrincipal onClick={medir} ativo={pontasZeradas}>{leitura ? '↻ Remedir' : '▶ Medir'}</BotaoPrincipal>
        {leitura && (
          <button onClick={() => limpar(pontoCont)} className="px-3 py-2 rounded-[9px] text-[12px]" style={botao}>
            Descartar
          </button>
        )}
      </div>
      {!pontasZeradas && <Aviso cor={color.status.marginal}>Compense as pontas antes de medir — sem isso os cabos entram na leitura.</Aviso>}

      {leitura && (
        <div className="mt-2 rounded-[10px] px-3 py-2" style={{ background: CORV[leitura.cor] + '14', border: `1px solid ${CORV[leitura.cor]}66` }}>
          <div className="font-display font-semibold text-[13px]" style={{ color: CORV[leitura.cor] }}>{leitura.veredito}</div>
          <div className="text-[10.5px] mt-0.5" style={{ color: color.textFaint }}>
            Critério adotado: ≤ {LIMITE_EQUIPOT_CONFORME.toFixed(1)} Ω conforme · ≤ {LIMITE_EQUIPOT_ATENCAO.toFixed(1)} Ω atenção
          </div>
        </div>
      )}
    </Painel>
  )
}

// ─── Ensaio 2 · terrômetro (queda de potencial) ──────────────────────────────

function TerrometroFv() {
  const solo = useUsinaFv((s) => s.solo)
  const cenario = useUsinaFv((s) => s.cenario)
  const distanciaC = useUsinaFv((s) => s.distanciaC)
  const estacasCravadas = useUsinaFv((s) => s.estacasCravadas)
  const posP = useUsinaFv((s) => s.posP)
  const curva = useUsinaFv((s) => s.curva)
  const resultado = useUsinaFv((s) => s.malha)
  const { setDistanciaC, cravarEstacas, setPosP, registrarP, limparCurva, calcularMalha } = useUsinaFv.getState()

  const malha = malhaDoSolo(solo, cenario)
  const rLive = resistenciaAparenteFv(malha, distanciaC, posP)
  const podeCalcular = patamarRegistrado(curva)
  const multiplo = distanciaC / DIAGONAL_MALHA_M
  // P a 52 % precisa estar além da zona de influência da malha ao longo da estrada
  const zona = malha.unit.influenciaEstradaM
  const pForaDaZona = POSICOES_PATAMAR[0] * distanciaC > zona

  return (
    <Painel titulo="Terrômetro · queda de potencial" subtitulo={`E–C ${distanciaC} m`}>
      <Rotulo>Distância da estaca C</Rotulo>
      <div className="grid grid-cols-4 gap-1.5 mb-1">
        {DISTANCIAS_C_M.map((d) => {
          const ativo = d === distanciaC
          return (
            <button
              key={d}
              onClick={() => setDistanciaC(d)}
              className="rounded-[8px] py-1.5 text-[12px] font-mono"
              style={{ background: ativo ? color.accent : color.surface, color: ativo ? color.viewport : color.textMuted, border: `1px solid ${ativo ? color.accent : color.hairline}` }}
            >
              {d} m
            </button>
          )
        })}
      </div>
      <div className="text-[10.5px] mb-2 leading-snug" style={{ color: multiplo >= 4.5 ? color.status.pass : color.textFaint }}>
        ≈ {multiplo.toFixed(1)}× a diagonal da malha ({DIAGONAL_MALHA_M.toFixed(0)} m). Mudar a distância recrava as estacas e apaga a curva.
      </div>
      <div className="text-[10.5px] mb-2 leading-snug rounded-[8px] px-2 py-1.5" style={{ background: color.surface, color: pForaDaZona ? color.status.pass : color.status.marginal }}>
        Zona de influência da malha pela estrada: ~{zona} m de E (potencial acima de 10 % do GPR, faixa âmbar no 3D).
        {pForaDaZona ? ' P a 52 % já fica fora dela.' : ' P a 52 % ainda cai dentro dela — a curva não vai achatar.'}
      </div>

      {!estacasCravadas ? (
        <button onClick={cravarEstacas} className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[13px]" style={{ background: color.accent, color: color.viewport }}>
          Cravar estacas C e P · conectar E
        </button>
      ) : (
        <>
          <Visor valor={rLive.toFixed(2)} unidade="Ω" cor={color.accentCool} />
          <CurvaQueda posP={posP} curva={curva} tracada={resultado?.curva} distanciaC={distanciaC} malha={malha} />

          <div className="mt-2">
            <div className="flex justify-between text-[11px] mb-1" style={{ color: color.textMuted }}>
              <span>Estaca P</span>
              <span className="font-mono">{(posP * 100).toFixed(0)} % · {(posP * distanciaC).toFixed(0)} m de E</span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={posP} onChange={(e) => setPosP(Number(e.target.value))} className="w-full" style={{ accentColor: color.accent }} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {POSICOES_PATAMAR.map((x) => {
              const feito = !!leituraNaPosicao(curva, x)
              return (
                <button key={x} onClick={() => setPosP(x)} className="rounded-[8px] py-1.5 text-[11px] font-mono" style={{ ...botao, color: feito ? color.status.pass : color.accentCool }}>
                  {feito ? '✓ ' : ''}P a {Math.round(x * 100)} %
                </button>
              )
            })}
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={registrarP} className="flex-1 py-2 rounded-[9px] text-[12px] font-medium" style={{ ...botao, color: color.text }}>
              + Registrar ({curva.length})
            </button>
            <BotaoPrincipal onClick={calcularMalha} ativo={podeCalcular}>Calcular</BotaoPrincipal>
          </div>
          {curva.length > 0 && !resultado && (
            <button onClick={limparCurva} className="w-full mt-1.5 text-[10.5px]" style={{ color: color.textFaint }}>Apagar curva</button>
          )}
          {!resultado && (
            <Aviso cor={podeCalcular ? color.accentCool : color.textFaint}>
              {podeCalcular ? 'Patamar registrado — calcule, ou registre mais pontos para ver a curva inteira.' : 'Registre ao menos P a 52 %, 62 % e 72 % para verificar o patamar.'}
            </Aviso>
          )}
        </>
      )}

      {resultado && (
        <div className="mt-2 rounded-[10px] px-3 py-2.5" style={{ background: CORV[resultado.cor] + '14', border: `1px solid ${CORV[resultado.cor]}66` }}>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider" style={{ color: color.textFaint }}>Leitura a 62 %</span>
            <span className="font-mono font-bold text-[20px]" style={{ color: CORV[resultado.cor] }}>{resultado.r62.toFixed(2)} Ω</span>
          </div>
          <div className="font-display font-semibold text-[14px] mt-1" style={{ color: CORV[resultado.cor] }}>{resultado.veredito}</div>
          <div className="flex justify-between text-[11px] mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${color.hairline}`, color: color.textMuted }}>
            <span>Variação 52–72 %</span>
            <span className="font-mono" style={{ color: resultado.patamarOk ? color.status.pass : color.status.marginal }}>
              {resultado.variacaoPct.toFixed(1)} % (≤ {LIMITE_PATAMAR_PCT} %)
            </span>
          </div>
          <div className="text-[10.5px] mt-1 leading-snug" style={{ color: color.textFaint }}>
            {resultado.patamarOk
              ? `Patamar estável: a leitura representa a malha. Critério adotado ≤ ${LIMITE_MALHA_OHM} Ω.`
              : 'Sem patamar: a estaca C está dentro da zona de influência da malha. Afaste-a e repita.'}
          </div>
        </div>
      )}
    </Painel>
  )
}

/** Gráfico R × posição da estaca P, com as posições do patamar marcadas. */
function CurvaQueda({ posP, curva, tracada, distanciaC, malha }: { posP: number; curva: PontoCurvaFv[]; tracada?: PontoCurvaFv[]; distanciaC: number; malha: MalhaFv }) {
  const W = 300
  const H = 112
  const pad = 6
  const maxR = Math.max(malha.rg * 2.2, resistenciaAparenteFv(malha, distanciaC, 0.9))
  const sx = (x: number) => pad + x * (W - 2 * pad)
  const sy = (r: number) => H - pad - (Math.min(r, maxR) / maxR) * (H - 2 * pad)
  const linha = (pts: PontoCurvaFv[]) => pts.map((m) => `${sx(m.x).toFixed(1)},${sy(m.r).toFixed(1)}`).join(' ')
  const rLive = resistenciaAparenteFv(malha, distanciaC, posP)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: color.surface, borderRadius: 8, border: `1px solid ${color.hairline}` }}>
      {/* janela do patamar: 52 % a 72 % */}
      <rect x={sx(POSICOES_PATAMAR[0])} y={pad} width={sx(POSICOES_PATAMAR[2]) - sx(POSICOES_PATAMAR[0])} height={H - 2 * pad} fill={color.status.pass} opacity={0.08} />
      <line x1={sx(POS_62)} y1={pad} x2={sx(POS_62)} y2={H - pad} stroke={color.status.pass} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      <text x={sx(POS_62) + 3} y={pad + 9} fontSize="8" fill={color.status.pass} fontFamily="monospace">62%</text>
      {tracada ? (
        <polyline points={linha(tracada)} fill="none" stroke={color.accentCool} strokeWidth="2" />
      ) : (
        curva.length > 1 && <polyline points={linha(curva)} fill="none" stroke={color.accentCool} strokeWidth="1.6" opacity="0.85" />
      )}
      {curva.map((m, i) => (
        <circle key={i} cx={sx(m.x)} cy={sy(m.r)} r="2.6" fill={color.accent} />
      ))}
      <circle cx={sx(posP)} cy={sy(rLive)} r="3.4" fill={color.text} stroke={color.accent} strokeWidth="1.5" />
      {curva.length === 0 && (
        <text x={W / 2} y={H / 2} fontSize="9" fill={color.textFaint} textAnchor="middle" fontFamily="monospace">
          mova a estaca P e registre os pontos
        </text>
      )}
    </svg>
  )
}

// ─── Ensaio 3 · toque e passo ────────────────────────────────────────────────

function MedidorToquePasso() {
  const pontoTP = useUsinaFv((s) => s.pontoTP)
  const toquePasso = useUsinaFv((s) => s.toquePasso)
  const solo = useUsinaFv((s) => s.solo)
  const setPontoTP = useUsinaFv((s) => s.setPontoTP)
  const medir = useUsinaFv((s) => s.medirTP)
  const ponto = getPontoToquePassoFv(pontoTP)
  const leitura = toquePasso[pontoTP]
  const nMedidos = PONTOS_TOQUE_PASSO_FV.filter((p) => toquePasso[p.id]).length
  const selecionar = (id: string) => {
    setPontoTP(id)
    const v = getPontoToquePassoFv(id)?.vista
    if (v) useView.getState().pedirPose(v)
  }

  return (
    <Painel titulo="Toque e passo · injeção de corrente" subtitulo={`${nMedidos}/${PONTOS_TOQUE_PASSO_FV.length} medidos`}>
      <div className="text-[10.5px] mb-2 leading-snug" style={{ color: color.textMuted }}>
        Injeção de <b>{I_TESTE_A} A</b> na malha; leitura extrapolada para <b>{I_MALHA_A} A</b> de falta (t = {T_ELIMINACAO_S} s).
        Solo {RESISTIVIDADE_SOLO[solo]} Ω·m · brita {RHO_BRITA} Ω·m, {H_BRITA_M * 100} cm.
      </div>

      <Visor valor={leitura ? Math.round(leitura.vFalta).toString() : '- - -'} unidade="V" cor={leitura ? CORV[leitura.cor] : color.textFaint} />

      {ponto && (
        <div className="rounded-[10px] px-3 py-2 mb-2 text-[11.5px] leading-snug" style={{ background: color.surface, border: `1px solid ${color.hairline}`, color: color.textMuted }}>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <Chip cor={ponto.tipo === 'toque' ? color.accent : color.accentCool}>{ponto.tipo}</Chip>
            <Chip cor={color.textMuted}>{ponto.superficie}</Chip>
            <span className="font-display font-semibold text-[12px]" style={{ color: color.text }}>{ponto.nome}</span>
          </div>
          <div>{ponto.local}</div>
          <div className="mt-1" style={{ color: color.textFaint }}>{ponto.dica}</div>
        </div>
      )}

      {leitura && (
        <div className="rounded-[10px] px-3 py-2 mb-2 text-[11px]" style={{ background: color.surface, border: `1px solid ${color.hairline}` }}>
          <div className="flex justify-between" style={{ color: color.textMuted }}><span>Lido com {I_TESTE_A} A</span><span className="font-mono">{leitura.vTeste.toFixed(1)} V</span></div>
          <div className="flex justify-between" style={{ color: color.textMuted }}><span>Extrapolado ({I_MALHA_A} A)</span><span className="font-mono">{Math.round(leitura.vFalta)} V</span></div>
          <div className="flex justify-between" style={{ color: color.textMuted }}><span>Limite suportável</span><span className="font-mono">{Math.round(leitura.limite)} V</span></div>
          <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: color.hairline }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, leitura.razao * 100)}%`, background: CORV[leitura.cor] }} />
          </div>
          <div className="mt-1 font-display font-semibold text-[12.5px]" style={{ color: CORV[leitura.cor] }}>{leitura.veredito}</div>
        </div>
      )}

      <div className="max-h-[150px] overflow-y-auto hud-scroll pr-0.5">
        {PONTOS_TOQUE_PASSO_FV.map((p) => {
          const l = toquePasso[p.id]
          const ativo = p.id === pontoTP
          return (
            <button
              key={p.id}
              onClick={() => selecionar(p.id)}
              className="w-full flex items-center gap-2 text-left rounded-[9px] px-2.5 py-1.5 mb-1"
              style={{ background: ativo ? color.accent + '18' : color.surface, border: `1px solid ${ativo ? color.accent : color.hairline}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: l ? CORV[l.cor] : color.textFaint }} />
              <span className="flex-1 text-[11.5px] truncate" style={{ color: ativo ? color.text : color.textMuted }}>{p.nome}</span>
              <span className="font-mono text-[11px]" style={{ color: l ? CORV[l.cor] : color.textFaint }}>{l ? `${Math.round(l.vFalta)} V` : '—'}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mt-2">
        <BotaoPrincipal onClick={medir} ativo>{leitura ? '↻ Remedir' : '▶ Medir'}</BotaoPrincipal>
      </div>
      <Aviso>Limites pelas expressões da NBR 15751 / IEEE 80 (corpo de 50 kg). Valores de falta são do cenário didático.</Aviso>
      <div className="my-2 h-px" style={{ background: color.hairline }} />
      <LegendaMapa />
    </Painel>
  )
}

/** Escolha e legenda do mapa de potenciais no solo (cena 3D). */
function LegendaMapa() {
  const modo = useUsinaFv((s) => s.mapaPotencial)
  const setModo = useUsinaFv((s) => s.setMapaPotencial)
  const solo = useUsinaFv((s) => s.solo)
  const cenario = useUsinaFv((s) => s.cenario)
  const gpr = malhaDoSolo(solo, cenario).rg * I_MALHA_A
  const gradiente = `linear-gradient(90deg, ${color.usinaFv.escalaPotencial.map(([t, c]) => `${c} ${t * 100}%`).join(', ')})`
  const opcoes = [
    { id: 'potencial', label: 'Potencial' },
    { id: 'seguranca', label: 'Áreas seguras' },
    { id: 'desligado', label: 'Ocultar' },
  ] as const
  return (
    <div>
      <Rotulo>Mapa no solo durante a falta</Rotulo>
      <div className="flex gap-1.5 mb-2">
        {opcoes.map((o) => (
          <button
            key={o.id}
            onClick={() => setModo(o.id)}
            className="flex-1 text-[11px] py-1.5 rounded-[8px]"
            style={{ background: modo === o.id ? color.accent : color.surface, color: modo === o.id ? color.viewport : color.textMuted, border: `1px solid ${modo === o.id ? color.accent : color.hairline}` }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {modo === 'potencial' && (
        <>
          <div className="h-2.5 rounded-full" style={{ background: gradiente }} />
          <div className="flex justify-between font-mono text-[9.5px] mt-1" style={{ color: color.textFaint }}>
            <span>0 V</span>
            <span>{Math.round(gpr / 2)} V</span>
            <span>GPR {Math.round(gpr)} V</span>
          </div>
          <div className="text-[10px] mt-1 leading-snug" style={{ color: color.textFaint }}>
            Potencial da superfície na falta. Toque = GPR − potencial sob os pés: onde o solo fica “frio” (azul) perto de uma massa aterrada, o toque é alto.
          </div>
        </>
      )}
      {modo === 'seguranca' && (
        <div className="text-[10.5px] leading-snug space-y-0.5">
          <div style={{ color: color.status.pass }}>■ toque e passo dentro do limite</div>
          <div style={{ color: color.status.marginal }}>■ toque acima do limite (se houver massa ao alcance)</div>
          <div style={{ color: color.status.fail }}>■ passo acima do limite</div>
          <div className="pt-0.5" style={{ color: color.textFaint }}>Limites com brita no skid/trafo e grama no restante.</div>
        </div>
      )}
    </div>
  )
}

// ─── Laudo ───────────────────────────────────────────────────────────────────

function ResumoLaudo({ onClose, onMenu, onNova }: { onClose: () => void; onMenu: () => void; onNova: () => void }) {
  const laudo = useUsinaFv((s) => s.laudo)
  const solo = useUsinaFv((s) => s.solo)
  const cenario = useUsinaFv((s) => s.cenario)
  if (!laudo) return null
  const cor = laudo.conforme ? color.status.pass : color.status.fail
  const m = laudo.malha
  const rReferencia = malhaDoSolo(solo, cenario).rg

  const Item = ({ rotulo, valor, cor: c }: { rotulo: string; valor: string; cor?: string }) => (
    <div className="rounded-[10px] px-3 py-2" style={{ background: color.surface, border: `1px solid ${color.hairline}` }}>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: color.textFaint }}>{rotulo}</div>
      <div className="font-mono font-bold text-[16px] mt-0.5" style={{ color: c ?? color.text }}>{valor}</div>
    </div>
  )

  return (
    <div className="absolute inset-0 z-[70] grid place-items-center p-4 pointer-events-auto" style={{ background: 'rgba(7,10,14,0.84)', backdropFilter: 'blur(4px)' }}>
      <div className="hud-glass rounded-[16px] p-6 w-[600px] max-w-[94vw] max-h-[92vh] overflow-y-auto hud-scroll">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: color.accent }}>Laudo de ensaio</div>
            <h2 className="font-display font-bold text-[20px]" style={{ color: color.text }}>Aterramento da usina FV · {USINA.potenciaCaKw} kW</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-[18px] leading-none" style={{ color: color.textMuted }}>×</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-3">
          <Item
            rotulo="Continuidade"
            valor={`${laudo.continuidade.aprovados}/${laudo.continuidade.total}`}
            cor={laudo.continuidade.aprovados === laudo.continuidade.total ? color.status.pass : color.status.fail}
          />
          <Item rotulo="Malha (62 %)" valor={m ? `${m.r62.toFixed(2)} Ω` : '—'} cor={m ? CORV[m.cor] : undefined} />
          <Item
            rotulo="Toque e passo"
            valor={`${laudo.toquePasso.aprovados}/${laudo.toquePasso.total}`}
            cor={laudo.toquePasso.aprovados === laudo.toquePasso.total ? color.status.pass : color.status.fail}
          />
        </div>

        {m && (
          <div className="text-[11.5px] mb-3 leading-snug" style={{ color: color.textMuted }}>
            Estaca C a {m.distanciaCM} m · variação do patamar {m.variacaoPct.toFixed(1)} % ({m.patamarOk ? 'estável' : 'sem patamar'}).{' '}
            <span style={{ color: color.textFaint }}>
              Rg calculada da malha (método dos momentos, solo de {RESISTIVIDADE_SOLO[solo]} Ω·m): {rReferencia.toFixed(2)} Ω.
            </span>
          </div>
        )}

        <div className="rounded-[10px] px-3 py-2.5" style={{ background: cor + '14', border: `1px solid ${cor}66` }}>
          <div className="font-display font-semibold text-[15px]" style={{ color: cor }}>
            {laudo.conforme ? 'Aterramento conforme aos critérios adotados' : laudo.completo ? 'Aterramento não conforme' : 'Laudo incompleto'}
          </div>
          <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: color.textMuted }}>{laudo.parecer}</p>
        </div>

        {laudo.achados.length > 0 && (
          <div className="mt-3">
            <Rotulo>Achados e ações</Rotulo>
            {laudo.achados.map((a, i) => (
              <div key={i} className="rounded-[10px] px-3 py-2 mb-2" style={{ background: color.surface, border: `1px solid ${color.status.fail}44` }}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display font-semibold text-[13px]" style={{ color: color.text }}>{a.item}</span>
                  <span className="font-mono text-[12px] shrink-0" style={{ color: color.status.fail }}>{a.leitura}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: color.textFaint }}>{a.ensaio}</div>
                <div className="text-[12px] mt-1" style={{ color: color.textMuted }}><b>Ação:</b> {a.acao}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 text-[10px] flex flex-wrap gap-x-4 gap-y-1" style={{ color: color.textFaint }}>
          <span>Continuidade: NBR 16274 · NBR 16690</span>
          <span>Malha: NBR 15749 (queda de potencial)</span>
          <span>Toque/passo: NBR 15749 · NBR 15751</span>
          <span>Resultado de simulação didática — não é laudo de instalação real</span>
        </div>

        <div className="flex gap-2 mt-5 flex-wrap">
          <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px]" style={botao}>Fechar</button>
          <button onClick={onNova} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[13px]" style={{ ...botao, color: color.accentCool, border: `1px solid ${color.accentCool}` }}>
            ↺ Novo ensaio
          </button>
          <button onClick={onMenu} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[14px]" style={{ background: color.accent, color: color.viewport }}>
            Voltar ao menu
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Instrutor ───────────────────────────────────────────────────────────────

function Opcoes<T extends string>({ titulo, valor, opcoes, onChange, nota }: { titulo: string; valor: T; opcoes: { id: T; label: string }[]; onChange: (v: T) => void; nota?: string }) {
  return (
    <div>
      <Rotulo>{titulo}</Rotulo>
      <div className="flex gap-1.5">
        {opcoes.map((o) => {
          const ativo = valor === o.id
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              className="flex-1 text-[11.5px] py-1.5 rounded-[8px]"
              style={{ background: ativo ? color.accent : color.surface, color: ativo ? color.viewport : color.textMuted, border: `1px solid ${ativo ? color.accent : color.hairline}`, fontWeight: ativo ? 700 : 400 }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {nota && <div className="text-[10px] mt-1.5 leading-snug" style={{ color: color.textFaint }}>{nota}</div>}
    </div>
  )
}

function CenarioPicker() {
  const cenario = useUsinaFv((s) => s.cenario)
  const setCenario = useUsinaFv((s) => s.setCenario)
  return (
    <Opcoes<CenarioFv>
      titulo="Condição da instalação"
      valor={cenario}
      opcoes={[
        { id: 'conforme', label: 'Íntegra' },
        { id: 'com-defeitos', label: 'Com defeitos' },
      ]}
      onChange={setCenario}
      nota="Trocar a condição apaga todas as medições."
    />
  )
}

function SoloPicker() {
  const solo = useUsinaFv((s) => s.solo)
  const setSolo = useUsinaFv((s) => s.setSolo)
  return (
    <Opcoes<PerfilSoloFv>
      titulo="Solo"
      valor={solo}
      opcoes={(Object.keys(RESISTIVIDADE_SOLO) as PerfilSoloFv[]).map((id) => ({ id, label: ROTULO_SOLO[id] }))}
      onChange={setSolo}
      nota="O solo muda a malha: apaga a curva e o toque/passo (a continuidade permanece)."
    />
  )
}

/** Autoria da cena (Codex): pick de coordenada e captura da pose da câmera. */
function Calibracao() {
  const pick = useSim((s) => s.pickMode)
  const setPick = useSim((s) => s.setPickMode)
  const peca = useSim((s) => s.peca)
  const pose = useSim((s) => s.cenaPose)
  const capturar = useSim((s) => s.pedirCaptura)
  return (
    <details className="mt-3 text-[12px]" style={{ color: color.textMuted }}>
      <summary>Calibração do ambiente 3D</summary>
      <button className="w-full rounded p-2 mt-2" style={botao} onClick={() => setPick(!pick)}>
        {pick ? 'Desligar identificação' : 'Identificar ponto'}
      </button>
      {peca && <output className="block font-mono break-all mt-2" style={{ color: color.accentCool }}>{peca}</output>}
      <button className="w-full rounded p-2 mt-2" style={botao} onClick={capturar}>Capturar posição da câmera</button>
      {pose && <output className="block font-mono break-all mt-2" style={{ color: color.accentCool }}>{pose}</output>}
    </details>
  )
}

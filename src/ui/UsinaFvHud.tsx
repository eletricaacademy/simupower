import { ConexoesInbrat } from './ConexoesInbrat'
import { BotaoTestesEmLote } from './BotaoTestesEmLote'
import { VISTA_INBRAT_FV } from '../scene/usinaFvInstrumento'
import { executarEtapaEmLote } from '../sim/testesEmLote'
import { PainelRecolhivel } from './PainelRecolhivel'
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
import { Trans, useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { fmtNum } from '../i18n/numero'
import type { AchadoFv, LeituraContinuidadeFv, LeituraToquePasso, ResultadoMalhaFv } from '../engine/usinaFv'

const CORV: Record<'pass' | 'marginal' | 'fail', string> = {
  pass: color.status.pass,
  marginal: color.status.marginal,
  fail: color.status.fail,
}

const botao = { background: color.surface, color: color.textMuted, border: `1px solid ${color.hairline}` }

// ─── Tradução por id ─────────────────────────────────────────────────────────
// Os textos de `catalog/usinaFvPontos.ts` e as frases da engine continuam em PT
// (fonte); a tela traduz pelo id do ponto e pelos códigos (`cor`, `codigo`).

/** As dez mesas têm id m1…m10 e textos com o mesmo molde. */
const ehMesa = (id: string) => /^m\d+$/.test(id)

function nomeCont(t: TFunction, id: string): string {
  return ehMesa(id) ? t('pontos.mesa.nome', { m: id.toUpperCase() }) : t(`pontos.${id}.nome`)
}
function ateCont(t: TFunction, id: string): string {
  return ehMesa(id) ? t('pontos.mesa.ate', { m: id.toUpperCase() }) : t(`pontos.${id}.ate`)
}
function dicaCont(t: TFunction, id: string): string {
  if (id === 'm4' || id === 'm6') return t(`pontos.${id}.dica`)
  return ehMesa(id) ? t('pontos.mesa.dica') : t(`pontos.${id}.dica`)
}

function vereditoCont(t: TFunction, l: LeituraContinuidadeFv): string {
  return Number.isFinite(l.r) ? t(`cont.veredito.${l.cor}`) : t('cont.veredito.aberto')
}
function vereditoMalha(t: TFunction, m: ResultadoMalhaFv): string {
  return m.valida ? t(`terr.veredito.${m.cor}`) : t('terr.veredito.inconclusivo')
}
function vereditoTP(t: TFunction, l: LeituraToquePasso): string {
  const tipo = getPontoToquePassoFv(l.pontoId)?.tipo ?? 'toque'
  return l.cor === 'marginal' ? t('tp.veredito.marginal') : t(`tp.veredito.${tipo}.${l.aprovado ? 'pass' : 'fail'}`)
}

/** Item, leitura, ensaio e ação de um achado do laudo, no idioma ativo. */
function textoAchado(t: TFunction, a: AchadoFv) {
  const d = a.dados ?? {}
  const grupo = a.codigo.startsWith('cont-') ? 'cont' : a.codigo.startsWith('malha-') ? 'malha' : 'tp'
  const item =
    a.codigo === 'malha-sem-patamar'
      ? t('achado.itemEstacaC', { d: d.distanciaCM })
      : a.codigo === 'malha-alta'
        ? t('achado.itemMalha')
        : grupo === 'cont'
          ? nomeCont(t, a.pontoId!)
          : t(`pontos.${a.pontoId}.nome`)
  const leitura =
    a.codigo === 'malha-sem-patamar'
      ? t('achado.leituraVariacao', { v: fmtNum(d.variacaoPct!, 1) })
      : a.codigo === 'malha-alta'
        ? `${fmtNum(d.r!, 2)} Ω`
        : grupo === 'tp'
          ? `${Math.round(d.vFalta!)} V > ${Math.round(d.limite!)} V`
          : a.leitura
  return { item, leitura, ensaio: t(`achado.ensaio.${grupo}`), acao: t(`achado.acao.${a.codigo}`) }
}

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
  const { t } = useTranslation(['usinaFv', 'common'])

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
              ⠿ {t('common:hud.configuracoes')}
            </div>
            <Rotulo>{t('common:hud.simulacao')}</Rotulo>
            <div className="flex gap-1.5">
              <button onClick={reiniciar} className="flex-1 text-[12px] py-1.5 rounded-[8px]" style={{ ...botao, color: color.accentCool }}>
                {t('common:hud.novoEnsaio')}
              </button>
              <button onClick={() => setView('menu')} className="flex-1 text-[12px] py-1.5 rounded-[8px]" style={{ ...botao, color: color.status.fail }}>
                {t('common:hud.encerrar')}
              </button>
            </div>
            <Divisor />
            <CenarioPicker />
            <Divisor />
            <SoloPicker />
            <Divisor />
            <MalhaToggle />
            <NomesToggle />
            <Divisor />
            <QualityPicker />
            <Calibracao />
          </div>
        </div>
      )}

      {/* DESKTOP */}
      <PainelRecolhivel titulo={t('common:hud.procedimentoMin')} className="hidden md:block absolute left-4 bottom-4 pointer-events-auto">
        <GuidedCard />
      </PainelRecolhivel>
      <PainelRecolhivel titulo={t('common:hud.painelEnsaio')} className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
        <PainelEtapa onAbrirLaudo={() => setLaudoFechado(false)} />
      </PainelRecolhivel>

      {/* MOBILE */}
      <MobileSheet
        onReiniciar={reiniciar}
        tabs={
          <>
            <Tab ativo={aba === 'procedimento'} onClick={() => setAba('procedimento')}>{t('common:hud.procedimento')}</Tab>
            <Tab ativo={aba === 'medicao'} onClick={() => setAba('medicao')}>{t('medicao')}</Tab>
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
  const { t } = useTranslation(['usinaFv', 'common'])
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
      ? { texto: <Trans t={t} i18nKey="guia.pendCont" values={{ n: PONTOS_CONTINUIDADE_FV.length }} components={{ b: <b /> }} />, contador: `${nCont}/${PONTOS_CONTINUIDADE_FV.length}` }
      : passo.id === 'fv-resistencia' && !malha
        ? { texto: <Trans t={t} i18nKey="guia.pendMalha" components={{ b: <b /> }} />, contador: t('guia.curva') }
        : passo.id === 'fv-toque-passo' && !toquePassoCompleto(toquePasso)
          ? { texto: <Trans t={t} i18nKey="guia.pendTP" values={{ n: PONTOS_TOQUE_PASSO_FV.length }} components={{ b: <b /> }} />, contador: `${nTP}/${PONTOS_TOQUE_PASSO_FV.length}` }
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
              aria-label={t('common:hud.passo', { n: i + 1 })}
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
          <b style={{ color: color.status.marginal }}>{t('guia.cuidados')}</b> {passo.cuidados.join(' ')}
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
          <b>{t('guia.comoConcluir')}</b> {pendencia.texto} <span className="font-mono" style={{ color: color.accentCool }}>{pendencia.contador}</span>
        </div>
      )}

      {['fv-continuidade', 'fv-resistencia', 'fv-toque-passo'].includes(passo.id) && <BotaoTestesEmLote habilitado={habilitado} executar={executarEtapaEmLote} detalhe={t('guia.loteDetalhe')} />}

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
        {jaCumprido ? t('common:hud.concluido') : pendencia ? `${passo.acao} (${pendencia.contador})` : passo.acao}
      </button>

      <div className="flex items-center gap-2 mt-2.5">
        <button onClick={() => irParaPasso(passoIndex - 1)} disabled={passoIndex === 0} className="px-3 py-2 rounded-[10px] text-[13px]" style={{ ...botao, color: passoIndex === 0 ? color.textFaint : color.textMuted }}>
          {t('common:hud.voltar')}
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
          {ultimo ? t('common:hud.fim') : t('common:hud.proximo')}
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
  const { t } = useTranslation('usinaFv')
  const Linha = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
    <div className="flex justify-between gap-2 text-[11.5px] py-0.5">
      <span style={{ color: color.textFaint }}>{rotulo}</span>
      <span className="font-mono text-right" style={{ color: color.textMuted }}>{valor}</span>
    </div>
  )
  const vista = (v: keyof typeof VISTAS_FV) => useView.getState().pedirPose(VISTAS_FV[v])
  return (
    <Painel titulo={t('planta.titulo')} subtitulo={t('planta.subtitulo', { kw: USINA.potenciaCaKw })}>
      <Linha rotulo={t('planta.arranjo')} valor={`${MODULOS_TOTAL} × ${USINA.moduloWp} Wp = ${fmtNum(POTENCIA_DC_KWP, 1)} kWp`} />
      <Linha rotulo={t('planta.mesas')} valor={t('planta.mesasValor', { n: USINA.mesas, m: USINA.modulosPorFileira, g: USINA.inclinacaoGraus })} />
      <Linha rotulo={t('planta.skid')} valor={t('planta.skidValor', { n: USINA.inversores, kw: USINA.inversorKw })} />
      <Linha rotulo={t('planta.trafo')} valor={`${USINA.trafoKva} kVA · ${USINA.tensaoBtV} V / ${fmtNum(USINA.tensaoMtKv, 1)} kV`} />
      <Linha rotulo={t('planta.subestacao')} valor={t('planta.subestacaoValor')} />
      <Linha rotulo={t('planta.malha')} valor={t('planta.malhaValor', { a: AREA_MALHA_M2, l: Math.round(comprimentoEnterradoM()) })} />
      <Linha rotulo={t('planta.rg')} valor={`${fmtNum(malhaDoSolo(solo, cenario).rg, 2)} Ω`} />
      <Linha rotulo={t('planta.solo')} valor={`${t(`solo.${solo}`)} · ${RESISTIVIDADE_SOLO[solo]} Ω·m`} />
      <div className="my-2 h-px" style={{ background: color.hairline }} />
      <MalhaToggle />
      <NomesToggle />
      <div className="grid grid-cols-3 gap-1.5 mt-2 text-[11px]">
        {(['geral', 'planta', 'skid', 'trafo', 'estacas'] as const).map((v) => (
          <button key={v} onClick={() => vista(v)} className="rounded-[8px] py-1.5 capitalize" style={{ ...botao, color: color.accentCool }}>
            {t(`planta.vista.${v}`)}
          </button>
        ))}
      </div>
      {laudo && (
        <button onClick={onAbrirLaudo} className="w-full mt-3 py-2 rounded-[9px] font-display font-semibold text-[13px]" style={{ background: color.accent, color: color.viewport }}>
          {t('planta.abrirLaudo')}
        </button>
      )}
    </Painel>
  )
}

function NomesToggle() {
  const mostrar = useUsinaFv((s) => s.mostrarNomes)
  const setMostrar = useUsinaFv((s) => s.setMostrarNomes)
  const { t } = useTranslation('usinaFv')
  return (
    <label className="flex items-center gap-2 mt-2 text-[12px] cursor-pointer" style={{ color: color.textMuted }}>
      <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} style={{ accentColor: color.accent }} />
      {t('toggle.nomes')}
    </label>
  )
}

function MalhaToggle() {
  const mostrar = useUsinaFv((s) => s.mostrarMalha)
  const setMostrar = useUsinaFv((s) => s.setMostrarMalha)
  const { t } = useTranslation('usinaFv')
  return (
    <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: color.textMuted }}>
      <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} style={{ accentColor: color.accent }} />
      {t('toggle.malha')}
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
  const { t } = useTranslation('usinaFv')

  const ponto = getPontoContinuidadeFv(pontoCont)
  const leitura = continuidade[pontoCont]
  const nMedidos = PONTOS_CONTINUIDADE_FV.filter((p) => continuidade[p.id]).length
  const selecionar = (id: string) => {
    setPontoCont(id)
    const v = getPontoContinuidadeFv(id)?.vista
    if (v) useView.getState().pedirPose(v)
  }

  return (
    <Painel titulo={t('cont.titulo')} subtitulo={t('cont.medidos', { n: nMedidos, total: PONTOS_CONTINUIDADE_FV.length })}>
      <ConexoesInbrat />
      <button type="button" onClick={() => useView.getState().pedirPose(VISTA_INBRAT_FV)} className="w-full mb-2 py-2 rounded-[9px] text-[12px]" style={{ ...botao, color: color.accentCool }}>{t('cont.verInbrat')}</button>
      <div className="flex items-center justify-between mb-2 text-[10.5px]">
        <span style={{ color: color.textMuted }}><Trans t={t} i18nKey="cont.garraFixa" components={{ b: <b style={{ color: color.text }} /> }} /></span>
        <span className="font-mono" style={{ color: pontasZeradas ? color.status.pass : color.status.marginal }}>
          {pontasZeradas ? t('cont.pontasZeradas') : t('cont.pontasNao', { r: fmtNum(R_PONTAS, 3) })}
        </span>
      </div>
      {!pontasZeradas && (
        <button onClick={zerarPontas} className="w-full mb-2 py-2 rounded-[9px] text-[12px] font-medium" style={{ ...botao, color: color.accent, border: `1px solid ${color.accent}` }}>
          {t('cont.zerar')}
        </button>
      )}

      <Visor valor={leitura ? leitura.display : '- - -'} unidade="Ω" cor={leitura ? CORV[leitura.cor] : color.textFaint} />

      {ponto && (
        <div className="rounded-[10px] px-3 py-2 mb-2 text-[11.5px] leading-snug" style={{ background: color.surface, border: `1px solid ${color.hairline}`, color: color.textMuted }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Chip>{t(`grupo.${ponto.grupo}`)}</Chip>
            <span className="font-display font-semibold text-[12px]" style={{ color: color.text }}>{nomeCont(t, ponto.id)}</span>
          </div>
          <div>{t('cont.percurso', { ate: ateCont(t, ponto.id) })}</div>
          <div className="mt-1" style={{ color: color.textFaint }}>{dicaCont(t, ponto.id)}</div>
          <div className="font-mono text-[10px] mt-1" style={{ color: color.textFaint }}>
            {ponto.trechos.map((tr) => `${fmtNum(tr.comprimentoM, 1)} m · ${tr.secaoMm2} mm²`).join(' + ')} · {t('cont.conexoes', { n: ponto.conexoes })}
            {leitura && ` · ${t('cont.rTeorica', { r: formatarLeitura(leitura.rTeorica) })}`}
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
              <span className="flex-1 text-[11.5px] truncate" style={{ color: ativo ? color.text : color.textMuted }}>{nomeCont(t, p.id)}</span>
              <span className="font-mono text-[11px]" style={{ color: l ? CORV[l.cor] : color.textFaint }}>{l ? l.display : '—'}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mt-2">
        <BotaoPrincipal onClick={medir} ativo={pontasZeradas}>{leitura ? t('cont.remedir') : t('cont.medir')}</BotaoPrincipal>
        {leitura && (
          <button onClick={() => limpar(pontoCont)} className="px-3 py-2 rounded-[9px] text-[12px]" style={botao}>
            {t('cont.descartar')}
          </button>
        )}
      </div>
      {!pontasZeradas && <Aviso cor={color.status.marginal}>{t('cont.compense')}</Aviso>}

      {leitura && (
        <div className="mt-2 rounded-[10px] px-3 py-2" style={{ background: CORV[leitura.cor] + '14', border: `1px solid ${CORV[leitura.cor]}66` }}>
          <div className="font-display font-semibold text-[13px]" style={{ color: CORV[leitura.cor] }}>{vereditoCont(t, leitura)}</div>
          <div className="text-[10.5px] mt-0.5" style={{ color: color.textFaint }}>
            {t('cont.criterio', { a: fmtNum(LIMITE_EQUIPOT_CONFORME, 1), b: fmtNum(LIMITE_EQUIPOT_ATENCAO, 1) })}
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
  const { t } = useTranslation('usinaFv')

  const malha = malhaDoSolo(solo, cenario)
  const rLive = resistenciaAparenteFv(malha, distanciaC, posP)
  const podeCalcular = patamarRegistrado(curva)
  const multiplo = distanciaC / DIAGONAL_MALHA_M
  // P a 52 % precisa estar além da zona de influência da malha ao longo da estrada
  const zona = malha.unit.influenciaEstradaM
  const pForaDaZona = POSICOES_PATAMAR[0] * distanciaC > zona

  return (
    <Painel titulo={t('terr.titulo')} subtitulo={`E–C ${distanciaC} m`}>
      <Rotulo>{t('terr.distanciaC')}</Rotulo>
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
        {t('terr.multiplo', { k: fmtNum(multiplo, 1), d: fmtNum(DIAGONAL_MALHA_M, 0) })}
      </div>
      <div className="text-[10.5px] mb-2 leading-snug rounded-[8px] px-2 py-1.5" style={{ background: color.surface, color: pForaDaZona ? color.status.pass : color.status.marginal }}>
        {t('terr.zona', { z: fmtNum(zona, 0) })}
        {pForaDaZona ? t('terr.zonaFora') : t('terr.zonaDentro')}
      </div>

      {!estacasCravadas ? (
        <button onClick={cravarEstacas} className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[13px]" style={{ background: color.accent, color: color.viewport }}>
          {t('terr.cravar')}
        </button>
      ) : (
        <>
          <Visor valor={fmtNum(rLive, 2)} unidade="Ω" cor={color.accentCool} />
          <CurvaQueda posP={posP} curva={curva} tracada={resultado?.curva} distanciaC={distanciaC} malha={malha} />

          <div className="mt-2">
            <div className="flex justify-between text-[11px] mb-1" style={{ color: color.textMuted }}>
              <span>{t('terr.estacaP')}</span>
              <span className="font-mono">{t('terr.posP', { p: fmtNum(posP * 100, 0), m: fmtNum(posP * distanciaC, 0) })}</span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={posP} onChange={(e) => setPosP(Number(e.target.value))} className="w-full" style={{ accentColor: color.accent }} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {POSICOES_PATAMAR.map((x) => {
              const feito = !!leituraNaPosicao(curva, x)
              return (
                <button key={x} onClick={() => setPosP(x)} className="rounded-[8px] py-1.5 text-[11px] font-mono" style={{ ...botao, color: feito ? color.status.pass : color.accentCool }}>
                  {feito ? '✓ ' : ''}{t('terr.pA', { p: Math.round(x * 100) })}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={registrarP} className="flex-1 py-2 rounded-[9px] text-[12px] font-medium" style={{ ...botao, color: color.text }}>
              {t('terr.registrar', { n: curva.length })}
            </button>
            <BotaoPrincipal onClick={calcularMalha} ativo={podeCalcular}>{t('terr.calcular')}</BotaoPrincipal>
          </div>
          {curva.length > 0 && !resultado && (
            <button onClick={limparCurva} className="w-full mt-1.5 text-[10.5px]" style={{ color: color.textFaint }}>{t('terr.apagarCurva')}</button>
          )}
          {!resultado && (
            <Aviso cor={podeCalcular ? color.accentCool : color.textFaint}>
              {podeCalcular ? t('terr.patamarRegistrado') : t('terr.registreMin')}
            </Aviso>
          )}
        </>
      )}

      {resultado && (
        <div className="mt-2 rounded-[10px] px-3 py-2.5" style={{ background: CORV[resultado.cor] + '14', border: `1px solid ${CORV[resultado.cor]}66` }}>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider" style={{ color: color.textFaint }}>{t('terr.leitura62')}</span>
            <span className="font-mono font-bold text-[20px]" style={{ color: CORV[resultado.cor] }}>{fmtNum(resultado.r62, 2)} Ω</span>
          </div>
          <div className="font-display font-semibold text-[14px] mt-1" style={{ color: CORV[resultado.cor] }}>{vereditoMalha(t, resultado)}</div>
          <div className="flex justify-between text-[11px] mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${color.hairline}`, color: color.textMuted }}>
            <span>{t('terr.variacao')}</span>
            <span className="font-mono" style={{ color: resultado.patamarOk ? color.status.pass : color.status.marginal }}>
              {t('terr.variacaoValor', { v: fmtNum(resultado.variacaoPct, 1), l: LIMITE_PATAMAR_PCT })}
            </span>
          </div>
          <div className="text-[10.5px] mt-1 leading-snug" style={{ color: color.textFaint }}>
            {resultado.patamarOk
              ? t('terr.patamarOk', { l: LIMITE_MALHA_OHM })
              : t('terr.semPatamar')}
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
  const { t } = useTranslation('usinaFv')
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
          {t('terr.graficoVazio')}
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
  const { t } = useTranslation('usinaFv')
  const ponto = getPontoToquePassoFv(pontoTP)
  const leitura = toquePasso[pontoTP]
  const nMedidos = PONTOS_TOQUE_PASSO_FV.filter((p) => toquePasso[p.id]).length
  const selecionar = (id: string) => {
    setPontoTP(id)
    const v = getPontoToquePassoFv(id)?.vista
    if (v) useView.getState().pedirPose(v)
  }

  return (
    <Painel titulo={t('tp.titulo')} subtitulo={t('cont.medidos', { n: nMedidos, total: PONTOS_TOQUE_PASSO_FV.length })}>
      <div className="text-[10.5px] mb-2 leading-snug" style={{ color: color.textMuted }}>
        <Trans
          t={t}
          i18nKey="tp.intro"
          values={{ it: I_TESTE_A, im: I_MALHA_A, t: fmtNum(T_ELIMINACAO_S, 1), rho: RESISTIVIDADE_SOLO[solo], rb: RHO_BRITA, h: Math.round(H_BRITA_M * 100) }}
          components={{ b: <b /> }}
        />
      </div>

      <Visor valor={leitura ? Math.round(leitura.vFalta).toString() : '- - -'} unidade="V" cor={leitura ? CORV[leitura.cor] : color.textFaint} />

      {ponto && (
        <div className="rounded-[10px] px-3 py-2 mb-2 text-[11.5px] leading-snug" style={{ background: color.surface, border: `1px solid ${color.hairline}`, color: color.textMuted }}>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <Chip cor={ponto.tipo === 'toque' ? color.accent : color.accentCool}>{t(`tp.tipo.${ponto.tipo}`)}</Chip>
            <Chip cor={color.textMuted}>{t(`tp.superficie.${ponto.superficie}`)}</Chip>
            <span className="font-display font-semibold text-[12px]" style={{ color: color.text }}>{t(`pontos.${ponto.id}.nome`)}</span>
          </div>
          <div>{t(`pontos.${ponto.id}.local`)}</div>
          <div className="mt-1" style={{ color: color.textFaint }}>{t(`pontos.${ponto.id}.dica`)}</div>
        </div>
      )}

      {leitura && (
        <div className="rounded-[10px] px-3 py-2 mb-2 text-[11px]" style={{ background: color.surface, border: `1px solid ${color.hairline}` }}>
          <div className="flex justify-between" style={{ color: color.textMuted }}><span>{t('tp.lido', { i: I_TESTE_A })}</span><span className="font-mono">{fmtNum(leitura.vTeste, 1)} V</span></div>
          <div className="flex justify-between" style={{ color: color.textMuted }}><span>{t('tp.extrapolado', { i: I_MALHA_A })}</span><span className="font-mono">{Math.round(leitura.vFalta)} V</span></div>
          <div className="flex justify-between" style={{ color: color.textMuted }}><span>{t('tp.limite')}</span><span className="font-mono">{Math.round(leitura.limite)} V</span></div>
          <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: color.hairline }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, leitura.razao * 100)}%`, background: CORV[leitura.cor] }} />
          </div>
          <div className="mt-1 font-display font-semibold text-[12.5px]" style={{ color: CORV[leitura.cor] }}>{vereditoTP(t, leitura)}</div>
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
              <span className="flex-1 text-[11.5px] truncate" style={{ color: ativo ? color.text : color.textMuted }}>{t(`pontos.${p.id}.nome`)}</span>
              <span className="font-mono text-[11px]" style={{ color: l ? CORV[l.cor] : color.textFaint }}>{l ? `${Math.round(l.vFalta)} V` : '—'}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mt-2">
        <BotaoPrincipal onClick={medir} ativo>{leitura ? t('cont.remedir') : t('cont.medir')}</BotaoPrincipal>
      </div>
      <Aviso>{t('tp.aviso')}</Aviso>
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
  const { t } = useTranslation('usinaFv')
  const gradiente = `linear-gradient(90deg, ${color.usinaFv.escalaPotencial.map(([t, c]) => `${c} ${t * 100}%`).join(', ')})`
  const opcoes = [
    { id: 'potencial', label: t('mapa.potencial') },
    { id: 'relevo', label: t('mapa.relevo') },
    { id: 'seguranca', label: t('mapa.seguranca') },
    { id: 'desligado', label: t('mapa.desligado') },
  ] as const
  return (
    <div>
      <Rotulo>{t('mapa.titulo')}</Rotulo>
      <NomesToggle />
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
      {(modo === 'potencial' || modo === 'relevo') && (
        <>
          <div className="h-2.5 rounded-full" style={{ background: gradiente }} />
          <div className="flex justify-between font-mono text-[9.5px] mt-1" style={{ color: color.textFaint }}>
            <span>0 V</span>
            <span>{Math.round(gpr / 2)} V</span>
            <span>{t('mapa.gpr', { v: Math.round(gpr) })}</span>
          </div>
          <div className="text-[10px] mt-1 leading-snug" style={{ color: color.textFaint }}>
            {modo === 'relevo'
              ? t('mapa.textoRelevo')
              : t('mapa.textoPotencial')}
          </div>
        </>
      )}
      {modo === 'seguranca' && (
        <div className="text-[10.5px] leading-snug space-y-0.5">
          <div style={{ color: color.status.pass }}>{t('mapa.segOk')}</div>
          <div style={{ color: color.status.marginal }}>{t('mapa.segToque')}</div>
          <div style={{ color: color.status.fail }}>{t('mapa.segPasso')}</div>
          <div className="pt-0.5" style={{ color: color.textFaint }}>{t('mapa.segNota')}</div>
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
  const { t } = useTranslation(['usinaFv', 'common'])
  if (!laudo) return null
  const cor = laudo.conforme ? color.status.pass : color.status.fail
  const m = laudo.malha
  const rReferencia = malhaDoSolo(solo, cenario).rg
  // parecer montado a partir dos dados do laudo (a frase da engine fica em PT)
  const parecer = !laudo.completo
    ? t('laudo.parecerIncompleto')
    : laudo.conforme
      ? t('laudo.parecerConforme', { n: laudo.continuidade.total, r: fmtNum(m!.r62, 2) })
      : t('laudo.parecerNaoConforme', { n: laudo.achados.length })

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
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: color.accent }}>{t('laudo.titulo')}</div>
            <h2 className="font-display font-bold text-[20px]" style={{ color: color.text }}>{t('laudo.subtitulo', { kw: USINA.potenciaCaKw })}</h2>
          </div>
          <button onClick={onClose} aria-label={t('common:hud.fechar')} className="text-[18px] leading-none" style={{ color: color.textMuted }}>×</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-3">
          <Item
            rotulo={t('laudo.continuidade')}
            valor={`${laudo.continuidade.aprovados}/${laudo.continuidade.total}`}
            cor={laudo.continuidade.aprovados === laudo.continuidade.total ? color.status.pass : color.status.fail}
          />
          <Item rotulo={t('laudo.malha62')} valor={m ? `${fmtNum(m.r62, 2)} Ω` : '—'} cor={m ? CORV[m.cor] : undefined} />
          <Item
            rotulo={t('laudo.toquePasso')}
            valor={`${laudo.toquePasso.aprovados}/${laudo.toquePasso.total}`}
            cor={laudo.toquePasso.aprovados === laudo.toquePasso.total ? color.status.pass : color.status.fail}
          />
        </div>

        {m && (
          <div className="text-[11.5px] mb-3 leading-snug" style={{ color: color.textMuted }}>
            {t('laudo.resumoMalha', { d: m.distanciaCM, v: fmtNum(m.variacaoPct, 1), estado: m.patamarOk ? t('laudo.estavel') : t('laudo.semPatamar') })}{' '}
            <span style={{ color: color.textFaint }}>
              {t('laudo.rgRef', { rho: RESISTIVIDADE_SOLO[solo], rg: fmtNum(rReferencia, 2) })}
            </span>
          </div>
        )}

        <div className="rounded-[10px] px-3 py-2.5" style={{ background: cor + '14', border: `1px solid ${cor}66` }}>
          <div className="font-display font-semibold text-[15px]" style={{ color: cor }}>
            {laudo.conforme ? t('laudo.conforme') : laudo.completo ? t('laudo.naoConforme') : t('laudo.incompleto')}
          </div>
          <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: color.textMuted }}>{parecer}</p>
        </div>

        {laudo.achados.length > 0 && (
          <div className="mt-3">
            <Rotulo>{t('laudo.achados')}</Rotulo>
            {laudo.achados.map((a, i) => {
              const tx = textoAchado(t, a)
              return (
                <div key={i} className="rounded-[10px] px-3 py-2 mb-2" style={{ background: color.surface, border: `1px solid ${color.status.fail}44` }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display font-semibold text-[13px]" style={{ color: color.text }}>{tx.item}</span>
                    <span className="font-mono text-[12px] shrink-0" style={{ color: color.status.fail }}>{tx.leitura}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: color.textFaint }}>{tx.ensaio}</div>
                  <div className="text-[12px] mt-1" style={{ color: color.textMuted }}><b>{t('laudo.acao')}</b> {tx.acao}</div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-3 text-[10px] flex flex-wrap gap-x-4 gap-y-1" style={{ color: color.textFaint }}>
          <span>{t('laudo.rodape.continuidade')}</span>
          <span>{t('laudo.rodape.malha')}</span>
          <span>{t('laudo.rodape.toquePasso')}</span>
          <span>{t('laudo.rodape.didatico')}</span>
        </div>

        <div className="flex gap-2 mt-5 flex-wrap">
          <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px]" style={botao}>{t('common:hud.fechar')}</button>
          <button onClick={onNova} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[13px]" style={{ ...botao, color: color.accentCool, border: `1px solid ${color.accentCool}` }}>
            {t('common:hud.novoEnsaio')}
          </button>
          <button onClick={onMenu} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[14px]" style={{ background: color.accent, color: color.viewport }}>
            {t('common:hud.voltarMenu')}
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
  const { t } = useTranslation('usinaFv')
  return (
    <Opcoes<CenarioFv>
      titulo={t('instrutor.condicao')}
      valor={cenario}
      opcoes={[
        { id: 'conforme', label: t('instrutor.integra') },
        { id: 'com-defeitos', label: t('instrutor.comDefeitos') },
      ]}
      onChange={setCenario}
      nota={t('instrutor.notaCondicao')}
    />
  )
}

function SoloPicker() {
  const solo = useUsinaFv((s) => s.solo)
  const setSolo = useUsinaFv((s) => s.setSolo)
  const { t } = useTranslation('usinaFv')
  return (
    <Opcoes<PerfilSoloFv>
      titulo={t('instrutor.solo')}
      valor={solo}
      opcoes={(Object.keys(RESISTIVIDADE_SOLO) as PerfilSoloFv[]).map((id) => ({ id, label: t(`solo.${id}`) }))}
      onChange={setSolo}
      nota={t('instrutor.notaSolo')}
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
  const { t } = useTranslation('usinaFv')
  return (
    <details className="mt-3 text-[12px]" style={{ color: color.textMuted }}>
      <summary>{t('calibracao.titulo')}</summary>
      <button className="w-full rounded p-2 mt-2" style={botao} onClick={() => setPick(!pick)}>
        {pick ? t('calibracao.desligar') : t('calibracao.identificar')}
      </button>
      {peca && <output className="block font-mono break-all mt-2" style={{ color: color.accentCool }}>{peca}</output>}
      <button className="w-full rounded p-2 mt-2" style={botao} onClick={capturar}>{t('calibracao.capturar')}</button>
      {pose && <output className="block font-mono break-all mt-2" style={{ color: color.accentCool }}>{pose}</output>}
    </details>
  )
}

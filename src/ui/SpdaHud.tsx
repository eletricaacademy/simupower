import { BotaoTestesEmLote } from './BotaoTestesEmLote'
import { ConexoesInbrat } from './ConexoesInbrat'
import { executarEtapaEmLote } from '../sim/testesEmLote'
import { PainelRecolhivel } from './PainelRecolhivel'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { fmtNum } from '../i18n/numero'
import { useSim, passoHabilitado } from '../sim/store'
import { useSpda, todosMedidos } from '../sim/spdaStore'
import {
  LIMITE_CONFORME,
  LIMITE_ATENCAO,
  R_PONTAS,
  type CenarioSPDA,
} from '../engine/spda'
import { SPDA_PONTOS, getPontoSPDA, type PontoSPDA } from '../catalog/spdaPontos'
import { SPDA_DIAGNOSTICOS } from '../catalog/spdaDiagnostico'
import { ambiente } from './sons'
import { QualityPicker } from './QualityPicker'
import { SoundControl } from './SoundControl'
import { HudTopBar } from './HudTopBar'
import { Creditos } from './Creditos'
import { useDraggable } from './useDraggable'
import { MobileSheet } from './MobileSheet'
import { Detalhes } from './Detalhes'
import { color } from '../design/tokens'
import { SpdaCalibracao } from '../scene/SpdaCalibracao'
import { useView } from '../sim/viewStore'
import { useSpdaDiagnostico } from '../sim/spdaDiagnosticoStore'

const CORV: Record<'pass' | 'marginal' | 'fail', string> = {
  pass: color.status.pass,
  marginal: color.status.marginal,
  fail: color.status.fail,
}

/** Leitura como o visor mostra (mesma regra de `formatarLeitura`), no separador do idioma. */
function fmtLeitura(r: number): string {
  if (!Number.isFinite(r)) return 'OL'
  return fmtNum(r, r < 1 ? 3 : 2)
}

/** Número com as casas que ele já tem (9.5 → "9,5"; 12 → "12"), no separador do idioma. */
function fmtLivre(v: number): string {
  return fmtNum(v, (String(v).split('.')[1] ?? '').length)
}

/**
 * Textos do trecho montados por id/par/nível: o catálogo guarda o nome em PT
 * (`spdaPontos.ts` não é editado para traduzir), a UI recompõe no idioma ativo.
 */
function nomePonto(p: PontoSPDA, t: TFunction): string {
  if (p.nivel === 'bep') return t('spda:ponto.bepNome')
  if (p.nivel && p.par) return t('spda:ponto.nome', { par: p.par, nivel: t(`spda:nivel.${p.nivel}`) })
  return p.nome
}
function extremosPonto(p: PontoSPDA, t: TFunction): { de: string; ate: string } {
  if (p.nivel === 'bep') return { de: t('spda:ponto.bepDe'), ate: t('spda:ponto.bepAte') }
  if (p.nivel && p.par) {
    const [a, b] = p.par.split('–')
    const nivel = t(`spda:nivelMin.${p.nivel}`)
    return { de: t('spda:ponto.terminal', { d: a, nivel }), ate: t('spda:ponto.terminal', { d: b, nivel }) }
  }
  return { de: p.de, ate: p.ate }
}

/**
 * SpdaHud — ensaio de CONTINUIDADE DO SPDA (NBR 5419-3).
 * Passos guiados à esquerda; miliohmímetro com a lista de trechos à direita.
 */
export function SpdaHud() {
  const { t } = useTranslation(['spda', 'common'])
  const [configAberto, setConfigAberto] = useState(false)
  const [aba, setAba] = useState<'procedimento' | 'medicao'>('procedimento')
  const [laudoFechado, setLaudoFechado] = useState(false)
  const [diagnosticoAberto, setDiagnosticoAberto] = useState(false)
  const laudo = useSpda((s) => s.laudo)
  const stepAtual = useSim((s) => s.ensaio.steps[s.passoIndex]?.id)
  // o instrumento aparece a partir da preparação (zerar pontas)
  const mostrarPainel = stepAtual === 'spda-zerar' || stepAtual === 'spda-medir' || !!laudo
  const setView = useSim((s) => s.setView)
  const setTour = useSim((s) => s.setTour)
  const resetSpda = useSpda((s) => s.reset)
  const cfgDrag = useDraggable()

  const reiniciar = () => {
    useSpda.getState().reset()
    useSim.getState().reset()
    setTour(true)
    setLaudoFechado(false)
    setDiagnosticoAberto(false)
    useSpdaDiagnostico.getState().setAtivo(null)
    setConfigAberto(false)
  }

  // câmera guiada por etapa (vistas gravadas no procedimento)
  useEffect(() => {
    setTour(true)
    resetSpda()
  }, [setTour, resetSpda])

  // som ambiente de campo aberto a 30% — mesma política do módulo de
  // aterramento: para após 2 min sem interação e religa ao interagir.
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

      {!diagnosticoAberto && (
        <button
          aria-label={t('fotos.iniciar')}
          onClick={() => {
            setConfigAberto(false)
            setDiagnosticoAberto(true)
          }}
          className="absolute left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-3 rounded-[14px] px-4 py-3 text-left shadow-xl transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ top: 68, width: 'min(360px, calc(100% - 32px))', background: color.accent, color: color.viewport, border: `2px solid ${color.accent}` }}
        >
          <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="shrink-0">
            <path d="M4 6h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="flex-1">
            <span className="block font-display font-bold text-[16px] md:text-[17px] leading-tight">{t('fotos.iniciar')}</span>
            <span className="block text-[11px] mt-1 leading-snug">{t('fotos.sub')}</span>
          </span>
          <span aria-hidden="true" className="text-[25px] leading-none">›</span>
        </button>
      )}

      {configAberto && (
        <div className="absolute right-3 z-50 pointer-events-auto" style={{ top: 72 }}>
          <div className="hud-glass rounded-[14px] p-4 w-[280px] max-h-[80vh] overflow-y-auto hud-scroll" style={cfgDrag.style}>
            <div
              className="font-display font-semibold text-[14px] mb-3 select-none"
              style={{ color: color.text, ...cfgDrag.handleStyle }}
              {...cfgDrag.handlers}
            >
              ⠿ {t('common:hud.configuracoes')}
            </div>
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>{t('common:hud.simulacao')}</div>
            <div className="flex gap-1.5">
              <button onClick={reiniciar} className="flex-1 text-[12px] py-1.5 rounded-[8px]" style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}>
                {t('common:hud.novoEnsaio')}
              </button>
              <button onClick={() => setView('menu')} className="flex-1 text-[12px] py-1.5 rounded-[8px]" style={{ background: '#0c1117', color: color.status.fail, border: `1px solid ${color.hairline}` }}>
                {t('common:hud.encerrar')}
              </button>
            </div>
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <CenarioPicker />
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <QualityPicker />
            <SpdaCalibracao />
          </div>
        </div>
      )}

      {/* DESKTOP */}
      <PainelRecolhivel titulo={t('common:hud.procedimentoMin')} className={`${diagnosticoAberto ? 'hidden' : 'hidden md:block'} absolute left-4 bottom-4 pointer-events-auto`}>
        <GuidedCard />
      </PainelRecolhivel>

      {mostrarPainel && !diagnosticoAberto && (
        <PainelRecolhivel titulo={t('common:hud.painelEnsaio')} className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
          <Miliohmimetro />
        </PainelRecolhivel>
      )}

      {/* MOBILE */}
      {!diagnosticoAberto && <MobileSheet
        onReiniciar={reiniciar}
        tabs={
          <>
            <Tab ativo={aba === 'procedimento'} onClick={() => setAba('procedimento')}>{t('common:hud.procedimento')}</Tab>
            <Tab ativo={aba === 'medicao'} onClick={() => setAba('medicao')}>{t('medicao')}</Tab>
          </>
        }
      >
        {aba === 'procedimento' ? (
          <GuidedCard />
        ) : mostrarPainel ? (
          <Miliohmimetro />
        ) : (
          <div className="hud-glass rounded-[14px] p-4 w-[330px] max-w-[90vw] text-[12px] text-center" style={{ color: color.textFaint }}>
            {t('semPainel')}
          </div>
        )}
      </MobileSheet>}

      <div className="hidden md:block">
        <Creditos />
      </div>

      {diagnosticoAberto && <DiagnosticoFotografico onClose={() => setDiagnosticoAberto(false)} />}

      {laudo && !laudoFechado && !diagnosticoAberto && (
        <ResumoLaudo onClose={() => setLaudoFechado(true)} onMenu={() => setView('menu')} onNova={reiniciar} />
      )}
    </div>
  )
}

function Tab({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex-1 hud-glass rounded-[10px] py-2 text-[12px] font-medium" style={{ color: ativo ? color.accent : color.textMuted }}>
      {children}
    </button>
  )
}

/** Cartão guiado dos passos (com as travas próprias do ensaio de SPDA). */
function GuidedCard() {
  const { t } = useTranslation(['spda', 'common'])
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const marcarPasso = useSim((s) => s.marcarPasso)
  const irParaPasso = useSim((s) => s.irParaPasso)
  const cumpridos = useSim((s) => s.cumpridos)
  const medicoes = useSpda((s) => s.medicoes)
  const zerarPontas = useSpda((s) => s.zerarPontas)
  const emitir = useSpda((s) => s.emitir)
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
  const nMedidos = SPDA_PONTOS.filter((p) => medicoes[p.id]).length
  const faltaMedir = passo.id === 'spda-medir' && !todosMedidos(medicoes)
  const acaoLiberada = habilitado && !faltaMedir

  // ações que mexem no estado do ensaio antes de marcar o passo
  const concluir = () => {
    if (passo.id === 'spda-zerar') zerarPontas()
    if (passo.id === 'spda-laudo') emitir()
    marcarPasso(passo.id)
  }

  return (
    <div className="hud-glass rounded-[12px] p-3 w-[330px] max-w-[88vw] max-h-[calc(100dvh-88px)] overflow-y-auto hud-scroll">
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
              style={{ width: cur ? 18 : 8, height: 8, background: done ? color.status.pass : cur ? color.accent : '#2a3340' }}
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
          <b style={{ color: color.status.marginal }}>{t('cuidados')}</b> {passo.cuidados.join(' ')}
        </div>
      )}

      {jaCumprido && passo.feito && (
        <div className="rounded-[10px] px-3 py-2 mb-3 text-[12.5px] flex gap-1.5" style={{ background: color.status.pass + '14', border: `1px solid ${color.status.pass}55`, color: color.text }}>
          <span aria-hidden style={{ color: color.status.pass }}>✓</span>
          <span>{passo.feito}</span>
        </div>
      )}

      {faltaMedir && !jaCumprido && (
        <div className="rounded-[10px] px-3 py-2 mb-3 text-[12px] leading-snug" style={{ background: color.accentCool + '14', border: `1px solid ${color.accentCool}55`, color: color.text }}>
          <Trans t={t} i18nKey="comoConcluir" components={{ b: <b /> }} />{' '}
          <span className="font-mono" style={{ color: color.accentCool }}>{t('trechosDe', { n: nMedidos, total: SPDA_PONTOS.length })}</span>.
        </div>
      )}

      {passo.id === 'spda-medir' && <BotaoTestesEmLote habilitado={habilitado} executar={executarEtapaEmLote} detalhe={t('loteDetalhe')} />}

      <button
        onClick={concluir}
        disabled={!acaoLiberada || jaCumprido}
        className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
        style={{
          background: jaCumprido ? '#0c1117' : acaoLiberada ? color.accent : '#0c1117',
          color: jaCumprido ? color.status.pass : acaoLiberada ? '#0B0F14' : color.textFaint,
          border: `1px solid ${jaCumprido ? color.status.pass + '55' : acaoLiberada ? color.accent : color.hairline}`,
          cursor: !acaoLiberada || jaCumprido ? 'default' : 'pointer',
        }}
      >
        {jaCumprido ? t('common:hud.concluido') : faltaMedir ? t('concluirMedicoes', { n: nMedidos, total: SPDA_PONTOS.length }) : passo.acao}
      </button>

      <div className="flex items-center gap-2 mt-2.5">
        <button onClick={() => irParaPasso(passoIndex - 1)} disabled={passoIndex === 0} className="px-3 py-2 rounded-[10px] text-[13px]" style={{ background: '#0c1117', color: passoIndex === 0 ? color.textFaint : color.textMuted, border: `1px solid ${color.hairline}` }}>
          {t('common:hud.voltar')}
        </button>
        <button onClick={() => irParaPasso(passoIndex + 1)} disabled={!jaCumprido || ultimo} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[13px]" style={{ background: jaCumprido && !ultimo ? color.accentCool : '#0c1117', color: jaCumprido && !ultimo ? '#0B0F14' : color.textFaint, border: `1px solid ${jaCumprido && !ultimo ? color.accentCool : color.hairline}` }}>
          {ultimo ? t('common:hud.fim') : t('common:hud.proximo')}
        </button>
      </div>
    </div>
  )
}

/** Instrumento: seleção do trecho, leitura de continuidade e registro. */
function Miliohmimetro() {
  const { t } = useTranslation('spda')
  const pontoAtivo = useSpda((s) => s.pontoAtivo)
  const medicoes = useSpda((s) => s.medicoes)
  const pontasZeradas = useSpda((s) => s.pontasZeradas)
  const setPontoAtivo = useSpda((s) => s.setPontoAtivo)
  const medir = useSpda((s) => s.medir)
  const limparMedicao = useSpda((s) => s.limparMedicao)
  const fluxoAtivo = useSpda((s) => s.fluxoAtivo)
  const setFluxoAtivo = useSpda((s) => s.setFluxoAtivo)
  const stepAtual = useSim((s) => s.ensaio.steps[s.passoIndex]?.id)

  const ponto = getPontoSPDA(pontoAtivo)
  const leitura = medicoes[pontoAtivo]
  const podeMedir = pontasZeradas && stepAtual === 'spda-medir'
  const nMedidos = SPDA_PONTOS.filter((p) => medicoes[p.id]).length

  return (
    <div className="instrument-panel rounded-[12px] p-3 w-[330px] max-w-[90vw] max-h-[calc(100dvh-88px)] overflow-y-auto hud-scroll" style={{ borderTop: `4px solid ${color.inbrat.maleta}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-bold text-[16px]" style={{ color: color.text }}>inbrat <span className="font-mono text-[10px] font-normal">INMD1 PRO</span></span>
        <button className="text-[10px] rounded px-2 py-1" style={{ color: color.text, background: color.inbrat.painel }} onClick={() => useView.getState().pedir('foco')}>{t('instrumento.ver3d')}</button>
      </div>
      <div className="flex items-center justify-between text-[10px] mb-2" style={{ color: color.textMuted }}>
        <span>{t('instrumento.simulacao')}</span>
        <button onClick={() => useView.getState().pedir('quadro')} style={{ color: color.accentCool }}>{t('instrumento.verConexao')}</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-2 text-[11px]" style={{ color: color.accentCool }}>
        <button onClick={() => useView.getState().pedir('origem')}>{t('instrumento.verGarra1')}</button>
        <button onClick={() => useView.getState().pedir('quadro')}>{t('instrumento.verGarra2')}</button>
        {ponto?.nivel && ponto.nivel !== 'bep' && <button className="w-full rounded px-2 py-2" style={{ background: color.surface, border: `1px solid ${color.hairline}` }}
          onClick={() => { const outro = SPDA_PONTOS.find(p => p.par === ponto.par && p.nivel !== ponto.nivel); if (outro) setPontoAtivo(outro.id) }}>
          {ponto.nivel === 'superior' ? t('instrumento.moverBaixo') : t('instrumento.moverCima')}
        </button>}
        <button onClick={() => { if (pontoAtivo === 'eq-bep') useView.getState().pedir('quadro'); else setPontoAtivo('eq-bep') }}>{t('instrumento.entrarBep')}</button>
      </div>
      {stepAtual === 'spda-medir' && leitura && Number.isFinite(leitura.r) && <div className="rounded p-2 mb-2 text-[11px]" style={{ background: color.surface, color: color.textMuted }}>
        <div className="flex flex-wrap gap-3 mb-1" style={{ color: color.accentCool }}>
          <button onClick={() => setFluxoAtivo(!fluxoAtivo)} aria-pressed={fluxoAtivo}>{fluxoAtivo ? t('instrumento.ocultarFluxo') : t('instrumento.mostrarFluxo')}</button>
          <button onClick={() => useView.getState().pedir('fluxo')}>{t('instrumento.verPercurso')}</button>
        </div>
        <p><span style={{ color: color.accent }}>{t('instrumento.fluxoC1')}</span> → <span style={{ color: color.accentCool }}>{t('instrumento.fluxoC2')}</span></p>
        <p>{t('instrumento.fluxoP')}</p>
        <p>{ponto?.nivel === 'inferior' ? t('instrumento.anelEnterrado') : t('instrumento.percursoVisivel')}</p>
      </div>}
      <ConexoesInbrat />
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: color.textFaint }}>
          {t('instrumento.funcao')}
        </span>
        <span className="font-mono text-[10px]" style={{ color: pontasZeradas ? color.status.pass : color.status.marginal }}>
          {pontasZeradas ? t('instrumento.pontasZeradas') : t('instrumento.pontasNaoZeradas', { r: fmtNum(R_PONTAS, 3) })}
        </span>
      </div>

      {/* visor */}
      <div className="rounded-[10px] px-3 py-2 mb-2 flex items-baseline justify-between" style={{ background: '#0c1117', border: `1px solid ${color.hairline}` }}>
        <span className="font-mono font-bold text-[30px]" style={{ color: leitura ? CORV[leitura.cor] : color.textFaint }}>
          {leitura ? fmtLeitura(leitura.r) : '- - -'}
        </span>
        <span className="font-mono text-[14px]" style={{ color: color.textMuted }}>Ω</span>
      </div>

      {/* trecho selecionado */}
      {ponto && (
        <div className="rounded-[10px] px-3 py-2 mb-2 text-[11.5px] leading-snug" style={{ background: '#0c1117', border: `1px solid ${color.hairline}`, color: color.textMuted }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: color.accentCool, border: `1px solid ${color.accentCool}55` }}>
              {t(`subsistema.${ponto.subsistema}`)}
            </span>
            <span className="font-display font-semibold text-[12px]" style={{ color: color.text }}>{nomePonto(ponto, t)}</span>
          </div>
          <div>{extremosPonto(ponto, t).de} → {extremosPonto(ponto, t).ate}</div>
          <div className="font-mono text-[10px] mt-1" style={{ color: color.textFaint }}>
            {ponto.ramos ? t('instrumento.serie', { l: fmtNum(ponto.comprimentoM, 2) }) : t('instrumento.comprimento', { l: fmtLivre(ponto.comprimentoM) })} · {t(`material.${ponto.material}`)} {ponto.secaoMm2} mm²
            {leitura && t('instrumento.rTeorica', { r: fmtLeitura(leitura.rTeorica) })}
          </div>
        </div>
      )}

      {/* lista dos trechos */}
      <div className="max-h-[190px] overflow-y-auto hud-scroll pr-0.5">
        {SPDA_PONTOS.map((p) => {
          const l = medicoes[p.id]
          const ativo = p.id === pontoAtivo
          return (
            <button
              key={p.id}
              onClick={() => setPontoAtivo(p.id)}
              className="w-full flex items-center gap-2 text-left rounded-[9px] px-2.5 py-1.5 mb-1"
              style={{
                background: ativo ? color.accent + '18' : '#0c1117',
                border: `1px solid ${ativo ? color.accent : color.hairline}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: l ? CORV[l.cor] : '#2a3340' }} />
              <span className="flex-1 text-[11.5px] truncate" style={{ color: ativo ? color.text : color.textMuted }}>
                {p.grupo === 'Cruzadas' ? t('instrumento.cruzada') : ''}{nomePonto(p, t)}
              </span>
              <span className="font-mono text-[11px]" style={{ color: l ? CORV[l.cor] : color.textFaint }}>
                {l ? fmtLeitura(l.r) : '—'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={medir}
          disabled={!podeMedir}
          className="flex-1 py-2 rounded-[9px] font-display font-semibold text-[13px]"
          style={{
            background: podeMedir ? color.accent : '#0c1117',
            color: podeMedir ? '#0B0F14' : color.textFaint,
            border: `1px solid ${podeMedir ? color.accent : color.hairline}`,
            cursor: podeMedir ? 'pointer' : 'default',
          }}
        >
          {leitura ? t('instrumento.remedir') : t('instrumento.medir')}
        </button>
        {leitura && (
          <button onClick={() => limparMedicao(pontoAtivo)} className="px-3 py-2 rounded-[9px] text-[12px]" style={{ background: '#0c1117', color: color.textMuted, border: `1px solid ${color.hairline}` }}>
            {t('instrumento.descartar')}
          </button>
        )}
      </div>

      {!pontasZeradas && (
        <div className="text-[10.5px] mt-1.5 text-center leading-snug" style={{ color: color.status.marginal }}>
          {t('instrumento.compense')}
        </div>
      )}
      {pontasZeradas && stepAtual !== 'spda-medir' && (
        <div className="text-[10.5px] mt-1.5 text-center" style={{ color: color.textFaint }}>
          {t('instrumento.avance')}
        </div>
      )}

      {leitura && (
        <div className="mt-2 rounded-[10px] px-3 py-2" style={{ background: CORV[leitura.cor] + '14', border: `1px solid ${CORV[leitura.cor]}66` }}>
          <div className="font-display font-semibold text-[13px]" style={{ color: CORV[leitura.cor] }}>{t(`veredito.${leitura.codigo}`)}</div>
          <div className="text-[10.5px] mt-0.5" style={{ color: color.textFaint }}>
            {t('instrumento.criterio', { c: fmtNum(LIMITE_CONFORME, 1), a: fmtNum(LIMITE_ATENCAO, 1), n: nMedidos, total: SPDA_PONTOS.length })}
          </div>
        </div>
      )}
    </div>
  )
}

/** Tour complementar com evidências fotográficas posicionadas no prédio. */
function DiagnosticoFotografico({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('spda')
  const [indice, setIndice] = useState(0)
  const [revelado, setRevelado] = useState(false)
  const item = SPDA_DIAGNOSTICOS[indice]
  const cor = item.tipo === 'verificacao' ? color.accentCool : color.status.marginal
  // textos da parada traduzidos por id (o catálogo `spdaDiagnostico.ts` fica em PT)
  const tx = (campo: string) => t(`diagnostico.paradas.${item.id}.${campo}`)

  useEffect(() => {
    useSpdaDiagnostico.getState().setAtivo(item.id)
    useView.getState().pedirPose(item.vista)
    setRevelado(false)
  }, [item])

  useEffect(() => () => {
    useSpdaDiagnostico.getState().setAtivo(null)
    useView.getState().pedir('reset')
  }, [])

  const fechar = () => {
    useSpdaDiagnostico.getState().setAtivo(null)
    onClose()
  }

  const ir = (proximo: number) => {
    setIndice(Math.max(0, Math.min(SPDA_DIAGNOSTICOS.length - 1, proximo)))
  }

  return (
    <div className="absolute inset-x-2 top-[68px] bottom-2 md:left-auto md:right-4 md:w-[520px] z-[60] pointer-events-auto">
      <div className="hud-glass rounded-[16px] p-4 h-full overflow-y-auto hud-scroll" style={{ border: `1px solid ${cor}66` }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: cor }}>
              {t('diagnostico.tour', { i: indice + 1, n: SPDA_DIAGNOSTICOS.length })}
            </div>
            <h2 className="font-display font-bold text-[19px] leading-tight mt-1" style={{ color: color.text }}>{tx('titulo')}</h2>
            <div className="text-[11px] mt-1" style={{ color: color.textMuted }}>{tx('local')}</div>
          </div>
          <button onClick={fechar} aria-label={t('diagnostico.fechar')} className="w-8 h-8 rounded-full shrink-0 text-[18px]" style={{ background: color.surface, color: color.text, border: `1px solid ${color.hairline}` }}>×</button>
        </div>

        <div className="rounded-[12px] overflow-hidden grid place-items-center" style={{ background: color.viewport, border: `1px solid ${color.hairline}` }}>
          <img src={item.imagem} alt={tx('alt')} className="block w-full max-h-[36dvh] md:max-h-[38vh] object-contain" />
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="font-mono text-[9px] uppercase tracking-wider rounded-full px-2 py-1" style={{ color: cor, border: `1px solid ${cor}66`, background: color.surface }}>
            {item.tipo === 'verificacao' ? t('diagnostico.verificacao') : t('diagnostico.naoConformidade')}
          </span>
          <button onClick={() => useView.getState().pedirPose(item.vista)} className="text-[11px]" style={{ color: color.accentCool }}>{t('diagnostico.reenquadrar')}</button>
        </div>

        <div className="rounded-[11px] p-3 mt-3" style={{ background: color.surface, border: `1px solid ${color.hairline}` }}>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: color.textFaint }}>{t('diagnostico.observe')}</div>
          <p className="text-[13px] leading-snug" style={{ color: color.text }}>{tx('pergunta')}</p>
        </div>

        {!revelado ? (
          <button onClick={() => setRevelado(true)} className="w-full rounded-[10px] py-2.5 mt-3 font-display font-semibold text-[13px]" style={{ background: cor, color: color.viewport }}>
            {item.tipo === 'verificacao' ? t('diagnostico.revelarExplicacao') : t('diagnostico.revelarDiagnostico')}
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <BlocoDiagnostico rotulo={t('diagnostico.rotuloDiagnostico')} texto={tx('diagnostico')} cor={cor} />
            <BlocoDiagnostico rotulo={t('diagnostico.rotuloRisco')} texto={tx('risco')} cor={color.status.fail} />
            <BlocoDiagnostico rotulo={t('diagnostico.rotuloAcao')} texto={tx('acao')} cor={color.status.pass} />
            <div className="text-[10.5px] leading-snug px-1" style={{ color: color.textFaint }}>{tx('referencia')}</div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={() => ir(indice - 1)} disabled={indice === 0} className="px-4 py-2 rounded-[10px] text-[12px]" style={{ background: color.surface, color: indice === 0 ? color.textFaint : color.textMuted, border: `1px solid ${color.hairline}` }}>{t('diagnostico.anterior')}</button>
          <button onClick={() => indice === SPDA_DIAGNOSTICOS.length - 1 ? fechar() : ir(indice + 1)} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[13px]" style={{ background: color.accent, color: color.viewport }}>
            {indice === SPDA_DIAGNOSTICOS.length - 1 ? t('diagnostico.concluir') : t('diagnostico.proxima')}
          </button>
        </div>
      </div>
    </div>
  )
}

function BlocoDiagnostico({ rotulo, texto, cor }: { rotulo: string; texto: string; cor: string }) {
  return <div className="rounded-[10px] px-3 py-2" style={{ background: color.surface, borderLeft: `3px solid ${cor}` }}>
    <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: cor }}>{rotulo}</div>
    <p className="text-[11.5px] leading-snug" style={{ color: color.textMuted }}>{texto}</p>
  </div>
}

/** Laudo final de continuidade do SPDA. */
function ResumoLaudo({ onClose, onMenu, onNova }: { onClose: () => void; onMenu: () => void; onNova: () => void }) {
  const { t } = useTranslation(['spda', 'common'])
  const laudo = useSpda((s) => s.laudo)
  const medicoes = useSpda((s) => s.medicoes)
  if (!laudo) return null
  const cor = laudo.conforme ? color.status.pass : color.status.fail
  // parecer montado no idioma ativo a partir da situação (a engine devolve o texto em PT)
  const parecer = t(`parecer.${laudo.situacao}`, {
    n: laudo.total,
    lidos: laudo.medidos,
    nc: laudo.naoConformidades.length,
    c: fmtNum(LIMITE_CONFORME, 1),
  })

  const Item = ({ rotulo, valor, cor: c }: { rotulo: string; valor: string; cor?: string }) => (
    <div className="rounded-[10px] px-3 py-2" style={{ background: '#0c1117', border: `1px solid ${color.hairline}` }}>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: color.textFaint }}>{rotulo}</div>
      <div className="font-mono font-bold text-[16px] mt-0.5" style={{ color: c ?? color.text }}>{valor}</div>
    </div>
  )

  return (
    <div className="absolute inset-0 z-[70] grid place-items-center p-4 pointer-events-auto" style={{ background: 'rgba(7,10,14,0.84)', backdropFilter: 'blur(4px)' }}>
      <div className="hud-glass rounded-[16px] p-6 w-[580px] max-w-[94vw] max-h-[92vh] overflow-y-auto hud-scroll">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: color.accent }}>{t('laudo.rotulo')}</div>
            <h2 className="font-display font-bold text-[20px]" style={{ color: color.text }}>{t('laudo.titulo')}</h2>
          </div>
          <button onClick={onClose} aria-label={t('common:hud.fechar')} className="text-[18px] leading-none" style={{ color: color.textMuted }}>×</button>
        </div>

        <div className="grid grid-cols-3 gap-2 my-3">
          <Item rotulo={t('laudo.aprovados')} valor={`${laudo.aprovados}/${laudo.total}`} cor={cor} />
          <Item rotulo={t('laudo.pior')} valor={`${fmtLeitura(laudo.piorLeitura)} Ω`} />
          <Item rotulo={t('laudo.naoConformidades')} valor={`${laudo.naoConformidades.length}`} cor={laudo.naoConformidades.length ? color.status.fail : color.status.pass} />
        </div>

        {/* tabela de leituras */}
        <div className="rounded-[10px] overflow-hidden" style={{ border: `1px solid ${color.hairline}` }}>
          {SPDA_PONTOS.map((p, i) => {
            const l = medicoes[p.id]
            return (
              <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 text-[12px]" style={{ background: i % 2 ? '#0c1117' : 'transparent' }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: l ? CORV[l.cor] : '#2a3340' }} />
                <span className="flex-1 truncate" style={{ color: color.textMuted }}>{nomePonto(p, t)}</span>
                <span className="font-mono" style={{ color: l ? CORV[l.cor] : color.textFaint }}>{l ? `${fmtLeitura(l.r)} Ω` : t('laudo.naoMedido')}</span>
              </div>
            )
          })}
        </div>

        <div className="mt-3 rounded-[10px] px-3 py-2.5" style={{ background: cor + '14', border: `1px solid ${cor}66` }}>
          <div className="font-display font-semibold text-[15px]" style={{ color: cor }}>
            {laudo.conforme ? t('laudo.conforme') : t('laudo.naoConforme')}
          </div>
          <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: color.textMuted }}>{parecer}</p>
        </div>

        {laudo.naoConformidades.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>{t('laudo.ncAcoes')}</div>
            {laudo.naoConformidades.map((nc) => {
              const p = getPontoSPDA(nc.pontoId)
              const l = medicoes[nc.pontoId]
              return (
              <div key={nc.pontoId} className="rounded-[10px] px-3 py-2 mb-2" style={{ background: '#0c1117', border: `1px solid ${color.status.fail}44` }}>
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-semibold text-[13px]" style={{ color: color.text }}>{p ? nomePonto(p, t) : nc.nome}</span>
                  <span className="font-mono text-[13px]" style={{ color: color.status.fail }}>{l ? `${fmtLeitura(l.r)} Ω` : nc.leitura}</span>
                </div>
                <div className="text-[12px] mt-1" style={{ color: color.textMuted }}><b>{t('laudo.causa')}</b> {t(`nc.${nc.codigo}.causa`)}</div>
                <div className="text-[12px]" style={{ color: color.textMuted }}><b>{t('laudo.acao')}</b> {t(`nc.${nc.codigo}.acao`)}</div>
              </div>
              )
            })}
          </div>
        )}

        <div className="mt-3 text-[10px] flex flex-wrap gap-x-4 gap-y-1" style={{ color: color.textFaint }}>
          <span>{t('laudo.metodo')}</span>
          <span>{t('laudo.criterio', { c: fmtNum(LIMITE_CONFORME, 1) })}</span>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px]" style={{ background: '#0c1117', color: color.textMuted, border: `1px solid ${color.hairline}` }}>
            {t('common:hud.fechar')}
          </button>
          <button onClick={onNova} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[13px]" style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.accentCool}` }}>
            {t('laudo.novaInspecao')}
          </button>
          <button onClick={onMenu} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[14px]" style={{ background: color.accent, color: '#0B0F14' }}>
            {t('common:hud.voltarMenu')}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Seletor do cenário didático (modo instrutor). */
function CenarioPicker() {
  const { t } = useTranslation('spda')
  const cenario = useSpda((s) => s.cenario)
  const setCenario = useSpda((s) => s.setCenario)
  const opts: { id: CenarioSPDA; label: string }[] = [
    { id: 'conforme', label: t('cenario.conforme') },
    { id: 'com-defeitos', label: t('cenario.comDefeitos') },
  ]
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>{t('cenario.titulo')}</div>
      <div className="flex gap-1.5">
        {opts.map((o) => {
          const ativo = cenario === o.id
          return (
            <button
              key={o.id}
              onClick={() => setCenario(o.id)}
              className="flex-1 text-[12px] py-1.5 rounded-[8px]"
              style={{
                background: ativo ? color.accent : '#0c1117',
                color: ativo ? '#0B0F14' : color.textMuted,
                border: `1px solid ${ativo ? color.accent : color.hairline}`,
                fontWeight: ativo ? 700 : 400,
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      <div className="text-[10px] mt-1.5 leading-snug" style={{ color: color.textFaint }}>
        {t('cenario.aviso')}
      </div>
    </div>
  )
}

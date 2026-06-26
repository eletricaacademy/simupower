import { useEffect, useState } from 'react'
import { useSim, passoHabilitado } from '../sim/store'
import { useInsp } from '../sim/inspStore'
import { useAter } from '../sim/aterStore'
import { resistenciaAparente, avaliar, POS_62, RTERRA, type PerfilSolo } from '../engine/aterramento'
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

/**
 * AterramentoHud — ensaio de resistência de aterramento por queda de potencial.
 * Passos guiados à esquerda, terrômetro + curva R×distância à direita.
 */
export function AterramentoHud() {
  const [configAberto, setConfigAberto] = useState(false)
  const [aba, setAba] = useState<'procedimento' | 'medicao'>('procedimento')
  const [laudoFechado, setLaudoFechado] = useState(false)
  const laudoEmitido = useSim((s) => !!s.cumpridos['at-laudo'])
  const temResultado = useAter((s) => !!s.resultado)
  const stepAtual = useSim((s) => s.ensaio.steps[s.passoIndex]?.id)
  // o painel do terrômetro só aparece na ETAPA 4 (medir) — ou já com resultado
  const mostrarPainel = stepAtual === 'at-medir' || temResultado
  const setView = useSim((s) => s.setView)
  const setTour = useSim((s) => s.setTour)
  const setMostrarGrade = useInsp((s) => s.setMostrarGrade)
  const setMostrarParedes = useInsp((s) => s.setMostrarParedes)
  const resetAter = useAter((s) => s.reset)
  const cfgDrag = useDraggable()

  // reinicia o ensaio do zero (mantém a câmera guiada ligada)
  const reiniciar = () => {
    useAter.getState().reset()
    useSim.getState().reset()
    setTour(true)
    setLaudoFechado(false)
    setConfigAberto(false)
  }

  // garante o modelo inteiro + câmera guiada por etapa (cenas calibradas)
  useEffect(() => {
    setMostrarGrade(true)
    setMostrarParedes(true)
    setTour(true)
    resetAter()
  }, [setMostrarGrade, setMostrarParedes, setTour, resetAter])

  // som ambiente de CAMPO ABERTO a 30%; encerra após 2 min sem interação e
  // religa ao interagir de novo (evita ficar tocando à toa).
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
      timer = setTimeout(parar, 120000) // 2 min
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
        <div className="absolute right-3 pointer-events-auto" style={{ top: 72 }}>
          <div className="hud-glass rounded-[14px] p-4 w-[280px] max-h-[80vh] overflow-y-auto hud-scroll" style={cfgDrag.style}>
            <div className="font-display font-semibold text-[14px] mb-3 select-none" style={{ color: color.text, ...cfgDrag.handleStyle }} {...cfgDrag.handlers}>
              ⠿ Configurações
            </div>
            {/* simulação: novo ensaio / encerrar */}
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>Simulação</div>
            <div className="flex gap-1.5">
              <button onClick={reiniciar} className="flex-1 text-[12px] py-1.5 rounded-[8px]" style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}>
                ↺ Novo ensaio
              </button>
              <button onClick={() => setView('menu')} className="flex-1 text-[12px] py-1.5 rounded-[8px]" style={{ background: '#0c1117', color: color.status.fail, border: `1px solid ${color.hairline}` }}>
                ✕ Encerrar
              </button>
            </div>
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <PerfilPicker />
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <QualityPicker />
          </div>
        </div>
      )}

      {/* DESKTOP — só o cartão guiado (essencial); o progresso vai embutido nele */}
      <div className="hidden md:block absolute left-4 bottom-4 pointer-events-auto">
        <GuidedCard />
      </div>

      {mostrarPainel && (
        <div className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
          <Terrometro />
        </div>
      )}

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
        {aba === 'procedimento' ? (
          <GuidedCard />
        ) : mostrarPainel ? (
          <Terrometro />
        ) : (
          <div className="hud-glass rounded-[14px] p-4 w-[330px] max-w-[90vw] text-[12px] text-center" style={{ color: color.textFaint }}>
            O terrômetro fica disponível na etapa “Medir movendo a estaca P”.
          </div>
        )}
      </MobileSheet>

      <div className="hidden md:block">
        <Creditos />
      </div>

      {/* resumo/parecer ao emitir o resultado */}
      {laudoEmitido && temResultado && !laudoFechado && (
        <ResumoLaudo onClose={() => setLaudoFechado(true)} onMenu={() => setView('menu')} onNova={reiniciar} />
      )}
    </div>
  )
}

/** Resumo final (laudo) com o parecer — exibido ao emitir o resultado. */
function ResumoLaudo({ onClose, onMenu, onNova }: { onClose: () => void; onMenu: () => void; onNova: () => void }) {
  const perfil = useAter((s) => s.perfil)
  const posP = useAter((s) => s.posP)
  const medicoes = useAter((s) => s.medicoes)
  const resultado = useAter((s) => s.resultado)
  if (!resultado) return null
  const patamar = analisarPatamar(medicoes)
  const r = resultado.r62
  const ok = r <= 10
  const parecer =
    `Resistência de aterramento medida em ${r.toFixed(1)} Ω a 62% da distância E–C ` +
    `(método da queda de potencial, ABNT NBR 15749). ` +
    (patamar.naZona
      ? 'A leitura situa-se na zona de patamar (platô estável), o que confere confiabilidade ao valor medido. '
      : 'O patamar não ficou bem definido — recomenda-se coletar mais pontos próximos a 62% e/ou aumentar a distância D. ') +
    (ok
      ? 'O valor ATENDE à recomendação da concessionária (≤ 10 Ω).'
      : 'O valor está ACIMA do recomendado pela concessionária (≤ 10 Ω) — recomenda-se melhorar o sistema de aterramento.')

  const Item = ({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) => (
    <div className="rounded-[10px] px-3 py-2" style={{ background: '#0c1117', border: `1px solid ${color.hairline}` }}>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: color.textFaint }}>{rotulo}</div>
      <div className="font-mono font-bold text-[16px] mt-0.5" style={{ color: cor ?? color.text }}>{valor}</div>
    </div>
  )

  return (
    <div className="absolute inset-0 z-[70] grid place-items-center p-4 pointer-events-auto" style={{ background: 'rgba(7,10,14,0.84)', backdropFilter: 'blur(4px)' }}>
      <div className="hud-glass rounded-[16px] p-6 w-[560px] max-w-[94vw] max-h-[92vh] overflow-y-auto hud-scroll">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: color.accent }}>Laudo de medição</div>
            <h2 className="font-display font-bold text-[20px]" style={{ color: color.text }}>Resistência de Aterramento</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-[18px] leading-none" style={{ color: color.textMuted }}>×</button>
        </div>

        <div className="grid grid-cols-3 gap-2 my-3">
          <Item rotulo="R a 62%" valor={`${r.toFixed(1)} Ω`} cor={CORV[resultado.cor]} />
          <Item rotulo="Variação no platô" valor={patamar.variacao !== null ? `${patamar.variacao.toFixed(1)}%` : '—'} />
          <Item rotulo="Pontos medidos" valor={`${medicoes.length}`} />
        </div>

        <Curva perfil={perfil} posP={posP} medicoes={medicoes} curva={resultado.curva} />

        <div className="mt-3 rounded-[10px] px-3 py-2.5" style={{ background: CORV[resultado.cor] + '14', border: `1px solid ${CORV[resultado.cor]}66` }}>
          <div className="font-display font-semibold text-[15px]" style={{ color: CORV[resultado.cor] }}>{resultado.veredito}</div>
          <div className="text-[12px] mt-1 flex items-start gap-1" style={{ color: patamar.naZona ? color.status.pass : color.status.marginal }}>
            <span aria-hidden>{patamar.naZona ? '✓' : '⚠'}</span>
            <span>{patamar.naZona ? 'Leitura na zona de patamar.' : 'Patamar não consolidado.'}</span>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: color.textFaint }}>Parecer</div>
          <p className="text-[13px] leading-relaxed" style={{ color: color.textMuted }}>{parecer}</p>
        </div>

        <div className="mt-3 text-[10px] flex flex-wrap gap-x-4 gap-y-1" style={{ color: color.textFaint }}>
          <span>Método: ABNT NBR 15749 · IEEE 81 (queda de potencial)</span>
          <span>Recomendação da concessionária: ≤ 10 Ω</span>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px]" style={{ background: '#0c1117', color: color.textMuted, border: `1px solid ${color.hairline}` }}>
            Fechar
          </button>
          <button onClick={onNova} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[13px]" style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.accentCool}` }}>
            ↺ Nova medição
          </button>
          <button onClick={onMenu} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[14px]" style={{ background: color.accent, color: '#0B0F14' }}>
            Voltar ao menu
          </button>
        </div>
      </div>
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

function GuidedCard() {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const marcarPasso = useSim((s) => s.marcarPasso)
  const irParaPasso = useSim((s) => s.irParaPasso)
  const medicoes = useAter((s) => s.medicoes)
  const cumpridos = useSim((s) => s.cumpridos)
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
  // a etapa 4 (medir) só conclui com ao menos 3 pontos registrados
  const faltam3 = passo.id === 'at-medir' && medicoes.length < 3
  const acaoLiberada = habilitado && !faltam3

  return (
    <div className="hud-glass rounded-[12px] p-3 w-[330px] max-w-[88vw]">
      {/* progresso compacto (dots clicáveis) — substitui a checklist */}
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
      {jaCumprido && passo.feito && (
        <div className="rounded-[10px] px-3 py-2 mb-3 text-[12.5px] flex gap-1.5" style={{ background: color.status.pass + '14', border: `1px solid ${color.status.pass}55`, color: color.text }}>
          <span aria-hidden style={{ color: color.status.pass }}>✓</span>
          <span>{passo.feito}</span>
        </div>
      )}
      {/* tutorial: como concluir a medição (mín. 3 pontos) */}
      {faltam3 && !jaCumprido && (
        <div className="rounded-[10px] px-3 py-2 mb-3 text-[12px] leading-snug" style={{ background: color.accentCool + '14', border: `1px solid ${color.accentCool}55`, color: color.text }}>
          <b>Como concluir:</b> no painel do terrômetro (à direita), <b>mova a estaca P</b> e clique em <b>“+ Registrar”</b> em pelo menos <b>3 posições</b> diferentes para levantar a curva. <span className="font-mono" style={{ color: color.accentCool }}>{medicoes.length}/3 pontos</span>.
        </div>
      )}
      <button
        onClick={() => marcarPasso(passo.id)}
        disabled={!acaoLiberada || jaCumprido}
        className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
        style={{
          background: jaCumprido ? '#0c1117' : acaoLiberada ? color.accent : '#0c1117',
          color: jaCumprido ? color.status.pass : acaoLiberada ? '#0B0F14' : color.textFaint,
          border: `1px solid ${jaCumprido ? color.status.pass + '55' : acaoLiberada ? color.accent : color.hairline}`,
          cursor: !acaoLiberada || jaCumprido ? 'default' : 'pointer',
        }}
      >
        {jaCumprido ? '✓ Concluído' : faltam3 ? `Concluir medição (${medicoes.length}/3)` : passo.acao}
      </button>
      <div className="flex items-center gap-2 mt-2.5">
        <button onClick={() => irParaPasso(passoIndex - 1)} disabled={passoIndex === 0} className="px-3 py-2 rounded-[10px] text-[13px]" style={{ background: '#0c1117', color: passoIndex === 0 ? color.textFaint : color.textMuted, border: `1px solid ${color.hairline}` }}>
          ‹ Voltar
        </button>
        <button onClick={() => irParaPasso(passoIndex + 1)} disabled={!jaCumprido || ultimo} className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[13px]" style={{ background: jaCumprido && !ultimo ? color.accentCool : '#0c1117', color: jaCumprido && !ultimo ? '#0B0F14' : color.textFaint, border: `1px solid ${jaCumprido && !ultimo ? color.accentCool : color.hairline}` }}>
          {ultimo ? 'Fim' : 'Próximo ›'}
        </button>
      </div>
    </div>
  )
}

/** Terrômetro: leitura ao vivo + curva R×distância + registro e veredito. */
function Terrometro() {
  const perfil = useAter((s) => s.perfil)
  const posP = useAter((s) => s.posP)
  const distanciaM = useAter((s) => s.distanciaM)
  const medicoes = useAter((s) => s.medicoes)
  const resultado = useAter((s) => s.resultado)
  const setPosP = useAter((s) => s.setPosP)
  const registrar = useAter((s) => s.registrar)
  const calcular = useAter((s) => s.calcular)
  // a seleção da estaca P só aparece na ETAPA 4 (at-medir) e após Iniciar medição
  const stepAtual = useSim((s) => s.ensaio.steps[s.passoIndex]?.id)
  const [medicaoIniciada, setMedicaoIniciada] = useState(false)
  const emMedicao = stepAtual === 'at-medir'

  const rLive = resistenciaAparente(perfil, posP)
  const v = avaliar(rLive)
  const nPontos = medicoes.length
  const podeCalcular = nPontos >= 3 // mínimo de 3 pontos para traçar a curva
  const patamar = analisarPatamar(medicoes)
  const mostrarControles = (emMedicao && medicaoIniciada) || !!resultado
  // ao sair da medição (ex.: reiniciar ensaio) volta a exigir "Iniciar medição"
  useEffect(() => {
    if (!emMedicao && !resultado) setMedicaoIniciada(false)
  }, [emMedicao, resultado])

  return (
    <div className="instrument-panel rounded-[12px] p-3 w-[310px] max-w-[90vw]">
      <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: color.textFaint }}>
        Terrômetro · queda de potencial
      </div>

      {/* leitura */}
      <div className="rounded-[10px] px-3 py-2 mb-3 flex items-baseline justify-between" style={{ background: '#0c1117', border: `1px solid ${color.hairline}` }}>
        <span className="font-mono font-bold text-[30px]" style={{ color: CORV[v.cor] }}>{rLive.toFixed(1)}</span>
        <span className="font-mono text-[14px]" style={{ color: color.textMuted }}>Ω</span>
      </div>

      {/* gráfico só aparece após iniciar a medição (etapa 4) */}
      {mostrarControles && <Curva perfil={perfil} posP={posP} medicoes={medicoes} curva={resultado?.curva} />}

      {/* Iniciar medição: a seleção da estaca P só aparece nesta etapa, após iniciar */}
      {emMedicao && !medicaoIniciada && !resultado && (
        <button
          onClick={() => setMedicaoIniciada(true)}
          className="w-full mt-3 py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
          style={{ background: color.accent, color: '#0B0F14' }}
        >
          ▶ Iniciar medição
        </button>
      )}
      {!emMedicao && !resultado && (
        <div className="text-[11px] mt-3 text-center leading-snug" style={{ color: color.textFaint }}>
          Avance até a etapa “Medir movendo a estaca P” e inicie a medição.
        </div>
      )}

      {mostrarControles && (
        <>
      {/* posição da estaca P */}
      <div className="mt-3">
        <div className="flex justify-between text-[11px] mb-1" style={{ color: color.textMuted }}>
          <span>Estaca P</span>
          <span className="font-mono">{(posP * 100).toFixed(0)}% · {(posP * distanciaM).toFixed(1)} m</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={posP}
          onChange={(e) => setPosP(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: color.accent }}
        />
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => setPosP(POS_62)} className="px-3 py-2 rounded-[9px] text-[12px]" style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}>
          Ir a 62%
        </button>
        <button onClick={registrar} className="flex-1 py-2 rounded-[9px] text-[12px] font-medium" style={{ background: '#0c1117', color: color.text, border: `1px solid ${color.hairline}` }}>
          + Registrar ({nPontos})
        </button>
        <button
          onClick={calcular}
          disabled={!podeCalcular}
          className="flex-1 py-2 rounded-[9px] font-display font-semibold text-[12px]"
          style={{
            background: podeCalcular ? color.accent : '#0c1117',
            color: podeCalcular ? '#0B0F14' : color.textFaint,
            border: `1px solid ${podeCalcular ? color.accent : color.hairline}`,
            cursor: podeCalcular ? 'pointer' : 'default',
          }}
        >
          Calcular
        </button>
      </div>
      {!resultado && (
        <div className="text-[10px] mt-1.5 text-center" style={{ color: podeCalcular ? color.accentCool : color.textFaint }}>
          {podeCalcular
            ? 'Pronto para calcular — ou registre mais pontos.'
            : `Escolha a posição, registre e repita — mín. 3 pontos (${nPontos}/3).`}
        </div>
      )}
        </>
      )}

      {resultado && (
        <div className="mt-3 rounded-[10px] px-3 py-2.5" style={{ background: CORV[resultado.cor] + '14', border: `1px solid ${CORV[resultado.cor]}66` }}>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider" style={{ color: color.textFaint }}>Resistência (62%)</span>
            <span className="font-mono font-bold text-[20px]" style={{ color: CORV[resultado.cor] }}>{resultado.r62.toFixed(1)} Ω</span>
          </div>
          <div className="font-display font-semibold text-[14px] mt-1" style={{ color: CORV[resultado.cor] }}>{resultado.veredito}</div>
          {patamar.variacao !== null && (
            <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${color.hairline}`, color: color.textMuted }}>
              <span>Variação no platô</span>
              <span className="font-mono">{patamar.variacao.toFixed(1)}%</span>
            </div>
          )}
          <div className="text-[11px] mt-1 flex items-start gap-1" style={{ color: patamar.naZona ? color.status.pass : color.status.marginal }}>
            <span aria-hidden>{patamar.naZona ? '✓' : '⚠'}</span>
            <span>
              {patamar.naZona
                ? 'Na zona de patamar — platô estável, leitura confiável.'
                : 'Fora do patamar — colete mais pontos no meio ou aumente a distância D.'}
            </span>
          </div>
          <div className="text-[10px] mt-1" style={{ color: color.textFaint }}>Recomendação da concessionária: ≤ 10 Ω · {nPontos} pontos medidos</div>
        </div>
      )}
    </div>
  )
}

/** Analisa a estabilidade do platô a partir dos pontos medidos na região central. */
function analisarPatamar(medicoes: { x: number; r: number }[]): { variacao: number | null; naZona: boolean } {
  const plat = medicoes.filter((m) => m.x >= 0.4 && m.x <= 0.72)
  if (plat.length < 2) return { variacao: null, naZona: false }
  const rs = plat.map((p) => p.r)
  const min = Math.min(...rs)
  const max = Math.max(...rs)
  const avg = rs.reduce((a, b) => a + b, 0) / rs.length
  const variacao = avg > 0 ? ((max - min) / avg) * 100 : 0
  return { variacao, naZona: variacao <= 15 }
}

/** Gráfico SVG R × posição da estaca P (distância E–C). */
function Curva({
  perfil,
  posP,
  medicoes,
  curva,
}: {
  perfil: PerfilSolo
  posP: number
  medicoes: { x: number; r: number }[]
  /** curva traçada no cálculo (mostra a zona de patamar completa) */
  curva?: { x: number; r: number }[]
}) {
  const W = 290
  const H = 110
  const pad = 6
  const maxR = Math.max(RTERRA[perfil] * 2.6, resistenciaAparente(perfil, 0.92))
  const sx = (x: number) => pad + x * (W - 2 * pad)
  const sy = (r: number) => H - pad - (Math.min(r, maxR) / maxR) * (H - 2 * pad)
  // a curva é levantada PONTO A PONTO (acompanha as medições registradas)
  const med = [...medicoes].sort((a, b) => a.x - b.x)
  const linhaMedida = med.map((m) => `${sx(m.x).toFixed(1)},${sy(m.r).toFixed(1)}`).join(' ')
  // curva traçada (no cálculo): a forma completa com o platô no meio
  const tracada = curva && curva.length > 1 ? curva.map((m) => `${sx(m.x).toFixed(1)},${sy(m.r).toFixed(1)}`).join(' ') : null
  const rLive = resistenciaAparente(perfil, posP)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: '#0c1117', borderRadius: 8, border: `1px solid ${color.hairline}` }}>
      {/* ZONA DE PATAMAR — faixa da resistência verdadeira (±12%); os pontos
          medidos devem cair aqui no meio da varredura (platô) */}
      <rect
        x={pad}
        y={sy(RTERRA[perfil] * 1.12)}
        width={W - 2 * pad}
        height={Math.max(2, sy(RTERRA[perfil] * 0.88) - sy(RTERRA[perfil] * 1.12))}
        fill={color.status.pass}
        opacity={0.13}
      />
      <text x={pad + 3} y={sy(RTERRA[perfil]) - 2} fontSize="7.5" fill={color.status.pass} fontFamily="monospace" opacity={0.85}>
        patamar
      </text>
      {/* linha de 62% */}
      <line x1={sx(POS_62)} y1={pad} x2={sx(POS_62)} y2={H - pad} stroke={color.status.pass} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      <text x={sx(POS_62) + 3} y={pad + 9} fontSize="8" fill={color.status.pass} fontFamily="monospace">62%</text>
      {/* curva TRAÇADA (no cálculo) — mostra a zona de patamar completa */}
      {tracada && <polyline points={tracada} fill="none" stroke={color.accentCool} strokeWidth="2" />}
      {/* curva MEDIDA ponto a ponto (antes do cálculo) */}
      {!tracada && med.length > 1 && (
        <polyline points={linhaMedida} fill="none" stroke={color.accentCool} strokeWidth="1.8" opacity="0.85" />
      )}
      {med.map((m, i) => (
        <circle key={i} cx={sx(m.x)} cy={sy(m.r)} r="2.6" fill={color.accent} />
      ))}
      {/* posição atual da estaca P (ao vivo, acompanha o slider/3D) */}
      <circle cx={sx(posP)} cy={sy(rLive)} r="3.4" fill="#fff" stroke={color.accent} strokeWidth="1.5" />
      {med.length === 0 && (
        <text x={W / 2} y={H / 2} fontSize="9" fill={color.textFaint} textAnchor="middle" fontFamily="monospace">
          mova a estaca P e registre os pontos
        </text>
      )}
    </svg>
  )
}


/** Seletor do perfil de solo (modo instrutor). */
function PerfilPicker() {
  const perfil = useAter((s) => s.perfil)
  const setPerfil = useAter((s) => s.setPerfil)
  const opts: { id: PerfilSolo; label: string }[] = [
    { id: 'bom', label: 'Bom' },
    { id: 'atencao', label: 'Atenção' },
    { id: 'ruim', label: 'Ruim' },
  ]
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>Condição do solo</div>
      <div className="flex gap-1.5">
        {opts.map((o) => {
          const ativo = perfil === o.id
          return (
            <button key={o.id} onClick={() => setPerfil(o.id)} className="flex-1 text-[12px] py-1.5 rounded-[8px]" style={{ background: ativo ? color.accent : '#0c1117', color: ativo ? '#0B0F14' : color.textMuted, border: `1px solid ${ativo ? color.accent : color.hairline}`, fontWeight: ativo ? 700 : 400 }}>
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

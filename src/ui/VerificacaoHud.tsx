import { useEffect, useState } from 'react'
import { useSim } from '../sim/store'
import { useView } from '../sim/viewStore'
import { useVerif } from '../sim/verifStore'
import { ENSAIOS_VERIFICACAO, FLUKE_FUNCOES } from '../catalog/verificacaoTestes'
import { medirEnsaio } from '../engine/verificacao'
import { TOMADAS_BR } from '../scene/TomadaBR'
import { QualityPicker } from './QualityPicker'
import { HudTopBar } from './HudTopBar'
import { Creditos } from './Creditos'
import { useDraggable } from './useDraggable'
import { SoundControl } from './SoundControl'
import { color } from '../design/tokens'

/**
 * VerificacaoHud — HUD do módulo de Verificação de Instalações (NBR 5410 §7).
 * Fluxo de ENSAIOS com o Fluke 1662: escolhe o ensaio + alvo, "mede" (anima o
 * visor) e mostra o veredito por norma. Engine pura em `engine/verificacao.ts`.
 */
export function VerificacaoHud() {
  const [configAberto, setConfigAberto] = useState(false)
  const [pronto, setPronto] = useState(false)
  const cfgDrag = useDraggable()
  const pedirVista = useView((s) => s.pedir)

  const ensaioIndex = useVerif((s) => s.ensaioIndex)
  const fase = useVerif((s) => s.fase)
  const condicao = useVerif((s) => s.condicao)
  const setDisplay = useVerif((s) => s.setDisplay)
  const concluir = useVerif((s) => s.concluir)

  // animação do visor durante a medição: valor "assenta" no alvo em ~1,5 s
  useEffect(() => {
    if (fase !== 'medindo') return
    const ensaio = ENSAIOS_VERIFICACAO[ensaioIndex]
    const r = medirEnsaio(ensaio, condicao)
    const casas = r.display.includes('.') ? r.display.split('.')[1].length : 0
    const start = performance.now()
    const DUR = 1500
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / DUR)
      if (k < 1) {
        if (!isFinite(r.valor)) setDisplay(k < 0.7 ? '----' : 'OL')
        else {
          const ruido = (1 - k) * Math.abs(r.valor) * 0.35 * (Math.random() - 0.5)
          const v = r.valor * (0.25 + 0.75 * k) + ruido
          setDisplay(v.toFixed(casas))
        }
        raf = requestAnimationFrame(tick)
      } else {
        concluir()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase])

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <HudTopBar
        onConfig={() => setConfigAberto((v) => !v)}
        configAberto={configAberto}
        right={
          <>
            <button
              onClick={() => pedirVista('quadro')}
              title="Vista do quadro elétrico"
              className="hud-glass rounded-[10px] px-3 py-2 text-[12.5px] flex items-center gap-1.5"
              style={{ color: color.text }}
            >
              <span aria-hidden style={{ color: color.accent }}>▦</span> Quadro
            </button>
            <SoundControl />
          </>
        }
      />

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
            <CondicaoToggle />
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <IdentificarPeca />
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <CapturarCena />
          </div>
        </div>
      )}

      {/* painel guiado dos ensaios (esquerda) */}
      <div className="absolute left-4 bottom-4 pointer-events-auto" style={{ maxWidth: 'min(92vw, 380px)' }}>
        <EnsaioPanel />
      </div>

      {/* visor do Fluke 1662 (direita) */}
      <div className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
        <FlukeDisplay />
      </div>

      {!pronto && <IntroVerif onClose={() => setPronto(true)} />}
      <RelatorioVerif />

      <div className="hidden md:block">
        <Creditos />
      </div>
    </div>
  )
}

/** Modal de boas-vindas dos ensaios da §7. */
function IntroVerif({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-[60] grid place-items-center p-4 pointer-events-auto" style={{ background: 'rgba(7,10,14,0.82)', backdropFilter: 'blur(4px)' }}>
      <div className="hud-glass rounded-[18px] p-6 w-[520px] max-w-[92vw]">
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase mb-2" style={{ color: color.accent }}>
          NBR 5410 · Seção 7 — Verificação
        </div>
        <h2 className="font-display font-bold text-[22px] leading-tight mb-3" style={{ color: color.text }}>
          Ensaios de verificação da instalação
        </h2>
        <p className="text-[13.5px] leading-relaxed mb-3" style={{ color: color.textMuted }}>
          Vamos executar os <b>ensaios da Seção 7</b> com o <b>Fluke 1662</b> — uma etapa
          <b> essencial para a segurança</b> da instalação: garante a continuidade do aterramento, o
          isolamento, a polaridade e o seccionamento automático (DR) antes da entrega.
        </p>
        <div className="rounded-[12px] px-4 py-3 mb-4 flex items-start gap-3" style={{ background: color.accent + '14', border: `1px solid ${color.accent}44` }}>
          <span aria-hidden className="text-[18px]">🔌</span>
          <span className="text-[13px] leading-snug" style={{ color: color.textMuted }}>
            Começamos pelas <b>tomadas</b> (ponto a ponto). Depois que organizarmos essa etapa,
            seguimos para os ensaios no <b>quadro elétrico</b>.
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-[12px] font-display font-semibold text-[15px]"
          style={{ background: color.accent, color: '#0B0F14', boxShadow: `0 0 22px ${color.accent}55` }}
        >
          Começar pelos ensaios nas tomadas →
        </button>
      </div>
    </div>
  )
}

/** Painel guiado: ensaio atual + alvo + medir + navegação. */
function EnsaioPanel() {
  const ensaioIndex = useVerif((s) => s.ensaioIndex)
  const alvo = useVerif((s) => s.alvo)
  const fase = useVerif((s) => s.fase)
  const setAlvo = useVerif((s) => s.setAlvo)
  const iniciarMedir = useVerif((s) => s.iniciarMedicao)
  const proximo = useVerif((s) => s.proximoEnsaio)
  const anterior = useVerif((s) => s.anteriorEnsaio)
  const abrirRelatorio = useVerif((s) => s.abrirRelatorio)
  const registros = useVerif((s) => s.registros)
  const pedirVista = useView((s) => s.pedir)
  const ensaio = ENSAIOS_VERIFICACAO[ensaioIndex]
  const total = ENSAIOS_VERIFICACAO.length
  const feitos = ENSAIOS_VERIFICACAO.filter((e) => Object.keys(registros).some((k) => k.startsWith(e.id + '@'))).length
  const completo = feitos === total
  const func = FLUKE_FUNCOES.find((f) => f.id === ensaio.funcao)

  // ao medir: foca a câmera na área do ensaio (tomada ativa / Fluke) e mede
  function iniciar() {
    pedirVista('foco')
    iniciarMedir()
  }

  return (
    <div className="hud-glass rounded-[14px] p-4 w-[380px] max-w-[92vw]">
      {/* progresso (dots) */}
      <div className="flex items-center gap-1.5 mb-3">
        {ENSAIOS_VERIFICACAO.map((e, i) => (
          <span
            key={e.id}
            title={e.nome}
            className="h-1.5 rounded-full flex-1 transition-colors"
            style={{ background: i === ensaioIndex ? color.accent : i < ensaioIndex ? color.accentCool : color.hairline }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#0c1117', color: color.accent, border: `1px solid ${color.hairline}` }}>
          ENSAIO {ensaioIndex + 1}/{total}
        </span>
        <span className="font-mono text-[10px]" style={{ color: color.textFaint }}>
          Fluke 1662 · {func?.simbolo}
        </span>
      </div>

      <h2 className="font-display font-semibold text-[17px] leading-tight mb-1" style={{ color: color.text }}>
        {ensaio.nome}
      </h2>
      <p className="text-[12px] leading-snug mb-2" style={{ color: color.textMuted }}>
        {ensaio.descricao}
      </p>
      <div className="text-[11px] mb-3 space-y-0.5">
        <div style={{ color: color.textFaint }}>
          <b style={{ color: color.textMuted }}>Parâmetro:</b> {ensaio.parametro}
        </div>
        <div style={{ color: color.textFaint }}>
          <b style={{ color: color.textMuted }}>Critério:</b> {ensaio.criterio}
        </div>
        <div className="font-mono" style={{ color: color.textFaint }}>{ensaio.norma}</div>
      </div>

      {/* seletor de ponto de ensaio: tomadas + quadro (move o Fluke p/ o alvo) */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>
          Ponto de ensaio
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TOMADAS_BR.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setAlvo(t.id)}
              className="text-[11px] px-2.5 py-1 rounded-[8px] transition-colors"
              style={{
                background: alvo === t.id ? color.accent + '22' : '#0c1117',
                color: alvo === t.id ? color.accent : color.textMuted,
                border: `1px solid ${alvo === t.id ? color.accent + '66' : color.hairline}`,
              }}
            >
              Tomada {i + 1}
            </button>
          ))}
          <button
            onClick={() => setAlvo('quadro')}
            className="text-[11px] px-2.5 py-1 rounded-[8px] transition-colors"
            style={{
              background: alvo === 'quadro' ? color.accent + '22' : '#0c1117',
              color: alvo === 'quadro' ? color.accent : color.textMuted,
              border: `1px solid ${alvo === 'quadro' ? color.accent + '66' : color.hairline}`,
            }}
          >
            ▦ Quadro
          </button>
        </div>
      </div>

      {/* medir + navegação */}
      <div className="flex gap-2 items-center">
        <button onClick={anterior} disabled={ensaioIndex === 0} className="px-2.5 py-2 rounded-[10px] text-[13px]" style={{ background: '#0c1117', color: ensaioIndex === 0 ? color.textFaint : color.textMuted, border: `1px solid ${color.hairline}` }}>
          ‹
        </button>
        <button
          onClick={iniciar}
          disabled={fase === 'medindo'}
          className="flex-1 py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
          style={{ background: color.accent, color: '#0B0F14', boxShadow: `0 0 20px ${color.accent}44`, opacity: fase === 'medindo' ? 0.6 : 1 }}
        >
          {fase === 'medindo' ? 'Medindo…' : fase === 'concluido' ? '↻ Medir de novo' : '▶ Medir'}
        </button>
        <button onClick={proximo} disabled={ensaioIndex === total - 1} className="px-2.5 py-2 rounded-[10px] text-[13px]" style={{ background: '#0c1117', color: ensaioIndex === total - 1 ? color.textFaint : color.textMuted, border: `1px solid ${color.hairline}` }}>
          ›
        </button>
      </div>

      {/* concluir → laudo final */}
      <button
        onClick={abrirRelatorio}
        className="w-full mt-2 py-2 rounded-[10px] text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors"
        style={{
          background: completo ? color.status.pass + '22' : '#0c1117',
          color: completo ? color.status.pass : color.textMuted,
          border: `1px solid ${completo ? color.status.pass + '66' : color.hairline}`,
        }}
      >
        📋 Concluir verificação <span className="font-mono text-[11px] opacity-80">{feitos}/{total}</span>
      </button>
    </div>
  )
}

/** Visor do Fluke 1662 — função, leitura grande, unidade, veredito. */
function FlukeDisplay() {
  const ensaioIndex = useVerif((s) => s.ensaioIndex)
  const fase = useVerif((s) => s.fase)
  const display = useVerif((s) => s.display)
  const resultado = useVerif((s) => s.resultado)
  const ensaio = ENSAIOS_VERIFICACAO[ensaioIndex]
  const func = FLUKE_FUNCOES.find((f) => f.id === ensaio.funcao)
  const cor = resultado ? (resultado.aprovado ? color.status.pass : color.status.fail) : color.accentCool

  return (
    <div className="rounded-[16px] p-3 w-[320px]" style={{ background: '#1a1c10', border: '3px solid #f2c200', boxShadow: '0 10px 40px -16px #000' }}>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="font-display font-extrabold text-[13px]" style={{ color: '#f2c200' }}>FLUKE</span>
        <span className="font-mono text-[10px]" style={{ color: '#9aa07a' }}>1662 · {func?.nome}</span>
      </div>

      {/* "LCD" */}
      <div className="rounded-[10px] p-3" style={{ background: '#cdd6b0', boxShadow: 'inset 0 2px 8px #00000033' }}>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] font-bold" style={{ color: '#3a4220' }}>{func?.simbolo}</span>
          <span className="font-mono text-[10px]" style={{ color: '#5a6038' }}>
            {fase === 'medindo' ? 'medindo…' : fase === 'concluido' ? 'AUTO' : 'pronto'}
          </span>
        </div>
        <div className="flex items-end justify-center gap-1 py-1">
          <span className="font-mono font-bold leading-none tabular-nums" style={{ fontSize: 52, color: '#1d2410' }}>
            {fase === 'idle' ? '– –' : display}
          </span>
          <span className="font-mono font-bold mb-2" style={{ fontSize: 18, color: '#3a4220' }}>{ensaio.unidade}</span>
        </div>
        <div className="text-center font-mono text-[11px] h-[14px]" style={{ color: '#3a4220' }}>
          {resultado?.extra ?? ' '}
        </div>
      </div>

      {/* veredito */}
      <div className="mt-2 rounded-[10px] px-3 py-2 min-h-[44px] flex items-center gap-2" style={{ background: cor + '1a', border: `1px solid ${cor}55` }}>
        {resultado ? (
          <>
            <span aria-hidden style={{ color: cor, fontSize: 18 }}>{resultado.aprovado ? '✓' : '✗'}</span>
            <span className="text-[12px] leading-snug" style={{ color: color.text }}>
              <b style={{ color: cor }}>{resultado.aprovado ? 'Conforme' : 'Não conforme'}</b> — {resultado.veredito}
            </span>
          </>
        ) : (
          <span className="text-[12px]" style={{ color: color.textFaint }}>
            {fase === 'medindo' ? 'Aplicando ensaio e lendo…' : 'Conecte e toque em “Medir”.'}
          </span>
        )}
      </div>
    </div>
  )
}

/** Instrutor: condição da instalação (conforme / com defeito). */
function CondicaoToggle() {
  const condicao = useVerif((s) => s.condicao)
  const setCondicao = useVerif((s) => s.setCondicao)
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>
        Condição da instalação (instrutor)
      </div>
      <div className="flex gap-1.5">
        {(['ok', 'falha'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCondicao(c)}
            className="flex-1 text-[12px] py-1.5 rounded-[8px]"
            style={{
              background: condicao === c ? (c === 'ok' ? color.status.pass + '22' : color.status.fail + '22') : '#0c1117',
              color: condicao === c ? (c === 'ok' ? color.status.pass : color.status.fail) : color.textMuted,
              border: `1px solid ${condicao === c ? (c === 'ok' ? color.status.pass : color.status.fail) + '66' : color.hairline}`,
            }}
          >
            {c === 'ok' ? 'Conforme' : 'Com defeito'}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Capturar cena: grava a POSE atual da câmera (posição + alvo) p/ definir vistas. */
function CapturarCena() {
  const pedirCaptura = useSim((s) => s.pedirCaptura)
  const cenaPose = useSim((s) => s.cenaPose)
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>
        Capturar cena (pose da câmera)
      </div>
      <button
        onClick={pedirCaptura}
        className="w-full text-[12px] py-1.5 rounded-[8px]"
        style={{ background: '#0c1117', color: color.text, border: `1px solid ${color.hairline}` }}
      >
        🎥 Capturar posição da câmera
      </button>
      {cenaPose && (
        <div
          className="rounded-[8px] px-2.5 py-1.5 mt-1.5 font-mono text-[11px] break-all"
          style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}
        >
          {cenaPose}
        </div>
      )}
      <p className="text-[10px] leading-snug mt-1.5" style={{ color: color.textFaint }}>
        Enquadre a cena na câmera e capture — a pose (posição + alvo) é copiada; me
        envie que eu gravo como vista inicial.
      </p>
    </div>
  )
}

/** Identificar ponto: liga o modo, clique acumula coords numa lista. */
function IdentificarPeca() {
  const pickMode = useSim((s) => s.pickMode)
  const setPickMode = useSim((s) => s.setPickMode)
  const pickLog = useSim((s) => s.pickLog)
  const clearPickLog = useSim((s) => s.clearPickLog)
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>
        Identificar ponto
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
      {pickLog.length > 0 && (
        <>
          <div className="rounded-[8px] px-2.5 py-1.5 mb-1.5 max-h-[180px] overflow-y-auto hud-scroll" style={{ background: '#0c1117', border: `1px solid ${color.hairline}` }}>
            {pickLog.map((p, i) => (
              <div key={i} className="font-mono text-[11px] break-all" style={{ color: color.accentCool }}>
                <span style={{ color: color.textFaint }}>{i + 1}.</span> {p}
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => navigator.clipboard?.writeText(pickLog.map((p, i) => `${i + 1}. ${p}`).join('\n'))} className="flex-1 text-[11px] py-1 rounded-[7px]" style={{ background: '#0c1117', color: color.text, border: `1px solid ${color.hairline}` }}>
              📋 Copiar tudo
            </button>
            <button onClick={clearPickLog} className="text-[11px] py-1 px-2 rounded-[7px]" style={{ background: '#0c1117', color: color.textMuted, border: `1px solid ${color.hairline}` }}>
              🗑 Limpar
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** Nome amigável do alvo do ensaio. */
function nomeAlvo(a: string): string {
  if (a === 'quadro') return 'Quadro de distribuição'
  if (a === 'instalacao') return 'Instalação'
  if (a === 'condutor-protecao') return 'Condutor de proteção (PE)'
  const m = a.match(/tomada-br-(\d)/)
  return m ? `Tomada ${m[1]}` : a
}

/**
 * RelatorioVerif — popup de CONCLUSÃO dos ensaios da §7: laudo profissional com
 * cada ensaio, leitura, critério e veredito, e o parecer final (aprovado /
 * não conforme / em andamento). Documento claro sobre o HUD escuro.
 */
function RelatorioVerif() {
  const aberto = useVerif((s) => s.relatorioAberto)
  const fechar = useVerif((s) => s.fecharRelatorio)
  const registros = useVerif((s) => s.registros)
  const reset = useVerif((s) => s.reset)
  if (!aberto) return null

  const linhas = ENSAIOS_VERIFICACAO.map((ensaio) => ({
    ensaio,
    pontos: Object.entries(registros)
      .filter(([k]) => k.startsWith(ensaio.id + '@'))
      .map(([k, r]) => ({ alvo: k.split('@')[1], r })),
  }))
  const total = ENSAIOS_VERIFICACAO.length
  const feitos = linhas.filter((l) => l.pontos.length > 0).length
  const algumReprovado = Object.values(registros).some((r) => !r.aprovado)
  const status = algumReprovado ? 'reprovado' : feitos === total ? 'aprovado' : 'andamento'

  const parecer =
    status === 'aprovado'
      ? { txt: 'INSTALAÇÃO APROVADA', sub: 'Todos os ensaios atenderam aos critérios da NBR 5410 — Seção 7.', bg: '#e7f6ec', fg: '#1e7e44', bar: '#27ae60', ico: '✓' }
      : status === 'reprovado'
        ? { txt: 'NÃO CONFORME', sub: 'Há ensaios fora do critério — corrigir e reensaiar antes da energização.', bg: '#fdeceb', fg: '#b3271e', bar: '#e74c3c', ico: '✕' }
        : { txt: 'VERIFICAÇÃO EM ANDAMENTO', sub: `${feitos} de ${total} ensaios concluídos. Conclua os demais para o parecer final.`, bg: '#fef6e6', fg: '#8a6100', bar: '#f0a500', ico: '◔' }

  const data = new Date().toLocaleDateString('pt-BR')

  return (
    <div
      className="absolute inset-0 z-[70] grid place-items-center p-4 pointer-events-auto"
      style={{ background: 'rgba(7,10,14,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={fechar}
    >
      <div
        className="rounded-[16px] w-[660px] max-w-[94vw] max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: '#f7f9fb', boxShadow: '0 30px 80px -24px #000', fontFamily: 'Inter, system-ui, sans-serif' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* cabeçalho */}
        <div style={{ background: '#13243b', color: '#fff', padding: '18px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#7fb0ff', fontWeight: 700 }}>LAUDO DE VERIFICAÇÃO FINAL</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>NBR 5410 — Seção 7</div>
            <div style={{ fontSize: 13, color: '#aebfd4' }}>Verificação de instalação · Ambiente hospitalar</div>
          </div>
          <button onClick={fechar} aria-label="Fechar laudo" style={{ color: '#aebfd4', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {/* metadados */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', padding: '10px 24px', fontSize: 12, color: '#5b6b7c', background: '#eef2f6', borderBottom: '1px solid #dde4ec' }}>
          <span><b style={{ color: '#1d2733' }}>Instrumento:</b> Fluke 1662</span>
          <span><b style={{ color: '#1d2733' }}>Método:</b> Ensaios §7.3 (verificação final)</span>
          <span><b style={{ color: '#1d2733' }}>Data:</b> {data}</span>
        </div>

        {/* parecer */}
        <div style={{ background: parecer.bg, borderLeft: `5px solid ${parecer.bar}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ color: parecer.fg, fontSize: 26, fontWeight: 800 }}>{parecer.ico}</span>
          <div>
            <div style={{ color: parecer.fg, fontWeight: 800, fontSize: 17 }}>{parecer.txt}</div>
            <div style={{ color: '#41505f', fontSize: 12.5 }}>{parecer.sub}</div>
          </div>
        </div>

        {/* tabela de ensaios */}
        <div className="hud-scroll" style={{ overflowY: 'auto', padding: '4px 24px 8px' }}>
          {linhas.map(({ ensaio, pontos }) => {
            const pend = pontos.length === 0
            const ruim = pontos.some((p) => !p.r.aprovado)
            const cor = pend ? '#9aa3ad' : ruim ? '#b3271e' : '#1e7e44'
            return (
              <div key={ensaio.id} style={{ borderBottom: '1px solid #e6eaef', padding: '11px 0', display: 'flex', gap: 11 }}>
                <span style={{ color: cor, fontWeight: 800, fontSize: 16, width: 16, textAlign: 'center' }}>{pend ? '○' : ruim ? '✕' : '✓'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1d2733' }}>{ensaio.nome}</span>
                    {!pend && <span style={{ fontWeight: 800, fontSize: 11, color: cor, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{ruim ? 'NÃO CONFORME' : 'CONFORME'}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6b7785', marginTop: 1 }}>{ensaio.norma}</div>
                  {pend ? (
                    <div style={{ fontSize: 12, color: '#9aa3ad', marginTop: 3, fontStyle: 'italic' }}>Não ensaiado.</div>
                  ) : (
                    pontos.map((p, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#41505f', marginTop: 3, display: 'flex', gap: 6 }}>
                        <span style={{ color: '#1d2733', fontWeight: 700, whiteSpace: 'nowrap' }}>{p.r.display} {p.r.unidade}</span>
                        <span style={{ color: '#8a96a3' }}>·</span>
                        <span><b style={{ color: '#41505f' }}>{nomeAlvo(p.alvo)}</b> — {p.r.veredito}</span>
                      </div>
                    ))
                  )}
                  <div style={{ fontSize: 11, color: '#8a96a3', marginTop: 3 }}>Critério: {ensaio.criterio}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* rodapé */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 24px', borderTop: '1px solid #dde4ec', background: '#eef2f6' }}>
          <span style={{ fontSize: 11, color: '#8a96a3' }}>Documento de treinamento — SimuPower · não substitui laudo de profissional habilitado.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                reset()
                fechar()
              }}
              style={{ fontSize: 12.5, padding: '8px 14px', borderRadius: 9, background: '#fff', color: '#41505f', border: '1px solid #cdd6df', fontWeight: 600 }}
            >
              ↺ Nova verificação
            </button>
            <button
              onClick={fechar}
              style={{ fontSize: 12.5, padding: '8px 18px', borderRadius: 9, background: '#13243b', color: '#fff', fontWeight: 700 }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

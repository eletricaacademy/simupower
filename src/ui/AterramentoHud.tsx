import { useEffect, useRef, useState } from 'react'
import { useSim, passoHabilitado } from '../sim/store'
import { useInsp } from '../sim/inspStore'
import { useAter } from '../sim/aterStore'
import { resistenciaAparente, avaliar, POS_62, RTERRA, type PerfilSolo } from '../engine/aterramento'
import { Checklist } from './Checklist'
import { QualityPicker } from './QualityPicker'
import { ViewControls } from './ViewControls'
import { SoundControl } from './SoundControl'
import { Creditos } from './Creditos'
import { useDraggable } from './useDraggable'
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
  const setView = useSim((s) => s.setView)
  const setMostrarGrade = useInsp((s) => s.setMostrarGrade)
  const setMostrarParedes = useInsp((s) => s.setMostrarParedes)
  const resetAter = useAter((s) => s.reset)
  const cfgDrag = useDraggable()

  // garante que o modelo do pátio apareça inteiro (sem o corte de grade/paredes)
  useEffect(() => {
    setMostrarGrade(true)
    setMostrarParedes(true)
    resetAter()
  }, [setMostrarGrade, setMostrarParedes, resetAter])

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <button
        onClick={() => setView('menu')}
        aria-label="Voltar ao menu principal"
        className="absolute hud-glass rounded-[12px] px-3 py-2 text-[12px] pointer-events-auto flex items-center gap-1.5"
        style={{ top: 'max(12px, env(safe-area-inset-top))', left: 'max(12px, env(safe-area-inset-left))', color: color.textMuted }}
      >
        <span aria-hidden>‹</span> Menu
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto" style={{ top: 'max(12px, env(safe-area-inset-top))' }}>
        <TopBar />
        <button
          onClick={() => setConfigAberto((v) => !v)}
          aria-label="Configurações"
          className="hud-glass rounded-[12px] px-3 py-2 text-[12px]"
          style={{ color: configAberto ? color.accent : color.textMuted }}
        >
          ⚙
        </button>
      </div>

      <div className="absolute pointer-events-auto" style={{ top: 'max(12px, env(safe-area-inset-top))', right: 'max(12px, env(safe-area-inset-right))' }}>
        <SoundControl />
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-auto">
        <ViewControls />
      </div>

      {configAberto && (
        <div className="absolute right-3 pointer-events-auto" style={{ top: 72 }}>
          <div className="hud-glass rounded-[14px] p-4 w-[280px] max-h-[80vh] overflow-y-auto hud-scroll" style={cfgDrag.style}>
            <div className="font-display font-semibold text-[14px] mb-3 select-none" style={{ color: color.text, ...cfgDrag.handleStyle }} {...cfgDrag.handlers}>
              ⠿ Configurações
            </div>
            <PerfilPicker />
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <IdentificarPonto />
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <QualityPicker />
          </div>
        </div>
      )}

      {/* DESKTOP */}
      <div className="hidden md:flex absolute left-4 bottom-4 flex-col gap-3 pointer-events-auto">
        <GuidedCard />
        <div className="hud-glass rounded-[14px] p-3 w-[360px]">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: color.textFaint }}>
            Procedimento
          </div>
          <Checklist />
        </div>
      </div>

      <div className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
        <Terrometro />
      </div>

      {/* MOBILE */}
      <div className="md:hidden absolute inset-x-0 bottom-0 pointer-events-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex gap-1.5 px-3 mb-2">
          <Tab ativo={aba === 'procedimento'} onClick={() => setAba('procedimento')}>Procedimento</Tab>
          <Tab ativo={aba === 'medicao'} onClick={() => setAba('medicao')}>Medição</Tab>
        </div>
        <div className="px-3 pb-3 flex justify-center">{aba === 'procedimento' ? <GuidedCard /> : <Terrometro />}</div>
      </div>

      <div className="hidden md:block">
        <Creditos />
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

function TopBar() {
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  return (
    <div className="hud-glass rounded-[12px] px-4 py-2 max-w-[94vw]">
      <div className="font-display font-semibold text-[13px]" style={{ color: color.text }}>{equipamento.nome}</div>
      <div className="text-[10px]" style={{ color: color.textFaint }}>{ensaio.nome} · {ensaio.norma}</div>
    </div>
  )
}

function GuidedCard() {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const marcarPasso = useSim((s) => s.marcarPasso)
  const irParaPasso = useSim((s) => s.irParaPasso)
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

  return (
    <div className="hud-glass rounded-[14px] p-4 w-[360px] max-w-[88vw]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#0c1117', color: color.accent, border: `1px solid ${color.hairline}` }}>
          PASSO {passoIndex + 1}/{total}
        </span>
        {passo.norma && <span className="text-[10px]" style={{ color: color.textFaint }}>{passo.norma}</span>}
      </div>
      <h2 className="font-display font-semibold text-[18px] mb-1" style={{ color: color.text }}>{passo.titulo}</h2>
      <p className="text-[13px] leading-snug mb-2" style={{ color: color.textMuted }}>{passo.descricao}</p>
      {passo.detalhes && passo.detalhes.length > 0 && (
        <ul className="mb-3 space-y-1">
          {passo.detalhes.map((d, i) => (
            <li key={i} className="flex gap-1.5 text-[12px] leading-snug" style={{ color: color.textMuted }}>
              <span aria-hidden style={{ color: color.accentCool }}>›</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
      {jaCumprido && passo.feito && (
        <div className="rounded-[10px] px-3 py-2 mb-3 text-[12.5px] flex gap-1.5" style={{ background: color.status.pass + '14', border: `1px solid ${color.status.pass}55`, color: color.text }}>
          <span aria-hidden style={{ color: color.status.pass }}>✓</span>
          <span>{passo.feito}</span>
        </div>
      )}
      <button
        onClick={() => marcarPasso(passo.id)}
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

  const rLive = resistenciaAparente(perfil, posP)
  const v = avaliar(rLive)

  return (
    <div className="instrument-panel rounded-[14px] p-4 w-[330px] max-w-[90vw]">
      <div className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: color.textFaint }}>
        Terrômetro · queda de potencial
      </div>

      {/* leitura */}
      <div className="rounded-[10px] px-3 py-2 mb-3 flex items-baseline justify-between" style={{ background: '#0c1117', border: `1px solid ${color.hairline}` }}>
        <span className="font-mono font-bold text-[30px]" style={{ color: CORV[v.cor] }}>{rLive.toFixed(1)}</span>
        <span className="font-mono text-[14px]" style={{ color: color.textMuted }}>Ω</span>
      </div>

      <Curva perfil={perfil} posP={posP} medicoes={medicoes} />

      {/* posição da estaca P */}
      <div className="mt-3">
        <div className="flex justify-between text-[11px] mb-1" style={{ color: color.textMuted }}>
          <span>Estaca P</span>
          <span className="font-mono">{(posP * 100).toFixed(0)}% · {(posP * distanciaM).toFixed(1)} m</span>
        </div>
        <input type="range" min={0} max={1} step={0.01} value={posP} onChange={(e) => setPosP(Number(e.target.value))} className="w-full" style={{ accentColor: color.accent }} />
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => setPosP(POS_62)} className="px-3 py-2 rounded-[9px] text-[12px]" style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}>
          Ir a 62%
        </button>
        <button onClick={registrar} className="flex-1 py-2 rounded-[9px] text-[12px] font-medium" style={{ background: '#0c1117', color: color.text, border: `1px solid ${color.hairline}` }}>
          Registrar ponto
        </button>
        <button onClick={calcular} className="flex-1 py-2 rounded-[9px] font-display font-semibold text-[12px]" style={{ background: color.accent, color: '#0B0F14' }}>
          Calcular
        </button>
      </div>

      {resultado && (
        <div className="mt-3 rounded-[10px] px-3 py-2.5" style={{ background: CORV[resultado.cor] + '14', border: `1px solid ${CORV[resultado.cor]}66` }}>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider" style={{ color: color.textFaint }}>R a 62%</span>
            <span className="font-mono font-bold text-[20px]" style={{ color: CORV[resultado.cor] }}>{resultado.r62.toFixed(1)} Ω</span>
          </div>
          <div className="font-display font-semibold text-[14px] mt-1" style={{ color: CORV[resultado.cor] }}>{resultado.veredito}</div>
          <div className="text-[10px] mt-0.5" style={{ color: color.textFaint }}>Limite NBR 5419 (SPDA): ≤ 10 Ω</div>
        </div>
      )}
    </div>
  )
}

/** Gráfico SVG R × posição da estaca P. */
function Curva({ perfil, posP, medicoes }: { perfil: PerfilSolo; posP: number; medicoes: { x: number; r: number }[] }) {
  const W = 290
  const H = 110
  const pad = 6
  const maxR = Math.max(RTERRA[perfil] * 2.6, resistenciaAparente(perfil, 0.92))
  const sx = (x: number) => pad + x * (W - 2 * pad)
  const sy = (r: number) => H - pad - (Math.min(r, maxR) / maxR) * (H - 2 * pad)
  const pts: string[] = []
  for (let i = 0; i <= 40; i++) {
    const x = i / 40
    pts.push(`${sx(x).toFixed(1)},${sy(resistenciaAparente(perfil, x)).toFixed(1)}`)
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: '#0c1117', borderRadius: 8, border: `1px solid ${color.hairline}` }}>
      {/* linha de 62% */}
      <line x1={sx(POS_62)} y1={pad} x2={sx(POS_62)} y2={H - pad} stroke={color.status.pass} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      <text x={sx(POS_62) + 3} y={pad + 9} fontSize="8" fill={color.status.pass} fontFamily="monospace">62%</text>
      {/* curva teórica */}
      <polyline points={pts.join(' ')} fill="none" stroke={color.accentCool} strokeWidth="1.6" />
      {/* pontos registrados */}
      {medicoes.map((m, i) => (
        <circle key={i} cx={sx(m.x)} cy={sy(m.r)} r="2.4" fill={color.accent} />
      ))}
      {/* posição atual */}
      <circle cx={sx(posP)} cy={sy(resistenciaAparente(perfil, posP))} r="3.4" fill="#fff" stroke={color.accent} strokeWidth="1.5" />
    </svg>
  )
}

type AlvoCalib = 'medicao' | 'terrometro' | 'direcao'
const ALVOS: { id: AlvoCalib; label: string }[] = [
  { id: 'medicao', label: 'Medição (trafo)' },
  { id: 'terrometro', label: 'Terrômetro' },
  { id: 'direcao', label: 'Direção hastes' },
]

/**
 * IdentificarPonto — calibração por clique de VÁRIOS pontos do ensaio:
 *  - medição (base do trafo, onde conecta o cabo E),
 *  - terrômetro (onde o aparelho fica),
 *  - direção (para onde as hastes P/C se espalham).
 * Liga o pickMode (useSim): clicar no modelo OU no chão reporta a coordenada
 * (EnvScene já copia p/ a área de transferência). Cada clique grava no alvo
 * selecionado; "Copiar tudo" junta os 3 p/ enviar.
 */
function IdentificarPonto() {
  const pickMode = useSim((s) => s.pickMode)
  const setPickMode = useSim((s) => s.setPickMode)
  const peca = useSim((s) => s.peca)
  const [alvo, setAlvo] = useState<AlvoCalib>('terrometro')
  const [pts, setPts] = useState<Partial<Record<AlvoCalib, string>>>({ medicao: '2.51, 0.79, -0.14' })
  const ultimo = useRef('')

  useEffect(() => {
    if (peca && peca !== ultimo.current) {
      ultimo.current = peca
      const coord = peca.split('  [')[0] // só x, y, z
      setPts((p) => ({ ...p, [alvo]: coord }))
    }
  }, [peca, alvo])

  const copiarTudo = () => {
    const txt = ALVOS.map((a) => `${a.label}: ${pts[a.id] ?? '—'}`).join('\n')
    navigator.clipboard?.writeText(txt)
  }

  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>
        Calibrar pontos
      </div>
      <div className="grid grid-cols-3 gap-1 mb-2">
        {ALVOS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAlvo(a.id)}
            className="text-[10px] py-1 rounded-[7px] leading-tight"
            style={{
              background: alvo === a.id ? color.accentCool : '#0c1117',
              color: alvo === a.id ? '#0B0F14' : color.textMuted,
              border: `1px solid ${alvo === a.id ? color.accentCool : color.hairline}`,
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setPickMode(!pickMode)}
        className="w-full text-[12px] py-1.5 rounded-[8px]"
        style={{
          background: pickMode ? color.accent : '#0c1117',
          color: pickMode ? '#0B0F14' : color.textMuted,
          border: `1px solid ${pickMode ? color.accent : color.hairline}`,
          fontWeight: pickMode ? 700 : 400,
        }}
      >
        {pickMode ? `◉ Clique: ${ALVOS.find((a) => a.id === alvo)?.label}…` : 'Ativar clique'}
      </button>
      <div className="mt-2 space-y-0.5">
        {ALVOS.map((a) => (
          <div key={a.id} className="flex justify-between gap-2 text-[10px]">
            <span style={{ color: color.textMuted }}>{a.label}</span>
            <span className="font-mono break-all text-right" style={{ color: pts[a.id] ? color.accentCool : color.textFaint }}>
              {pts[a.id] ?? '—'}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={copiarTudo}
        className="w-full mt-2 text-[11px] py-1.5 rounded-[8px]"
        style={{ background: '#0c1117', color: color.text, border: `1px solid ${color.hairline}` }}
      >
        Copiar tudo p/ enviar
      </button>
    </div>
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

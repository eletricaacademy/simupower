import { useState, useEffect, useRef } from 'react'
import { useSim, passoHabilitado } from '../sim/store'
import { useInsp } from '../sim/inspStore'
import { Checklist } from './Checklist'
import { QualityPicker } from './QualityPicker'
import { ViewControls } from './ViewControls'
import { Creditos } from './Creditos'
import { useDraggable } from './useDraggable'
import { SoundControl } from './SoundControl'
import { Apresentador } from './Apresentador'
import { BemVindo } from './BemVindo'
import { som, somArquivo, somVoz, pararVoz, ambiente, type SomTipo } from './sons'
import type { AcaoDes } from '../catalog/types'
import { color } from '../design/tokens'

const SOM_POR_ACAO: Record<AcaoDes, SomTipo> = {
  confirmar: 'passo',
  seccionar: 'seccionar',
  bloquear: 'bloquear',
  testar: 'testar',
  aterrar: 'aterrar',
  proteger: 'proteger',
  sinalizar: 'sinalizar',
  'carregar-mola': 'passo',
  religar: 'religar',
  'rem-sinalizar': 'remover',
  'rem-proteger': 'remover',
  'rem-aterrar': 'remover',
  'rem-bloquear': 'remover',
}

/** ações que pedem confirmação "Preparado? Sim/Não" (manobras do disjuntor). */
const PEDE_CONFIRMACAO: AcaoDes[] = ['seccionar', 'religar', 'carregar-mola']
const TEXTO_MANOBRA: Partial<Record<AcaoDes, string>> = {
  seccionar: 'ABRIR o disjuntor',
  religar: 'FECHAR o disjuntor',
  'carregar-mola': 'CARREGAR A MOLA do disjuntor',
}

/**
 * DesenergizacaoHud — procedimento de desenergização/reenergização (NR-10).
 * Passos guiados (clique no ponto 3D destacado ou botão), painel de estado de
 * segurança e travas de sequência.
 */
export function DesenergizacaoHud() {
  const [aba, setAba] = useState<'procedimento' | 'estado'>('procedimento')
  const [configAberto, setConfigAberto] = useState(false)
  const [dialogo, setDialogo] = useState(true)
  const [falando, setFalando] = useState(false)
  const [pronto, setPronto] = useState(false) // false → pop-up de boas-vindas
  const [comemoracao, setComemoracao] = useState<'des' | 'reen' | null>(null)
  const setView = useSim((s) => s.setView)
  const irParaPasso = useSim((s) => s.irParaPasso)
  const setTour = useSim((s) => s.setTour)
  const setMostrarParedes = useInsp((s) => s.setMostrarParedes)
  const setMostrarGrade = useInsp((s) => s.setMostrarGrade)
  const passoIndex = useSim((s) => s.passoIndex)
  const cumpridos = useSim((s) => s.cumpridos)
  const ensaio = useSim((s) => s.ensaio)
  const cfgDrag = useDraggable()
  const prevCump = useRef<Record<string, boolean>>({})

  // começa sem paredes/grade e com a câmera conduzida (zoom em cada ponto)
  useEffect(() => {
    setMostrarParedes(false)
    setMostrarGrade(false)
    setTour(true)
  }, [setMostrarParedes, setMostrarGrade, setTour])

  const setConfirmando = useSim((s) => s.setConfirmando)
  // abre o diálogo de detalhes ao chegar em cada etapa; cancela confirmação pendente
  useEffect(() => {
    setDialogo(true)
    setConfirmando(null)
  }, [passoIndex, setConfirmando])

  // locução: narra a etapa atual ao chegar; avatar "fala" enquanto toca
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
    if (pronto) narrar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passoIndex, pronto])
  useEffect(() => () => pararVoz(), [])

  // som de alta tensão (energizada): toca até seccionar, volta ao religar
  const seccionado = !!cumpridos['des-seccionar'] && !cumpridos['reen-religar']
  useEffect(() => {
    ambiente(!seccionado)
  }, [seccionado])
  useEffect(() => () => ambiente(false), []) // para ao sair do módulo

  // sons ao concluir cada etapa
  useEffect(() => {
    for (const st of ensaio.steps) {
      if (cumpridos[st.id] && !prevCump.current[st.id]) {
        if (st.id === 'des-liberado') {
          somArquivo('palmas')
          setComemoracao('des')
        } else if (st.id === 'reen-energizada') {
          somArquivo('palmas')
          setComemoracao('reen')
        } else if (st.acaoTipo === 'seccionar' || st.acaoTipo === 'religar') somArquivo('disjuntor')
        else if (st.acaoTipo === 'carregar-mola') somArquivo('mola')
        else if (st.acaoTipo === 'bloquear') somArquivo('fechadura')
        else if (st.acaoTipo === 'aterrar') somArquivo('catraca')
        else som(st.acaoTipo ? SOM_POR_ACAO[st.acaoTipo] : 'passo')
      }
    }
    prevCump.current = { ...cumpridos }
  }, [cumpridos, ensaio])

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

      <div
        className="absolute pointer-events-auto"
        style={{ top: 56, left: 'max(12px, env(safe-area-inset-left))' }}
      >
        <Apresentador falando={falando} onReplay={narrar} />
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto"
        style={{ top: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2">
          <DesTopBar />
          <button
            onClick={() => setDialogo(true)}
            aria-label="Detalhes da etapa"
            className="hud-glass rounded-[12px] px-3 py-2 text-[12px]"
            style={{ color: color.accentCool }}
          >
            ℹ
          </button>
          <button
            onClick={() => setConfigAberto((v) => !v)}
            aria-label="Configurações"
            className="hud-glass rounded-[12px] px-3 py-2 text-[12px]"
            style={{ color: configAberto ? color.accent : color.textMuted }}
          >
            ⚙
          </button>
        </div>
        <ToggleBar />
      </div>

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
          <div className="hud-glass rounded-[14px] p-4 w-[280px] max-h-[80vh] overflow-y-auto hud-scroll" style={cfgDrag.style}>
            <div className="font-display font-semibold text-[14px] mb-3 select-none" style={{ color: color.text, ...cfgDrag.handleStyle }} {...cfgDrag.handlers}>
              ⠿ Configurações
            </div>
            <QualityPicker />
            <div className="my-3 h-px" style={{ background: color.hairline }} />
            <Calibrar />
          </div>
        </div>
      )}

      {/* DESKTOP */}
      <div className="hidden md:flex absolute left-4 bottom-4 flex-col gap-3 pointer-events-auto">
        <DesGuidedPanel />
        <div className="hud-glass rounded-[14px] p-3 w-[360px]">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: color.textFaint }}>
            Sequência (NR-10)
          </div>
          <Checklist />
        </div>
      </div>

      <div className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
        <DesEstado />
      </div>

      {/* MOBILE */}
      <div className="md:hidden absolute inset-x-0 bottom-0 pointer-events-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex gap-1.5 px-3 mb-2">
          <Tab ativo={aba === 'procedimento'} onClick={() => setAba('procedimento')}>Procedimento</Tab>
          <Tab ativo={aba === 'estado'} onClick={() => setAba('estado')}>Estado</Tab>
        </div>
        <div className="px-3 pb-3 flex justify-center">{aba === 'procedimento' ? <DesGuidedPanel /> : <DesEstado />}</div>
      </div>

      {dialogo && <DetalheDialog onClose={() => setDialogo(false)} />}
      <Banner />

      {comemoracao && (
        <Comemoracao
          tipo={comemoracao}
          onProsseguir={() => {
            setComemoracao(null)
            irParaPasso(passoIndex + 1)
          }}
          onFechar={() => setComemoracao(null)}
          onMenu={() => setView('menu')}
        />
      )}

      {!pronto && <BemVindo onClose={() => setPronto(true)} />}

      <div className="hidden md:block">
        <Creditos />
      </div>
    </div>
  )
}

/** Pop-up de comemoração ao concluir desenergização / reenergização. */
function Comemoracao({
  tipo,
  onProsseguir,
  onFechar,
  onMenu,
}: {
  tipo: 'des' | 'reen'
  onProsseguir: () => void
  onFechar: () => void
  onMenu: () => void
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto p-4"
      style={{ background: 'rgba(7,10,14,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="hud-glass rounded-[16px] p-6 w-[460px] max-w-[92vw] text-center">
        <div className="text-[40px] mb-2" aria-hidden>
          🎉
        </div>
        <h2 className="font-display font-bold text-[20px] mb-2" style={{ color: color.status.pass }}>
          {tipo === 'des' ? 'Desenergização concluída!' : 'Reenergização concluída!'}
        </h2>
        <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: color.textMuted }}>
          {tipo === 'des'
            ? 'Procedimento de desenergização finalizado com sucesso, conforme a NR-10. A instalação está segura para a manutenção.'
            : 'Subestação reenergizada com sucesso e novamente em operação. Procedimento completo.'}
        </p>
        {tipo === 'des' ? (
          <div className="flex gap-2">
            <button
              onClick={onFechar}
              className="px-4 py-2.5 rounded-[10px] text-[14px] font-medium"
              style={{ background: '#0c1117', color: color.textMuted, border: `1px solid ${color.hairline}` }}
            >
              Fechar
            </button>
            <button
              onClick={onProsseguir}
              className="flex-1 py-2.5 rounded-[10px] font-display font-semibold text-[15px]"
              style={{ background: color.accent, color: '#0B0F14' }}
            >
              Prosseguir para a reenergização ›
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onFechar}
              className="px-4 py-2.5 rounded-[10px] text-[14px] font-medium"
              style={{ background: '#0c1117', color: color.textMuted, border: `1px solid ${color.hairline}` }}
            >
              Fechar
            </button>
            <button
              onClick={onMenu}
              className="flex-1 py-2.5 rounded-[10px] font-display font-semibold text-[15px]"
              style={{ background: color.accent, color: '#0B0F14' }}
            >
              Voltar ao menu
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Caixa de diálogo com detalhe, cuidados e erros comuns da etapa atual. */
function DetalheDialog({ onClose }: { onClose: () => void }) {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const passo = ensaio.steps[passoIndex]
  if (!passo) return null
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto p-4"
      style={{ background: 'rgba(7,10,14,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hud-glass rounded-[16px] p-5 w-[440px] max-w-[92vw] max-h-[84vh] overflow-y-auto hud-scroll"
      >
        <div className="flex items-start justify-between mb-2">
          <h2 className="font-display font-semibold text-[18px]" style={{ color: color.text }}>
            {passo.titulo}
          </h2>
          <button onClick={onClose} aria-label="Fechar" className="text-[18px] leading-none" style={{ color: color.textMuted }}>
            ×
          </button>
        </div>
        <p className="text-[13px] leading-snug mb-3" style={{ color: color.textMuted }}>
          {passo.descricao}
        </p>

        {passo.detalhes && passo.detalhes.length > 0 && (
          <Secao titulo="Procedimento" itens={passo.detalhes} cor={color.accentCool} marcador="›" />
        )}
        {passo.cuidados && passo.cuidados.length > 0 && (
          <Secao titulo="⚠ Cuidados" itens={passo.cuidados} cor={color.status.marginal} marcador="•" />
        )}
        {passo.erros && passo.erros.length > 0 && (
          <Secao titulo="✗ Erros comuns" itens={passo.erros} cor={color.status.fail} marcador="•" />
        )}

        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
          style={{ background: color.accent, color: '#0B0F14' }}
        >
          Entendi
        </button>
      </div>
    </div>
  )
}

function Secao({ titulo, itens, cor, marcador }: { titulo: string; itens: string[]; cor: string; marcador: string }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: cor }}>
        {titulo}
      </div>
      <ul className="space-y-1">
        {itens.map((d, i) => (
          <li key={i} className="flex gap-1.5 text-[12.5px] leading-snug" style={{ color: color.textMuted }}>
            <span aria-hidden style={{ color: cor }}>{marcador}</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Banner de conclusão (desenergização completa / reenergizada). */
function Banner() {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const cumpridos = useSim((s) => s.cumpridos)
  const id = ensaio.steps[passoIndex]?.id

  if (id === 'des-liberado' && cumpridos['des-sinalizar']) {
    return (
      <BannerBox cor={color.status.pass}>
        ✅ Desenergização completa — instalação segura. <b>Pode iniciar a manutenção.</b>
      </BannerBox>
    )
  }
  if (id === 'reen-energizada' && cumpridos['reen-religar']) {
    return <BannerBox cor={color.status.fail}>Subestação reenergizada — em operação.</BannerBox>
  }
  return null
}

function BannerBox({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 hud-glass rounded-[12px] px-4 py-2.5 text-[13px] text-center pointer-events-none"
      style={{ top: 116, color: color.text, border: `1px solid ${cor}88`, maxWidth: '90vw' }}
    >
      {children}
    </div>
  )
}

function Tab({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex-1 hud-glass rounded-[10px] py-2 text-[12px] font-medium" style={{ color: ativo ? color.accent : color.textMuted, borderColor: ativo ? color.accent + '66' : undefined }}>
      {children}
    </button>
  )
}

/** Flags de estado de segurança a partir dos passos cumpridos. */
function useEstado() {
  const c = useSim((s) => s.cumpridos)
  const energizadoDeNovo = !!c['reen-religar']
  return {
    seccionado: !!c['des-seccionar'] && !energizadoDeNovo,
    bloqueado: !!c['des-bloquear'] && !c['reen-rem-bloquear'],
    tensaoAusente: !!c['des-testar'] && !energizadoDeNovo,
    aterrado: !!c['des-aterrar'] && !c['reen-rem-aterrar'],
    protegido: !!c['des-proteger'] && !c['reen-rem-proteger'],
    sinalizado: !!c['des-sinalizar'] && !c['reen-rem-sinalizar'],
    liberado: !!c['des-liberado'] && !c['reen-conferir'],
    reenergizada: !!c['reen-energizada'],
  }
}

function DesTopBar() {
  const equipamento = useSim((s) => s.equipamento)
  const ensaio = useSim((s) => s.ensaio)
  const e = useEstado()
  const label = e.reenergizada
    ? 'REENERGIZADA'
    : e.liberado
      ? 'LIBERADA P/ TRABALHO'
      : e.aterrado
        ? 'DESENERGIZADA E ATERRADA'
        : e.bloqueado
          ? 'BLOQUEADA'
          : e.seccionado
            ? 'SECCIONADA'
            : 'ENERGIZADA'
  const cor = e.reenergizada ? color.status.fail : e.liberado || e.aterrado ? color.status.pass : e.seccionado ? color.status.marginal : color.status.fail

  return (
    <div className="hud-glass rounded-[12px] px-4 py-2 flex items-center gap-4 max-w-[94vw]">
      <div className="flex items-center gap-2">
        <div className="leading-tight">
          <div className="font-display font-semibold text-[13px]" style={{ color: color.text }}>{equipamento.nome}</div>
          <div className="text-[10px]" style={{ color: color.textFaint }}>{ensaio.nome} · {ensaio.norma}</div>
        </div>
      </div>
      <div className="h-7 w-px" style={{ background: color.hairline }} />
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
        <span className="font-mono text-[11px]" style={{ color: cor }}>{label}</span>
      </div>
    </div>
  )
}

function DesGuidedPanel() {
  const ensaio = useSim((s) => s.ensaio)
  const passoIndex = useSim((s) => s.passoIndex)
  const marcarPasso = useSim((s) => s.marcarPasso)
  const irParaPasso = useSim((s) => s.irParaPasso)
  const confirmando = useSim((s) => s.confirmando)
  const setConfirmando = useSim((s) => s.setConfirmando)
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
  const interativo = passo.acaoTipo && passo.acaoTipo !== 'confirmar'
  const total = ensaio.steps.length
  const ultimo = passoIndex >= total - 1
  const precisaConfirmar = !!passo.acaoTipo && PEDE_CONFIRMACAO.includes(passo.acaoTipo)
  const aguardando = confirmando === passo.id

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

      {/* resultado da ação (o que aconteceu) */}
      {jaCumprido && passo.feito && (
        <div
          className="rounded-[10px] px-3 py-2 mb-3 text-[12.5px] leading-snug flex gap-1.5"
          style={{ background: color.status.pass + '14', border: `1px solid ${color.status.pass}55`, color: color.text }}
        >
          <span aria-hidden style={{ color: color.status.pass }}>✓</span>
          <span>{passo.feito}</span>
        </div>
      )}

      {interativo && !jaCumprido && habilitado && !aguardando && (
        <div className="text-[11px] mb-2 flex items-center gap-1.5" style={{ color: color.accent }}>
          <span aria-hidden>🔆</span> Clique no ponto destacado na cena — ou no botão abaixo.
        </div>
      )}

      {/* confirmação "Preparado?" (manobras do disjuntor) */}
      {aguardando ? (
        <div
          className="rounded-[10px] p-3"
          style={{ background: color.status.marginal + '14', border: `1px solid ${color.status.marginal}66` }}
        >
          <div className="text-[13px] leading-snug mb-2.5" style={{ color: color.text }}>
            <b style={{ color: color.status.marginal }}>⚠ Preparado?</b> Agora é hora de{' '}
            <b>{passo.acaoTipo ? TEXTO_MANOBRA[passo.acaoTipo] : 'executar a manobra'}</b>.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                marcarPasso(passo.id)
                setConfirmando(null)
              }}
              className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[14px]"
              style={{ background: color.status.pass, color: '#0B0F14' }}
            >
              ✓ Sim
            </button>
            <button
              onClick={() => setConfirmando(null)}
              className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[14px]"
              style={{ background: '#0c1117', color: color.textMuted, border: `1px solid ${color.hairline}` }}
            >
              Não
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => (precisaConfirmar ? setConfirmando(passo.id) : marcarPasso(passo.id))}
          disabled={!habilitado || jaCumprido}
          className="w-full py-2.5 rounded-[10px] font-display font-semibold text-[14px] transition-all"
          style={{
            background: jaCumprido ? '#0c1117' : habilitado ? color.accent : '#0c1117',
            color: jaCumprido ? color.status.pass : habilitado ? '#0B0F14' : color.textFaint,
            border: `1px solid ${jaCumprido ? color.status.pass + '55' : habilitado ? color.accent : color.hairline}`,
            cursor: !habilitado || jaCumprido ? 'default' : 'pointer',
            boxShadow: habilitado && !jaCumprido ? `0 0 20px ${color.accent}44` : 'none',
          }}
        >
          {jaCumprido ? '✓ Etapa concluída' : passo.acao}
        </button>
      )}

      {/* navegação manual — só avança quando o usuário clicar */}
      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={() => irParaPasso(passoIndex - 1)}
          disabled={passoIndex === 0}
          className="px-3 py-2 rounded-[10px] text-[13px] font-medium"
          style={{
            background: '#0c1117',
            color: passoIndex === 0 ? color.textFaint : color.textMuted,
            border: `1px solid ${color.hairline}`,
            cursor: passoIndex === 0 ? 'default' : 'pointer',
            flex: '0 0 auto',
          }}
        >
          ‹ Voltar
        </button>
        <button
          onClick={() => irParaPasso(passoIndex + 1)}
          disabled={!jaCumprido || ultimo}
          className="flex-1 py-2 rounded-[10px] font-display font-semibold text-[13px]"
          style={{
            background: jaCumprido && !ultimo ? color.accentCool : '#0c1117',
            color: jaCumprido && !ultimo ? '#0B0F14' : color.textFaint,
            border: `1px solid ${jaCumprido && !ultimo ? color.accentCool : color.hairline}`,
            cursor: jaCumprido && !ultimo ? 'pointer' : 'default',
          }}
        >
          {ultimo ? 'Fim do procedimento' : 'Próximo ›'}
        </button>
      </div>
    </div>
  )
}

function DesEstado() {
  const e = useEstado()
  const itens: { k: keyof typeof e; rotulo: string }[] = [
    { k: 'seccionado', rotulo: 'Seccionado' },
    { k: 'bloqueado', rotulo: 'Bloqueado (LOTO)' },
    { k: 'tensaoAusente', rotulo: 'Tensão ausente' },
    { k: 'aterrado', rotulo: 'Aterrado' },
    { k: 'protegido', rotulo: 'Partes vivas protegidas' },
    { k: 'sinalizado', rotulo: 'Sinalizado' },
    { k: 'liberado', rotulo: 'Liberado p/ trabalho' },
  ]
  return (
    <div className="instrument-panel rounded-[14px] p-4 w-[300px] max-w-[88vw]">
      <div className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: color.textFaint }}>
        Estado de segurança
      </div>
      <ul className="space-y-1.5">
        {itens.map(({ k, rotulo }) => {
          const on = e[k]
          return (
            <li key={k} className="flex items-center gap-2.5">
              <span
                className="flex items-center justify-center w-5 h-5 rounded-full text-[10px]"
                style={{
                  background: on ? color.status.pass + '22' : '#0c1117',
                  color: on ? color.status.pass : color.textFaint,
                  border: `1px solid ${on ? color.status.pass + '66' : color.hairline}`,
                }}
              >
                {on ? '✓' : '·'}
              </span>
              <span className="text-[13px]" style={{ color: on ? color.text : color.textMuted }}>{rotulo}</span>
            </li>
          )
        })}
      </ul>
      {e.reenergizada && (
        <div className="mt-3 rounded-[10px] px-3 py-2 text-center font-display font-semibold text-[13px]" style={{ background: color.status.fail + '1a', border: `1px solid ${color.status.fail}66`, color: color.status.fail }}>
          Reenergizada — em operação
        </div>
      )}
    </div>
  )
}

/** Toggle Grade/Paredes (fixo no topo). */
function ToggleBar() {
  const grade = useInsp((s) => s.mostrarGrade)
  const setGrade = useInsp((s) => s.setMostrarGrade)
  const paredes = useInsp((s) => s.mostrarParedes)
  const setParedes = useInsp((s) => s.setMostrarParedes)
  const Btn = ({ ativo, onClick, label }: { ativo: boolean; onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[12px]"
      style={{ background: ativo ? color.accent + '22' : 'transparent', color: ativo ? color.accent : color.textMuted, border: `1px solid ${ativo ? color.accent + '66' : color.hairline}` }}
    >
      <span aria-hidden>{ativo ? '👁' : '🚫'}</span>
      {label}
    </button>
  )
  return (
    <div className="hud-glass rounded-[12px] px-1.5 py-1 flex items-center gap-1.5">
      <Btn ativo={grade} onClick={() => setGrade(!grade)} label="Grade" />
      <Btn ativo={paredes} onClick={() => setParedes(!paredes)} label="Paredes" />
    </div>
  )
}

/** Calibrar pontos (identificar por clique). */
function Calibrar() {
  const pickMode = useSim((s) => s.pickMode)
  const setPickMode = useSim((s) => s.setPickMode)
  const peca = useSim((s) => s.peca)
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: color.textFaint }}>Calibrar ponto</div>
      <button
        onClick={() => setPickMode(!pickMode)}
        className="w-full text-[12px] py-1.5 rounded-[8px] mb-1.5"
        style={{ background: pickMode ? color.accent : '#0c1117', color: pickMode ? '#0B0F14' : color.text, border: `1px solid ${pickMode ? color.accent : color.hairline}`, fontWeight: pickMode ? 700 : 400 }}
      >
        🔍 {pickMode ? 'Clicando (ligado)' : 'Identificar ponto'}
      </button>
      {peca && (
        <div className="rounded-[8px] px-2.5 py-1.5 font-mono text-[11px] break-all" style={{ background: '#0c1117', color: color.accentCool, border: `1px solid ${color.hairline}` }}>
          {peca}
        </div>
      )}
      <p className="text-[10px] leading-snug mt-1" style={{ color: color.textFaint }}>
        Clique no disjuntor, bloqueio, teste, aterramento, proteção e sinalização; me envie as coords
        que eu gravo.
      </p>
    </div>
  )
}

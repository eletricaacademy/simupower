import { useState, useEffect, useRef } from 'react'
import { GuidedPanel } from './GuidedPanel'
import { Instrument } from './Instrument'
import { Checklist } from './Checklist'
import { InstructorPanel } from './InstructorPanel'
import { SoundControl } from './SoundControl'
import { HudTopBar } from './HudTopBar'
import { Creditos } from './Creditos'
import { ambiente, som, somArquivo } from './sons'
import { useSim } from '../sim/store'
import { color } from '../design/tokens'

/**
 * Hud — overlay de vidro fosco sobre o palco 3D.
 * Desktop: topo (TopBar), esquerda (procedimento + checklist), direita
 * (instrumento). Mobile: TopBar no topo e painéis colapsáveis na base.
 */
export function Hud() {
  const [aba, setAba] = useState<'procedimento' | 'instrumento'>('procedimento')
  const [instrutorAberto, setInstrutorAberto] = useState(false)
  const [eduAberto, setEduAberto] = useState(false)
  const cumpridos = useSim((s) => s.cumpridos)
  const fase = useSim((s) => s.fase)
  const ensaio = useSim((s) => s.ensaio)
  const prevCump = useRef<Record<string, boolean>>({})
  const prevFase = useRef(fase)

  // som de oficina ao fundo (só preenche o ambiente), ~10%
  useEffect(() => {
    ambiente(true, 'sounds/oficina.mp3', 0.1)
    return () => ambiente(false)
  }, [])

  // sons por etapa concluída
  useEffect(() => {
    for (const st of ensaio.steps) {
      if (cumpridos[st.id] && !prevCump.current[st.id]) {
        if (st.id === 's1-loto') somArquivo('fechadura')
        else if (st.id === 's2-descarga-inicial' || st.id === 's7-descarga-final') som('descarga')
        else if (st.id === 's6-test') som('sucesso')
        else som('passo')
      }
    }
    prevCump.current = { ...cumpridos }
  }, [cumpridos, ensaio])

  // pop-up educativo ao iniciar o TEST
  useEffect(() => {
    if (fase === 'rodando' && prevFase.current !== 'rodando') setEduAberto(true)
    prevFase.current = fase
  }, [fase])

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <HudTopBar onConfig={() => setInstrutorAberto((v) => !v)} configAberto={instrutorAberto} right={<SoundControl />} />

      {/* painel do instrutor (flutuante, canto sup. direito) */}
      {instrutorAberto && (
        <div className="absolute right-3 pointer-events-auto" style={{ top: 72 }}>
          <InstructorPanel onClose={() => setInstrutorAberto(false)} />
        </div>
      )}

      {/* ---------- DESKTOP ---------- */}
      <div className="hidden md:flex absolute left-4 bottom-4 flex-col gap-3 pointer-events-auto">
        <GuidedPanel />
        <div className="checklist-box hud-glass rounded-[14px] p-3 w-[352px]">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: color.textFaint }}>
            Procedimento
          </div>
          <Checklist />
        </div>
      </div>

      <div className="hidden md:block absolute right-4 bottom-4 pointer-events-auto">
        <Instrument />
      </div>

      {/* ---------- MOBILE ---------- */}
      <div
        className="md:hidden absolute inset-x-0 bottom-0 pointer-events-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex gap-1.5 px-3 mb-2">
          <Tab ativo={aba === 'procedimento'} onClick={() => setAba('procedimento')}>
            Procedimento
          </Tab>
          <Tab ativo={aba === 'instrumento'} onClick={() => setAba('instrumento')}>
            Instrumento
          </Tab>
        </div>
        <div className="px-3 pb-3 flex justify-center">
          {aba === 'procedimento' ? <GuidedPanel /> : <Instrument />}
        </div>
      </div>

      {eduAberto && <EnsaioInfo onClose={() => setEduAberto(false)} />}

      <div className="hidden md:block">
        <Creditos />
      </div>
    </div>
  )
}

/** Pop-up educativo exibido ao iniciar o ensaio de isolamento. */
function EnsaioInfo({ onClose }: { onClose: () => void }) {
  const Sec = ({ titulo, cor, itens }: { titulo: string; cor: string; itens: string[] }) => (
    <div className="mb-3">
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: cor }}>
        {titulo}
      </div>
      <ul className="space-y-1">
        {itens.map((d, i) => (
          <li key={i} className="flex gap-1.5 text-[12.5px] leading-snug" style={{ color: color.textMuted }}>
            <span aria-hidden style={{ color: cor }}>
              ›
            </span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  )
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto p-4"
      style={{ background: 'rgba(7,10,14,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hud-glass rounded-[16px] p-5 w-[460px] max-w-[92vw] max-h-[84vh] overflow-y-auto hud-scroll"
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="font-display font-semibold text-[18px]" style={{ color: color.text }}>
            Entenda o ensaio de isolamento
          </h2>
          <button onClick={onClose} aria-label="Fechar" className="text-[18px] leading-none" style={{ color: color.textMuted }}>
            ×
          </button>
        </div>
        <Sec
          titulo="Por que fazer"
          cor={color.accentCool}
          itens={[
            'Verifica a integridade do isolamento entre o enrolamento e a carcaça.',
            'Detecta umidade, contaminação e envelhecimento antes que virem falha.',
          ]}
        />
        <Sec
          titulo="Resultados comuns (motor BT)"
          cor={color.status.pass}
          itens={[
            'IEEE 43: mínimo ≈ (kV + 1) MΩ corrigido a 40 °C.',
            'Motores em bom estado: centenas de MΩ a GΩ.',
            'PI (R10min/R1min) > 2 bom · 1–2 questionável · < 1 ruim.',
            'DAR (R60s/R30s) > 1,4 bom (≥ 1,25 aceitável).',
          ]}
        />
        <Sec
          titulo="O que observar"
          cor={color.status.marginal}
          itens={[
            'Curva subindo = absorção dielétrica → isolamento seco/bom.',
            'Curva plana ou valor baixo = umidade ou contaminação.',
            'Temperatura altera muito a leitura — sempre corrija para 40 °C.',
          ]}
        />
        <button
          onClick={onClose}
          className="w-full mt-1 py-2.5 rounded-[10px] font-display font-semibold text-[14px]"
          style={{ background: color.accent, color: '#0B0F14' }}
        >
          Entendi
        </button>
      </div>
    </div>
  )
}

function Tab({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 hud-glass rounded-[10px] py-2 text-[12px] font-medium"
      style={{
        color: ativo ? color.accent : color.textMuted,
        borderColor: ativo ? color.accent + '66' : undefined,
      }}
    >
      {children}
    </button>
  )
}

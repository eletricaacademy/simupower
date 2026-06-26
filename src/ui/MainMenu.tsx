import { useState, type FormEvent } from 'react'
import { useSim } from '../sim/store'
import {
  PAR_PADRAO,
  PAR_ARCO,
  PAR_INSPECAO,
  PAR_DESENERG,
  PAR_ATERRAMENTO,
  PAR_VERIFICACAO,
} from '../catalog'
import { asset } from '../lib/asset'
import { color } from '../design/tokens'

interface Modulo {
  id: string
  titulo: string
  equipamento: string
  instrumento: string
  norma: string
  descricao: string
  disponivel: boolean
  /** quando true, o módulo não aparece no menu (mantido no catálogo). */
  oculto?: boolean
  par?: { equipamentoId: string; ensaioId: string }
}

/** Senha para liberar o acesso às ferramentas. */
const SENHA_ACESSO = '3020'

/** Catálogo de módulos exibidos no menu (orientado a dados). */
const MODULOS: Modulo[] = [
  {
    id: 'iso-motor',
    titulo: 'Teste de Isolamento em Motor',
    equipamento: 'Motor de Indução Trifásico',
    instrumento: 'Megômetro 5 kV · Minipa MI-2705',
    norma: 'IEEE 43 · NBR/IEC 60034-27',
    descricao:
      'Resistência de isolamento no tempo, DAR, PI e correção a 40 °C — com leitura ao vivo e veredito por norma.',
    disponivel: true,
    par: PAR_PADRAO,
  },
  {
    id: 'arco-eletrico',
    titulo: 'Análise de Arco Elétrico',
    equipamento: 'Painel de Média Tensão',
    instrumento: 'Estudo IEEE 1584',
    norma: 'IEEE 1584 · NFPA 70E · NR-10',
    descricao:
      'Cálculo da energia incidente, fronteira de arco e categoria de EPI num painel MT, dentro de subestação.',
    disponivel: true,
    par: PAR_ARCO,
  },
  {
    id: 'inspecao-subestacao',
    titulo: 'Inspeção de Subestação',
    equipamento: 'Subestação abrigada (walk-in)',
    instrumento: 'Checklist NR-10',
    norma: 'NR-10 · NBR 14039',
    descricao:
      'Entre na subestação e faça a inspeção guiada (transformador, cubículos, aterramento, cabos) com veredito de conformidade.',
    disponivel: true,
    par: PAR_INSPECAO,
  },
  {
    id: 'desenergizacao',
    titulo: 'Procedimento de Desenergização',
    equipamento: 'Subestação abrigada (walk-in)',
    instrumento: 'Sequência LOTO',
    norma: 'NR-10 · 10.5 / 10.6',
    descricao:
      'Execute a sequência segura de desenergização (seccionar, bloquear, testar, aterrar, proteger, sinalizar) e a reenergização.',
    disponivel: true,
    par: PAR_DESENERG,
  },
  {
    id: 'aterramento',
    titulo: 'Resistência de Aterramento',
    equipamento: 'Malha / Eletrodo',
    instrumento: 'Terrômetro',
    norma: 'NBR 15749 · IEEE 81',
    descricao: 'Medição de resistência de aterramento por queda de potencial (método dos 62%).',
    disponivel: true,
    par: PAR_ATERRAMENTO,
  },
  {
    id: 'verificacao-5410',
    titulo: 'Verificação de Instalações (NBR 5410)',
    equipamento: 'Instalação Hospitalar (walk-in)',
    instrumento: 'Inspeção visual + ensaios — Seção 7',
    norma: 'NBR 5410 · Seção 7',
    descricao:
      'Verificação final de instalação elétrica de baixa tensão em ambiente hospitalar — inspeção visual e ensaios da Seção 7.',
    disponivel: true,
    par: PAR_VERIFICACAO,
  },
  {
    id: 'disjuntor',
    titulo: 'Ensaios em Disjuntor',
    equipamento: 'Disjuntor de Potência',
    instrumento: 'Analisador de disjuntores',
    norma: 'IEC 62271',
    descricao: 'Tempos de operação e resistência de contatos.',
    disponivel: false,
    oculto: true,
  },
]

export function MainMenu() {
  const carregarPar = useSim((s) => s.carregarPar)
  const setView = useSim((s) => s.setView)
  const [dicaSom, setDicaSom] = useState(() => {
    try {
      return sessionStorage.getItem('calibra:dicaSom') !== '1'
    } catch {
      return true
    }
  })
  function fecharDica() {
    setDicaSom(false)
    try {
      sessionStorage.setItem('calibra:dicaSom', '1')
    } catch {
      /* ignore */
    }
  }

  // bloqueio por senha — libera as ferramentas só após a senha correta.
  const [liberado, setLiberado] = useState(() => {
    try {
      return sessionStorage.getItem('calibra:liberado') === '1'
    } catch {
      return false
    }
  })
  const [senha, setSenha] = useState('')
  const [erroSenha, setErroSenha] = useState(false)
  function tentarLiberar(e: FormEvent) {
    e.preventDefault()
    if (senha.trim() === SENHA_ACESSO) {
      setLiberado(true)
      setErroSenha(false)
      try {
        sessionStorage.setItem('calibra:liberado', '1')
      } catch {
        /* ignore */
      }
    } else {
      setErroSenha(true)
    }
  }

  const [subAter, setSubAter] = useState(false)

  function abrir(m: Modulo) {
    if (!m.disponivel || !m.par) return
    carregarPar(m.par.equipamentoId, m.par.ensaioId)
    setView('sim')
  }

  // ao clicar em Aterramento, abre um submenu (método de medição) em vez de
  // entrar direto na simulação.
  function aoAbrirCard(m: Modulo) {
    if (m.id === 'aterramento') {
      setSubAter(true)
      return
    }
    abrir(m)
  }
  const aterMod = MODULOS.find((m) => m.id === 'aterramento')
  const visiveis = MODULOS.filter((m) => !m.oculto)

  return (
    <div
      className="absolute inset-0 overflow-y-auto hud-scroll"
      style={{
        background: `radial-gradient(1200px 600px at 70% -10%, #14203022 0%, transparent 60%), radial-gradient(900px 500px at 10% 110%, #1a160622 0%, transparent 55%), ${color.viewport}`,
      }}
    >
      {/* gate de senha — bloqueia as ferramentas até a senha correta */}
      {!liberado && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center p-4"
          style={{ background: 'rgba(7,10,14,0.92)', backdropFilter: 'blur(6px)' }}
        >
          <form
            onSubmit={tentarLiberar}
            className="hud-glass rounded-[16px] p-6 w-[420px] max-w-[92vw] text-center"
          >
            <div className="text-[34px] mb-2" aria-hidden>🔒</div>
            <div
              className="font-mono text-[11px] tracking-[0.2em] uppercase mb-2"
              style={{ color: color.accent }}
            >
              Acesso restrito
            </div>
            <h2 className="font-display font-bold text-[20px] mb-3" style={{ color: color.text }}>
              Digite a senha para liberar as ferramentas
            </h2>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value)
                if (erroSenha) setErroSenha(false)
              }}
              placeholder="Senha de acesso"
              aria-label="Senha de acesso"
              className="w-full text-center font-mono text-[16px] tracking-[0.3em] rounded-[10px] px-4 py-3 mb-3 outline-none"
              style={{
                background: '#0c1117',
                color: color.text,
                border: `1px solid ${erroSenha ? color.status.fail : color.hairline}`,
              }}
            />
            {erroSenha && (
              <div className="text-[12px] mb-3" style={{ color: color.status.fail }}>
                Senha incorreta. Tente novamente.
              </div>
            )}
            <button
              type="submit"
              className="w-full font-display font-semibold text-[14px] px-5 py-2.5 rounded-[10px] transition-all"
              style={{ background: color.accent, color: '#0B0F14' }}
            >
              Liberar acesso
            </button>
          </form>
        </div>
      )}

      {/* dica de som ao entrar */}
      {dicaSom && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 hud-glass rounded-[12px] px-4 py-2.5"
          style={{ top: 'max(14px, env(safe-area-inset-top))', maxWidth: '92vw', border: `1px solid ${color.accent}55` }}
        >
          <span aria-hidden className="text-[18px]">🔊</span>
          <span className="text-[13px] leading-snug" style={{ color: color.text }}>
            Para aproveitar melhor a experiência, <b>aumente o som</b> do seu dispositivo.
          </span>
          <button
            onClick={fecharDica}
            aria-label="Fechar aviso"
            className="ml-1 text-[16px] leading-none"
            style={{ color: color.textMuted }}
          >
            ×
          </button>
        </div>
      )}

      {/* submenu do Aterramento: escolher o método de medição */}
      {subAter && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center p-4"
          style={{ background: 'rgba(7,10,14,0.82)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSubAter(false)}
        >
          <div
            className="hud-glass rounded-[16px] p-6 w-[480px] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: color.accent }}>
              Resistência de Aterramento
            </div>
            <h2 className="font-display font-bold text-[20px] mb-1" style={{ color: color.text }}>
              Escolha o método de medição
            </h2>
            <p className="text-[13px] mb-5" style={{ color: color.textMuted }}>
              Medição por queda de potencial com terrômetro de haste (estaca).
            </p>

            {/* opção 1: terrômetro de haste (disponível) */}
            <button
              onClick={() => {
                setSubAter(false)
                if (aterMod) abrir(aterMod)
              }}
              className="w-full text-left rounded-[12px] p-4 mb-3 transition-all"
              style={{ background: '#0c1117', border: `1px solid ${color.accent}` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-[15px]" style={{ color: color.text }}>
                  Terrômetro de haste (estaca)
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ color: color.status.pass, border: `1px solid ${color.status.pass}55` }}>
                  Disponível
                </span>
              </div>
              <div className="text-[12px] mt-1" style={{ color: color.textMuted }}>
                Método da queda de potencial (62%) — estacas C e P cravadas no solo.
              </div>
            </button>

            <button
              onClick={() => setSubAter(false)}
              className="text-[12px]"
              style={{ color: color.textMuted }}
            >
              ‹ Voltar
            </button>
          </div>
        </div>
      )}

      {/* grade técnica de fundo (sutil) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 30%, #000 0%, transparent 75%)',
        }}
      />

      <div className="relative mx-auto max-w-[1100px] px-6 py-10 md:py-16">
        {/* topo / marca */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <img
              src={asset('brand/logo-horizontal.png')}
              alt="SimuPower"
              className="h-12 w-auto"
              style={{ maxWidth: '60vw' }}
            />
            <span className="h-10 w-px" style={{ background: color.hairline }} />
            <span
              className="font-display font-bold flex items-center h-12 px-4 rounded-[10px] whitespace-nowrap text-[20px] tracking-tight"
              style={{ color: color.accentCool, border: `1px solid ${color.hairline}`, background: '#0c1117' }}
            >
              Módulo NR-10
            </span>
          </div>
          <span
            className="hidden sm:inline-block font-mono text-[10px] px-2.5 py-1 rounded-full"
            style={{ color: color.accentCool, border: `1px solid ${color.hairline}`, background: '#0c1117' }}
          >
            3D · PT-BR
          </span>
        </header>

        {/* hero */}
        <section className="mb-12 max-w-[680px]">
          <div
            className="font-mono text-[11px] tracking-[0.2em] uppercase mb-3"
            style={{ color: color.accent }}
          >
            Ambiente de treinamento imersivo
          </div>
          <h1
            className="font-display font-bold leading-[1.05] mb-4"
            style={{ color: color.text, fontSize: 'clamp(28px, 5vw, 46px)' }}
          >
            Execute ensaios de campo em equipamentos elétricos{' '}
            <span style={{ color: color.accent }}>renderizados em 3D</span>.
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: color.textMuted }}>
            Pegue o instrumento, conecte as ponteiras e siga o procedimento guiado passo a passo —
            com leituras ao vivo em instrumentos calibrados e veredito segundo norma.
          </p>
        </section>

        {/* módulos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-[15px]" style={{ color: color.text }}>
              Ensaios
            </h2>
            <span className="font-mono text-[11px]" style={{ color: color.textFaint }}>
              {visiveis.filter((m) => m.disponivel).length} disponível · {visiveis.length} no catálogo
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {visiveis.map((m) => (
              <Card key={m.id} m={m} onOpen={() => aoAbrirCard(m)} />
            ))}
          </div>
        </section>

        <footer
          className="mt-14 pt-6 text-[11px] flex flex-wrap items-center gap-x-6 gap-y-1"
          style={{ borderTop: `1px solid ${color.hairline}`, color: color.textFaint }}
        >
          <span style={{ color: color.textMuted }}>
            Desenvolvido por Elétrica Tools · Eng. Pablo Guimarães
          </span>
          <span>Engine pura e testada · catálogo orientado a dados</span>
          <span className="font-mono">v0.1.0</span>
        </footer>
      </div>
    </div>
  )
}

function Card({ m, onOpen }: { m: Modulo; onOpen: () => void }) {
  const ativo = m.disponivel
  return (
    <button
      onClick={onOpen}
      disabled={!ativo}
      className="group relative text-left rounded-[16px] p-5 transition-all"
      style={{
        background: ativo ? color.surfaceGlass : 'rgba(18,24,33,0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${ativo ? color.hairline : 'rgba(255,255,255,0.04)'}`,
        cursor: ativo ? 'pointer' : 'default',
        boxShadow: ativo ? '0 18px 50px -28px rgba(0,0,0,0.8)' : 'none',
        opacity: ativo ? 1 : 0.6,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-center justify-center w-11 h-11 rounded-[12px]"
          style={{
            background: '#0c1117',
            border: `1px solid ${color.hairline}`,
            color: ativo ? color.accent : color.textFaint,
          }}
        >
          <IconMegger />
        </div>
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded-full"
          style={{
            color: ativo ? color.status.pass : color.textFaint,
            border: `1px solid ${ativo ? color.status.pass + '55' : color.hairline}`,
            background: '#0c1117',
          }}
        >
          {ativo ? 'Disponível' : 'Em breve'}
        </span>
      </div>

      <h3 className="font-display font-semibold text-[16px] mb-1" style={{ color: color.text }}>
        {m.titulo}
      </h3>
      <p className="text-[13px] leading-snug mb-3" style={{ color: color.textMuted }}>
        {m.descricao}
      </p>

      <dl className="space-y-1 mb-4">
        <Linha rotulo="Equipamento" valor={m.equipamento} />
        <Linha rotulo="Instrumento" valor={m.instrumento} />
        <Linha rotulo="Norma" valor={m.norma} mono />
      </dl>

      {ativo ? (
        <div
          className="inline-flex items-center gap-1.5 font-display font-semibold text-[13px] px-3 py-1.5 rounded-[10px] transition-all group-hover:gap-2.5"
          style={{ background: color.accent, color: '#0B0F14' }}
        >
          Iniciar ensaio <span aria-hidden>→</span>
        </div>
      ) : (
        <div className="font-mono text-[11px]" style={{ color: color.textFaint }}>
          em desenvolvimento
        </div>
      )}
    </button>
  )
}

function Linha({ rotulo, valor, mono = false }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div className="flex gap-2 text-[11px]">
      <dt className="shrink-0 w-[78px] uppercase tracking-wide" style={{ color: color.textFaint }}>
        {rotulo}
      </dt>
      <dd className={mono ? 'font-mono' : ''} style={{ color: color.textMuted }}>
        {valor}
      </dd>
    </div>
  )
}

function IconMegger() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6.5" y="6" width="11" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="16.5" r="1.4" fill="currentColor" />
      <circle cx="12" cy="16.5" r="1.4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="16.5" r="1.4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

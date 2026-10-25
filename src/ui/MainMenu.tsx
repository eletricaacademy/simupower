import { useState, useEffect, type FormEvent } from 'react'
import { useSim } from '../sim/store'
import {
  PAR_PADRAO,
  PAR_ARCO,
  PAR_INSPECAO,
  PAR_DESENERG,
  PAR_ATERRAMENTO,
  PAR_VERIFICACAO,
  PAR_SPDA,
  PAR_ESTRUTURAL,
  PAR_USINA_FV,
} from '../catalog'
import { asset } from '../lib/asset'
import { color } from '../design/tokens'
import { Trans, useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector'
import { fmtData } from '../i18n/numero'
import {
  groundProDisponivel,
  entrarNoGroundPro,
  sairDoGroundPro,
  verificarAcessoGroundPro,
  URL_COMPRA_GROUNDPRO,
  type MotivoGroundPro,
} from '../lib/contaGroundPro'
import {
  entrarNoPowerDim,
  sairDoPowerDim,
  verificarAcessoPowerDim,
  type MotivoPowerDim,
} from '../lib/contaPowerDim'

/** Textos do card (título, equipamento…) vêm de `menu.json` → `modulos.<id>`. */
interface Modulo {
  id: string
  disponivel: boolean
  /** quando true, o módulo não aparece no menu (mantido no catálogo). */
  oculto?: boolean
  par?: { equipamentoId: string; ensaioId: string }
}

/** Senha de acesso total (permanente). */
const SENHA_TOTAL = '3020'
/** Senha promocional: libera o simulador até o prazo abaixo (48h). */
const SENHA_TRIAL = '10'
/** Prazo final do acesso promocional (senha 10). Epoch ms — 2026-06-29 16:16:56 UTC (~13:17 Brasília). */
const TRIAL_EXPIRA = 1782749816000
const LS_FULL = 'calibra:full'
const LS_TRIAL = 'calibra:trial'

/** `conta` = liberado por uma conta externa: PowerDim (14/09/2026) ou GroundPRO (12/09/2026). */
type OrigemConta = 'powerdim' | 'groundpro'
type Acesso = { liberado: boolean; promo: boolean; conta?: OrigemConta }

/**
 * Erro do login por conta, guardado como CHAVE de tradução (não como texto):
 * se o usuário trocar o idioma com a mensagem na tela, ela acompanha.
 */
const MOTIVOS_PD = ['sem-conta', 'sem-simupower', 'encerrado', 'sem-sessao'] as const
const MOTIVOS_GP = ['sem-conta', 'encerrado', 'desativado', 'sem-sessao'] as const
function msgPowerDim(motivo: MotivoPowerDim): string {
  return `erroPowerDim.${(MOTIVOS_PD as readonly string[]).includes(motivo) ? motivo : 'outro'}`
}
function msgGroundPro(motivo: MotivoGroundPro): string {
  return `erroGroundPro.${(MOTIVOS_GP as readonly string[]).includes(motivo) ? motivo : 'outro'}`
}

/** Estado de acesso inicial: total permanente, promocional dentro do prazo, ou bloqueado. */
function lerAcesso(): Acesso {
  try {
    if (localStorage.getItem(LS_FULL) === '1') return { liberado: true, promo: false }
    if (localStorage.getItem(LS_TRIAL) === '1' && Date.now() < TRIAL_EXPIRA) {
      return { liberado: true, promo: true }
    }
  } catch {
    /* ignore */
  }
  return { liberado: false, promo: false }
}

/** Formata o tempo restante como "47h 59min 12s". */
function fmtRestante(ms: number): string {
  const tot = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(tot / 3600)
  const m = Math.floor((tot % 3600) / 60)
  const s = tot % 60
  return `${h}h ${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}s`
}

/** Catálogo de módulos exibidos no menu (orientado a dados). */
const MODULOS: Modulo[] = [
  {
    id: 'spda-estrutural',
    disponivel: true, par: PAR_ESTRUTURAL,
  },
  {
    id: 'aterramento-usina-fv',
    disponivel: true,
    par: PAR_USINA_FV,
  },
  {
    id: 'iso-motor',
    disponivel: true,
    par: PAR_PADRAO,
  },
  {
    id: 'arco-eletrico',
    disponivel: true,
    par: PAR_ARCO,
  },
  {
    id: 'inspecao-subestacao',
    disponivel: true,
    par: PAR_INSPECAO,
  },
  {
    id: 'desenergizacao',
    disponivel: true,
    par: PAR_DESENERG,
  },
  {
    id: 'aterramento',
    disponivel: true,
    par: PAR_ATERRAMENTO,
  },
  {
    id: 'continuidade-spda',
    disponivel: true,
    par: PAR_SPDA,
  },
  {
    id: 'verificacao-5410',
    disponivel: true,
    par: PAR_VERIFICACAO,
  },
  {
    id: 'disjuntor',
    disponivel: false,
    oculto: true,
  },
]

export function MainMenu() {
  const { t } = useTranslation('menu')
  const [categoria, setCategoria] = useState('todos')
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
  const [acesso, setAcesso] = useState<Acesso>(() => lerAcesso())
  const liberado = acesso.liberado
  const [senha, setSenha] = useState('')
  const [erroSenha, setErroSenha] = useState(false)
  const [msgErro, setMsgErro] = useState('gate.senhaIncorreta')

  // ── login por conta externa: PowerDim (14/09/2026) ou GroundPRO (12/09/2026) ──
  // Um formulário só (e-mail + senha). Tenta o PowerDim primeiro; se não entrar
  // ou a conta não incluir o SimuPower, tenta o GroundPRO com as MESMAS
  // credenciais. Caminho ADICIONAL: as senhas numéricas acima continuam.
  const [gpEmail, setGpEmail] = useState('')
  const [gpSenha, setGpSenha] = useState('')
  const [gpErro, setGpErro] = useState<string | null>(null)
  const [gpOcupado, setGpOcupado] = useState(false)
  const [gpConta, setGpConta] = useState<{ origem: OrigemConta; email: string | null; fim: string | null; status: string | null } | null>(null)

  // Sessão salva no navegador (PowerDim ou GroundPRO): revalida ao abrir — a
  // data de fim pode ter passado, ou o flag pode ter sido retirado. Só quando as
  // senhas locais não liberaram.
  useEffect(() => {
    if (acesso.liberado) return
    let cancelado = false
    ;(async () => {
      const pd = await verificarAcessoPowerDim()
      if (cancelado) return
      if (pd.liberado) {
        setGpConta({ origem: 'powerdim', email: pd.email ?? null, fim: pd.fim ?? null, status: pd.status ?? null })
        setAcesso({ liberado: true, promo: false, conta: 'powerdim' })
        return
      }
      if (!groundProDisponivel()) return
      const gp = await verificarAcessoGroundPro()
      if (cancelado) return
      if (gp.liberado) {
        setGpConta({ origem: 'groundpro', email: gp.email ?? null, fim: gp.fim ?? null, status: gp.status ?? null })
        setAcesso({ liberado: true, promo: false, conta: 'groundpro' })
      } else if (pd.motivo === 'encerrado' || pd.motivo === 'sem-simupower') {
        setGpErro(msgPowerDim(pd.motivo))
      } else if (gp.motivo === 'encerrado') {
        setGpErro(msgGroundPro('encerrado'))
      }
    })()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function entrarComConta(e: { preventDefault(): void }) {
    e.preventDefault()
    if (gpOcupado) return
    setGpErro(null)
    setGpOcupado(true)
    try {
      // 1) PowerDim
      let motivoPd: MotivoPowerDim = 'sem-sessao'
      const { error: ePd } = await entrarNoPowerDim(gpEmail, gpSenha)
      if (!ePd) {
        const r = await verificarAcessoPowerDim()
        if (r.liberado) {
          setGpConta({ origem: 'powerdim', email: r.email ?? null, fim: r.fim ?? null, status: r.status ?? null })
          setAcesso({ liberado: true, promo: false, conta: 'powerdim' })
          setGpSenha('')
          return
        }
        motivoPd = r.motivo
        await sairDoPowerDim()
      }
      // 2) GroundPRO, com as mesmas credenciais
      let motivoGp: MotivoGroundPro = 'desativado'
      if (groundProDisponivel()) {
        const { error: eGp } = await entrarNoGroundPro(gpEmail, gpSenha)
        if (!eGp) {
          const r = await verificarAcessoGroundPro()
          if (r.liberado) {
            setGpConta({ origem: 'groundpro', email: r.email ?? null, fim: r.fim ?? null, status: r.status ?? null })
            setAcesso({ liberado: true, promo: false, conta: 'groundpro' })
            setGpSenha('')
            return
          }
          motivoGp = r.motivo
          await sairDoGroundPro()
        } else {
          motivoGp = 'sem-sessao'
        }
      }
      // 3) nenhum liberou: mostra o motivo mais informativo. A senha bateu em
      // algum dos dois? Então o problema é a conta, não a credencial.
      if (motivoPd !== 'sem-sessao') setGpErro(msgPowerDim(motivoPd))
      else if (motivoGp !== 'sem-sessao' && motivoGp !== 'desativado') setGpErro(msgGroundPro(motivoGp))
      else setGpErro(msgPowerDim('sem-sessao'))
    } finally {
      setGpOcupado(false)
    }
  }

  async function sairDaConta() {
    if (gpConta?.origem === 'powerdim') await sairDoPowerDim()
    else await sairDoGroundPro()
    setGpConta(null)
    setAcesso(lerAcesso())
  }

  // relógio de segundo em segundo — só roda enquanto o acesso é promocional (senha 10).
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    if (!acesso.promo) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [acesso.promo])
  // ao atingir o prazo de 48h, re-bloqueia o acesso promocional automaticamente.
  useEffect(() => {
    if (acesso.liberado && acesso.promo && agora >= TRIAL_EXPIRA) {
      try {
        localStorage.removeItem(LS_TRIAL)
      } catch {
        /* ignore */
      }
      setAcesso({ liberado: false, promo: false })
    }
  }, [agora, acesso])

  function tentarLiberar(e: FormEvent) {
    e.preventDefault()
    const s = senha.trim()
    if (s === SENHA_TOTAL) {
      try {
        localStorage.setItem(LS_FULL, '1')
      } catch {
        /* ignore */
      }
      setAcesso({ liberado: true, promo: false })
      setErroSenha(false)
      return
    }
    if (s === SENHA_TRIAL) {
      if (Date.now() < TRIAL_EXPIRA) {
        try {
          localStorage.setItem(LS_TRIAL, '1')
        } catch {
          /* ignore */
        }
        setAgora(Date.now())
        setAcesso({ liberado: true, promo: true })
        setErroSenha(false)
      } else {
        setMsgErro('gate.promoExpirou')
        setErroSenha(true)
      }
      return
    }
    setMsgErro('gate.senhaIncorreta')
    setErroSenha(true)
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
  const visiveis = MODULOS.filter((m) => !m.oculto && (categoria === 'todos'
    || (categoria === 'aterramento' && ['aterramento', 'aterramento-usina-fv'].includes(m.id))
    || (categoria === 'spda' && ['continuidade-spda', 'spda-estrutural'].includes(m.id))))

  return (
    <div
      className="absolute inset-0 overflow-y-auto hud-scroll"
      style={{
        background: `radial-gradient(1200px 600px at 70% -10%, #14203022 0%, transparent 60%), radial-gradient(900px 500px at 10% 110%, #1a160622 0%, transparent 55%), ${color.viewport}`,
      }}
    >
      {/* idioma — no canto, acima até do gate de senha: quem não lê português
          precisa conseguir trocar antes de entrar */}
      <div className="fixed z-[90]" style={{ top: 'max(14px, env(safe-area-inset-top))', right: 'max(14px, env(safe-area-inset-right))' }}>
        <LanguageSelector />
      </div>

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
              {t('gate.acessoRestrito')}
            </div>
            <h2 className="font-display font-bold text-[20px] mb-3" style={{ color: color.text }}>
              {t('gate.titulo')}
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
              placeholder={t('gate.senha')}
              aria-label={t('gate.senha')}
              className="w-full text-center font-mono text-[16px] tracking-[0.3em] rounded-[10px] px-4 py-3 mb-3 outline-none"
              style={{
                background: '#0c1117',
                color: color.text,
                border: `1px solid ${erroSenha ? color.status.fail : color.hairline}`,
              }}
            />
            {erroSenha && (
              <div className="text-[12px] mb-3" style={{ color: color.status.fail }}>
                {t(msgErro)}
              </div>
            )}
            <button
              type="submit"
              className="w-full font-display font-semibold text-[14px] px-5 py-2.5 rounded-[10px] transition-all"
              style={{ background: color.accent, color: '#0B0F14' }}
            >
              {t('gate.liberar')}
            </button>

            {/* ── ou: entrar com a conta PowerDim (14/09/2026) ou GroundPRO (12/09/2026) ── */}
            {(
              <div className="mt-5 pt-4 text-left" style={{ borderTop: `1px solid ${color.hairline}` }}>
                <div
                  className="font-mono text-[11px] tracking-[0.2em] uppercase mb-2 text-center"
                  style={{ color: color.textMuted }}
                >
                  {t(groundProDisponivel() ? 'gate.ouContaGp' : 'gate.ouConta')}
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  value={gpEmail}
                  onChange={(e) => {
                    setGpEmail(e.target.value)
                    if (gpErro) setGpErro(null)
                  }}
                  placeholder={t('gate.email')}
                  aria-label={t('gate.email')}
                  className="w-full font-mono text-[14px] rounded-[10px] px-4 py-2.5 mb-2 outline-none"
                  style={{ background: '#0c1117', color: color.text, border: `1px solid ${gpErro ? color.status.fail : color.hairline}` }}
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={gpSenha}
                  onChange={(e) => {
                    setGpSenha(e.target.value)
                    if (gpErro) setGpErro(null)
                  }}
                  placeholder={t('gate.senhaConta')}
                  aria-label={t('gate.senhaConta')}
                  onKeyDown={(e) => {
                    // Enter aqui entra pela conta, não pela senha numérica do formulário de cima.
                    if (e.key === 'Enter') entrarComConta(e)
                  }}
                  className="w-full font-mono text-[14px] rounded-[10px] px-4 py-2.5 mb-3 outline-none"
                  style={{ background: '#0c1117', color: color.text, border: `1px solid ${gpErro ? color.status.fail : color.hairline}` }}
                />
                {gpErro && (
                  <div className="text-[12px] mb-3 text-center" style={{ color: color.status.fail }}>
                    {t(gpErro)}{' '}
                    {gpErro === 'erroGroundPro.encerrado' && (
                      <a href={URL_COMPRA_GROUNDPRO} target="_blank" rel="noopener" className="underline" style={{ color: color.accent }}>
                        {t('gate.whatsapp')}
                      </a>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={entrarComConta}
                  disabled={gpOcupado || !gpEmail.trim() || !gpSenha}
                  className="w-full font-display font-semibold text-[14px] px-5 py-2.5 rounded-[10px] transition-all disabled:opacity-50"
                  style={{ background: 'transparent', color: color.accent, border: `1px solid ${color.accent}` }}
                >
                  {gpOcupado ? t('gate.verificando') : t('gate.entrar')}
                </button>
              </div>
            )}
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
            <Trans t={t} i18nKey="dicaSom" components={{ b: <b /> }} />
          </span>
          <button
            onClick={fecharDica}
            aria-label={t('fecharAviso')}
            className="ml-1 text-[16px] leading-none"
            style={{ color: color.textMuted }}
          >
            ×
          </button>
        </div>
      )}

      {/* aviso de acesso promocional (senha 10) com contagem regressiva de 48h */}
      {liberado && acesso.promo && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 hud-glass rounded-[12px] px-4 py-2.5"
          style={{ bottom: 'max(14px, env(safe-area-inset-bottom))', maxWidth: '92vw', border: `1px solid ${color.accent}55` }}
        >
          <span aria-hidden className="text-[16px]">⏳</span>
          <span className="text-[13px] leading-snug" style={{ color: color.text }}>
            <Trans t={t} i18nKey="promo" components={{ b: <b /> }} />{' '}
            <b className="font-mono" style={{ color: color.accent }}>{fmtRestante(TRIAL_EXPIRA - agora)}</b>
          </span>
        </div>
      )}

      {/* conta GroundPRO: quem entrou por ela vê o e-mail, até quando vale, e pode sair */}
      {liberado && acesso.conta && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 hud-glass rounded-[12px] px-4 py-2.5"
          style={{ bottom: 'max(14px, env(safe-area-inset-bottom))', maxWidth: '92vw', border: `1px solid ${color.accent}55` }}
        >
          <span aria-hidden className="text-[16px]">👤</span>
          <span className="text-[13px] leading-snug" style={{ color: color.text }}>
            {t('conta.conta', { origem: gpConta?.origem === 'powerdim' ? 'PowerDim' : 'GroundPRO' })}{gpConta?.email ? <> · <b>{gpConta.email}</b></> : null}
            {gpConta?.status === 'trial' && gpConta.fim ? (
              <> · {t('conta.trialAte')} <b className="font-mono" style={{ color: color.accent }}>{fmtData(gpConta.fim)}</b></>
            ) : null}
          </span>
          <button
            onClick={sairDaConta}
            className="ml-1 text-[12px] underline"
            style={{ color: color.textMuted }}
          >
            {t('conta.sair')}
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
              {t('modulos.aterramento.titulo')}
            </div>
            <h2 className="font-display font-bold text-[20px] mb-1" style={{ color: color.text }}>
              {t('subAter.titulo')}
            </h2>
            <p className="text-[13px] mb-5" style={{ color: color.textMuted }}>
              {t('subAter.texto')}
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
                  {t('subAter.opcao')}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ color: color.status.pass, border: `1px solid ${color.status.pass}55` }}>
                  {t('card.disponivel')}
                </span>
              </div>
              <div className="text-[12px] mt-1" style={{ color: color.textMuted }}>
                {t('subAter.opcaoTexto')}
              </div>
            </button>

            <button
              onClick={() => setSubAter(false)}
              className="text-[12px]"
              style={{ color: color.textMuted }}
            >
              {t('subAter.voltar')}
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
              {t('marca')}
            </span>
          </div>
        </header>

        {/* hero */}
        <section className="mb-12 max-w-[680px]">
          <div
            className="font-mono text-[11px] tracking-[0.2em] uppercase mb-3"
            style={{ color: color.accent }}
          >
            {t('hero.eyebrow')}
          </div>
          <h1
            className="font-display font-bold leading-[1.05] mb-4"
            style={{ color: color.text, fontSize: 'clamp(28px, 5vw, 46px)' }}
          >
            <Trans t={t} i18nKey="hero.titulo" components={{ a: <span style={{ color: color.accent }} /> }} />
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: color.textMuted }}>
            {t('hero.texto')}
          </p>
        </section>

        {/* módulos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-[15px]" style={{ color: color.text }}>
              {t('ensaios')}
            </h2>
            <span className="font-mono text-[11px]" style={{ color: color.textFaint }}>
              {t('contagem', { disp: visiveis.filter((m) => m.disponivel).length, total: visiveis.length })}
            </span>
          </div>

          <nav aria-label={t('categorias.rotulo')} className="flex flex-wrap gap-2 mb-4">
            {(['todos', 'aterramento', 'spda'] as const).map((id) => (
              <button key={id} type="button" aria-pressed={categoria === id} onClick={() => setCategoria(id)}
                className="rounded-[10px] px-4 py-2.5 text-[13px] font-medium"
                style={{ background: categoria === id ? color.accent : color.surface, color: categoria === id ? color.viewport : color.text, border: `1px solid ${color.hairline}` }}>
                {t(`categorias.${id}`)}
              </button>
            ))}
          </nav>
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
            {t('rodape.autor')}
          </span>
          <span>{t('rodape.engine')}</span>
          <span className="font-mono">v0.1.0</span>
        </footer>
      </div>
    </div>
  )
}

function Card({ m, onOpen }: { m: Modulo; onOpen: () => void }) {
  const { t } = useTranslation('menu')
  const tx = (campo: string) => t(`modulos.${m.id}.${campo}`)
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
          {ativo ? t('card.disponivel') : t('card.emBreve')}
        </span>
      </div>

      <h3 className="font-display font-semibold text-[16px] mb-1" style={{ color: color.text }}>
        {tx('titulo')}
      </h3>
      <p className="text-[13px] leading-snug mb-3" style={{ color: color.textMuted }}>
        {tx('descricao')}
      </p>

      <dl className="space-y-1 mb-4">
        <Linha rotulo={t('card.equipamento')} valor={tx('equipamento')} />
        <Linha rotulo={t('card.instrumento')} valor={tx('instrumento')} />
        <Linha rotulo={t('card.norma')} valor={tx('norma')} mono />
      </dl>

      {ativo ? (
        <div
          className="inline-flex items-center gap-1.5 font-display font-semibold text-[13px] px-3 py-1.5 rounded-[10px] transition-all group-hover:gap-2.5"
          style={{ background: color.accent, color: '#0B0F14' }}
        >
          {t('card.iniciar')} <span aria-hidden>→</span>
        </div>
      ) : (
        <div className="font-mono text-[11px]" style={{ color: color.textFaint }}>
          {t('card.emDesenvolvimento')}
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

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IDIOMAS, IDIOMA_META, normalizarIdioma, type Idioma } from '../i18n/idiomas'
import { color } from '../design/tokens'

/**
 * LanguageSelector — botão de idioma do canto (globo + sigla), com a lista de
 * idiomas em menu suspenso. Mesmo desenho do seletor do GroundPRO; os nomes
 * aparecem no próprio idioma ("Español", "English") para quem caiu no idioma
 * errado ainda achar o seu. A escolha fica salva no navegador (i18n/config).
 *
 * Sem bandeira de propósito: o Windows não desenha emoji de bandeira (vira
 * "ES ES", "US EN") e bandeira é país, não idioma — a da Espanha não representa
 * o aluno da Colômbia ou do Peru.
 */
export function LanguageSelector() {
  const { t, i18n } = useTranslation()
  const atual = normalizarIdioma(i18n.resolvedLanguage)
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  // fecha ao clicar fora ou com Esc
  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('pointerdown', fora)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', fora)
      window.removeEventListener('keydown', esc)
    }
  }, [aberto])

  function escolher(l: Idioma) {
    setAberto(false)
    if (l !== atual) i18n.changeLanguage(l)
  }

  const meta = IDIOMA_META[atual]
  return (
    <div ref={raiz} className="relative pointer-events-auto">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={`${t('idioma.selecionar')}: ${meta.nome}`}
        title={t('idioma.selecionar')}
        className="hud-glass rounded-[10px] px-2.5 py-2 flex items-center gap-1.5 text-[12px] leading-none"
        style={{ color: aberto ? color.accent : color.text }}
      >
        <IconGlobo />
        <span className="font-mono font-semibold">{meta.sigla}</span>
      </button>
      {aberto && (
        <div
          role="menu"
          aria-label={t('idioma.rotulo')}
          className="absolute right-0 mt-1.5 hud-glass rounded-[12px] p-1 min-w-[180px]"
          style={{ zIndex: 120, background: color.surface }}
        >
          <div
            className="px-2.5 pt-1.5 pb-1 text-[10px] uppercase tracking-wider"
            style={{ color: color.textFaint }}
          >
            {t('idioma.rotulo')}
          </div>
          {IDIOMAS.map((l) => {
            const m = IDIOMA_META[l]
            const ativo = l === atual
            return (
              <button
                key={l}
                type="button"
                role="menuitemradio"
                aria-checked={ativo}
                lang={m.lang}
                onClick={() => escolher(l)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-[13px] text-left hover:bg-white/5"
                style={{ color: ativo ? color.text : color.textMuted, fontWeight: ativo ? 600 : 400 }}
              >
                <span className="font-mono text-[10px]" style={{ color: color.textFaint }}>
                  {m.sigla}
                </span>
                <span>{m.nome}</span>
                {ativo && (
                  <span aria-hidden className="ml-auto" style={{ color: color.accent }}>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function IconGlobo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color.accentCool} strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
    </svg>
  )
}

/**
 * config.ts — i18next do SimuPower (mesmo desenho do GroundPRO: recursos
 * embutidos, fallback em português, escolha salva no navegador).
 *
 * Importado uma vez em `main.tsx`. Além da interface (JSON por namespace), ele
 * mantém o store em sincronia: o catálogo (passos, nomes) é traduzido pelo
 * `useSim.setIdioma`, então trocar o idioma no meio do ensaio não perde nada.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { IDIOMAS, IDIOMA_META, IDIOMA_PADRAO, LS_IDIOMA, normalizarIdioma } from './idiomas'
import { useSim } from '../sim/store'

import { RECURSOS, NAMESPACES } from './recursos'

export { RECURSOS }

/**
 * Detectar o idioma do navegador (como o GroundPRO faz) só depois que os nove
 * módulos estiverem traduzidos: hoje um visitante com navegador em espanhol
 * cairia numa tela meio a meio sem ter escolhido. Por ora, só a escolha
 * explícita no seletor do canto vale.
 */
const DETECTAR_NAVEGADOR = false

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: RECURSOS,
    fallbackLng: IDIOMA_PADRAO,
    supportedLngs: [...IDIOMAS],
    nonExplicitSupportedLngs: true, // es-AR → es, pt-BR → pt
    load: 'languageOnly',
    defaultNS: 'common',
    ns: NAMESPACES,
    detection: {
      order: DETECTAR_NAVEGADOR ? ['localStorage', 'navigator'] : ['localStorage'],
      lookupLocalStorage: LS_IDIOMA,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

function aplicar(lng: string | undefined) {
  const idioma = normalizarIdioma(lng)
  if (typeof document !== 'undefined') document.documentElement.lang = IDIOMA_META[idioma].lang
  if (useSim.getState().idioma !== idioma) useSim.getState().setIdioma(idioma)
}

aplicar(i18n.resolvedLanguage)
i18n.on('languageChanged', aplicar)

export default i18n

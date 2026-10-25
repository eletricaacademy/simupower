/**
 * es.ts — Catálogo em espanhol (América Latina, neutro).
 *
 * Terminologia alinhada ao glossário do GroundPRO (puesta a tierra, malla,
 * SPCR, telurómetro). As normas citadas continuam as ABNT/NR do original:
 * o simulador ensina o procedimento brasileiro. Equivalências internacionais e
 * pendências de contexto: `docs/i18n.md`.
 */
import type { TraducaoCatalogo } from './localizar'
import { USINA } from '../usinaFvPontos'
import { ES_USINA_FV } from './es/usinaFv'
import { ES_SPDA } from './es/spda'
import { ES_ESTRUTURAL } from './es/estrutural'
import { ES_VERIFICACAO } from './es/verificacao'
import { ES_DESENERGIZACAO } from './es/desenergizacao'
import { ES_ISOLAMENTO } from './es/isolamento'
import { ES_ARCO } from './es/arco'
import { ES_INSPECAO } from './es/inspecao'

export const CATALOGO_ES: TraducaoCatalogo = {
  equipamentos: {
    'motor-inducao-bt': { nome: 'Motor de inducción trifásico' },
    'painel-mt-cabine': { nome: 'Tablero de media tensión' },
    'subestacao-completa': { nome: 'Subestación' },
    'subestacao-limpa': { nome: 'Subestación' },
    'aterramento-subestacao': { nome: 'Malla de puesta a tierra' },
    hospital: { nome: 'Instalación hospitalaria' },
    'spda-predio': { nome: 'Edificio con SPCR' },
    'galpao-estrutural': { nome: 'Nave industrial · SPCR estructural' },
    'usina-fv-100kw': { nome: `Planta FV en suelo · ${USINA.potenciaCaKw} kW` },
  },
  ensaios: {
    'resistencia-isolamento': { nome: 'Resistencia de aislamiento' },
    'arco-eletrico': { nome: 'Análisis de arco eléctrico' },
    'inspecao-subestacao': { nome: 'Inspección de subestación' },
    'desenergizacao-subestacao': { nome: 'Procedimiento de desenergización' },
    'verificacao-5410': {
      nome: 'Verificación de instalaciones (NBR 5410 — Sección 7)',
      norma: 'NBR 5410 · Sección 7',
    },
    'continuidade-spda': {
      nome: 'Continuidad del SPCR',
      norma: 'NBR 5419-3 — Inspección y mantenimiento del SPCR',
    },
    'spda-estrutural': {
      nome: 'SPCR natural / estructural',
      norma: 'ABNT NBR 5419-3:2026 · Anexo F',
    },
    'aterramento-usina-fv': { nome: 'Puesta a tierra en planta fotovoltaica' },

    // módulos completos (um arquivo por módulo em ./es/) sobrescrevem só o nome acima
    ...ES_USINA_FV,
    ...ES_SPDA,
    ...ES_ESTRUTURAL,
    ...ES_VERIFICACAO,
    ...ES_DESENERGIZACAO,
    ...ES_ISOLAMENTO,
    ...ES_ARCO,
    ...ES_INSPECAO,

    // ── piloto completo: resistencia de puesta a tierra ──
    'resistencia-aterramento': {
      nome: 'Resistencia de puesta a tierra',
      norma: 'NBR 15749 · IEEE 81 — Caída de potencial',
      steps: {
        'at-seguranca': {
          titulo: 'Seguridad y preparación',
          descricao: 'Analice los riesgos, verifique el área y prepare el ensayo de puesta a tierra.',
          detalhes: [
            'Análisis de riesgos (ATS) y EPP adecuados',
            'Verifique el área y el entorno del electrodo',
            'Telurómetro calibrado y cables/estacas en buen estado',
          ],
          cuidados: ['Atención a las tensiones de paso y de contacto durante la inyección de corriente.'],
          feito: 'Preparación concluida.',
          acao: 'Confirmar preparación',
        },
        'at-terrometro': {
          titulo: 'Posicionar el telurómetro',
          descricao:
            'Coloque el telurómetro de estacas en el punto de ensayo y conecte el cable E (verde) al electrodo/malla bajo ensayo.',
          detalhes: ['Telurómetro sobre suelo firme', 'Cable E (verde) en el electrodo bajo ensayo (E)'],
          feito: 'Telurómetro posicionado y cable E conectado.',
          acao: 'Posicionar telurómetro',
        },
        'at-estaca-c': {
          titulo: 'Hincar la estaca de corriente (C)',
          descricao:
            'Hinque la estaca de corriente en línea recta, alejada del electrodo (E), y conecte el cable C (rojo).',
          detalhes: [
            'Distancia D suficiente (≥ 5× la dimensión de la malla)',
            'Estaca firme y en suelo natural',
          ],
          feito: 'Estaca de corriente (C) hincada y cable C conectado.',
          acao: 'Hincar estaca C',
        },
        'at-medir': {
          titulo: 'Medir moviendo la estaca P',
          descricao:
            'La estaca de potencial (P) NO queda fija: muévala entre E y C y registre la lectura en cada posición. La curva forma una meseta en el centro — la lectura a ~62 % es la resistencia verdadera.',
          detalhes: [
            'Recorrer P de ~10 % a ~90 % de la distancia E–C, registrando cada posición (mín. 3 puntos)',
            'Confirmar la meseta: variar P ±5 % y comprobar que la lectura se mantiene (NBR 15749)',
            'La lectura en la zona de meseta (~62 %) es la resistencia verdadera',
          ],
          cuidados: ['Si no hay meseta, aumente la distancia D (acoplamiento entre electrodos).'],
          feito: 'Curva levantada — meseta identificada a ~62 %.',
          acao: 'Concluir medición',
        },
        'at-laudo': {
          titulo: 'Resultado y veredicto',
          // "concessionária" no original: aqui, a distribuidora de energia.
          descricao:
            'Lea la resistencia a 62 % (caída de potencial, NBR 15749). Recomendación de la distribuidora: puesta a tierra ≤ 10 Ω.',
          feito: 'Ensayo concluido.',
          acao: 'Emitir resultado',
        },
      },
    },
  },
}

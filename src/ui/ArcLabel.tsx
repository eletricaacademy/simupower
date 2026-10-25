import type { ArcResult } from '../engine/arcflash'
import { useTranslation } from 'react-i18next'
import { fmtData, fmtNum } from '../i18n/numero'

/**
 * ArcLabel — etiqueta de Arc Flash (NBR 17227 / NFPA 70E) preenchida com o
 * resultado do estudo. Tema escolhido pela categoria: PERIGO (vermelho) para
 * Cat 3+/>40, ATENÇÃO (laranja) para Cat 1–2, AVISO (verde) para risco mínimo.
 * Reproduz o layout das placas de referência.
 *
 * Também é desenhada dentro do 3D (`scene/ArcPlate.tsx`): as props ficam as
 * mesmas e o texto vem do namespace `arco` (o i18next global atende o Html do
 * drei, que roda fora da árvore React principal).
 */
export function ArcLabel({
  resultado,
  voc,
  distancia,
  nomeEquip,
}: {
  resultado: ArcResult
  voc: number
  distancia: number
  nomeEquip: string
}) {
  const { t } = useTranslation('arco')
  const nivel = resultado.categoria.nivel
  const tema = nivel >= 3 ? 'perigo' : nivel === 0 ? 'aviso' : 'atencao'
  const cor = tema === 'perigo' ? '#dc2626' : tema === 'atencao' ? '#f5a623' : '#34d399'
  const palavra = t(`etiqueta.${tema}`)

  const faixa = faixaRisco(nivel)
  const riscoLabel =
    nivel === 5
      ? t('etiqueta.riscoPerigo')
      : nivel === 0
        ? t('etiqueta.riscoMinimo')
        : t('etiqueta.riscoCategoria', { n: nivel })
  const choque = aproximacao(voc)
  const tensaoV = Math.round(voc * 1000)
  const epi = t(`etiqueta.epi.n${nivel}`, { returnObjects: true }) as unknown as string[]
  const data = fmtData(new Date())

  const C = '#000'
  const linha = (val: string, txt: string) => (
    <div style={{ display: 'flex', fontSize: 12.5, margin: '2.5px 0', color: C }}>
      <span style={{ fontWeight: 700, minWidth: 130 }}>{val}</span>
      <span style={{ flex: 1 }}>{txt}</span>
    </div>
  )

  return (
    <div
      style={{
        width: 660,
        border: '3px solid #000',
        background: '#fff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: C,
      }}
    >
      {/* cabeçalho */}
      <div style={{ background: cor, display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px' }}>
        <svg width="84" height="70" viewBox="0 0 100 86" style={{ flexShrink: 0 }}>
          <polygon points="50,3 97,84 3,84" fill="#000" />
          <rect x="44.5" y="27" width="11" height="31" rx="2" fill={cor} />
          <circle cx="50" cy="70" r="6.5" fill={cor} />
        </svg>
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 46,
            fontWeight: 900,
            color: '#000',
            letterSpacing: 1,
            lineHeight: 1,
            paddingRight: 84,
          }}
        >
          {palavra}
        </div>
      </div>

      <div style={{ borderTop: '3px solid #000', padding: '10px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.15 }}>
          {t('etiqueta.titulo1')}
          <br />
          {t('etiqueta.titulo2')}
        </div>
      </div>

      <div style={{ display: 'flex', borderTop: '3px solid #000' }}>
        {/* coluna esquerda */}
        <div style={{ width: '54%', borderRight: '3px solid #000', paddingBottom: 10 }}>
          <div
            style={{
              background: cor,
              margin: '8px 10px',
              padding: '3px 8px',
              textAlign: 'center',
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            {t('etiqueta.risco')}&nbsp;&nbsp;&nbsp;{riscoLabel}
          </div>
          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, margin: '6px 0 4px' }}>{t('etiqueta.protArco')}</div>
            {linha(`${Math.round(resultado.afb)} mm`, t('etiqueta.afb'))}
            {linha(`${fmtNum(resultado.energia, 1)} cal/cm²`, t('etiqueta.energiaEm', { d: Math.round(distancia) }))}
            {linha(faixa, t('etiqueta.faixa'))}
            <div style={{ fontSize: 15, fontWeight: 800, margin: '11px 0 4px' }}>{t('etiqueta.protChoque')}</div>
            {linha(`${tensaoV} V`, t('etiqueta.riscoChoque'))}
            {linha(`${choque.limitada} mm`, t('etiqueta.limitada'))}
            {linha(`${choque.restrita} mm`, t('etiqueta.restrita'))}
          </div>
        </div>
        {/* coluna direita — EPI */}
        <div style={{ flex: 1, padding: '8px 14px' }}>
          <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{t('etiqueta.epiNecessario')}</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.4 }}>
            {epi.map((e, i) => (
              <li key={i} style={{ marginBottom: 5 }}>
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          background: cor,
          borderTop: '3px solid #000',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 16px',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <span>{t('etiqueta.equipamento')}&nbsp;&nbsp;{nomeEquip}</span>
        <span>{t('etiqueta.data')}&nbsp;&nbsp;{data}</span>
      </div>
      <div style={{ background: cor, borderTop: '1px solid #000', padding: '3px 16px', fontSize: 10, textAlign: 'center' }}>
        {t('etiqueta.rodape')}
      </div>
    </div>
  )
}

/**
 * Faixa de energia de cada nível (cal/cm²) e casas decimais do original. O
 * texto sai no separador do idioma; a lista de EPI por nível fica em
 * `arco:etiqueta.epi.n<nivel>` (mesma ordem e mesmos itens nos três idiomas).
 */
const FAIXA: ([number, number] | [number, number, number, number])[] = [
  [1.2, 1],
  [1.2, 1, 4, 1],
  [4, 1, 8, 1],
  [8, 1, 25, 0],
  [25, 0, 40, 0],
  [40, 0],
]

function faixaRisco(nivel: number): string {
  const f = FAIXA[nivel]
  if (f.length === 2) return `${nivel === 0 ? '<' : '>'} ${fmtNum(f[0], f[1])} cal/cm²`
  return `${fmtNum(f[0], f[1])} – ${fmtNum(f[2], f[3])} cal/cm²`
}

/** Distâncias de aproximação (mm) aproximadas por faixa de tensão. */
function aproximacao(voc: number): { limitada: number; restrita: number } {
  if (voc < 1) return { limitada: 700, restrita: 200 }
  if (voc < 15) return { limitada: 1500, restrita: 700 }
  return { limitada: 2500, restrita: 1300 }
}

import type { ArcResult } from '../engine/arcflash'

/**
 * ArcLabel — etiqueta de Arc Flash (NBR 17227 / NFPA 70E) preenchida com o
 * resultado do estudo. Tema escolhido pela categoria: PERIGO (vermelho) para
 * Cat 3+/>40, ATENÇÃO (laranja) para Cat 1–2, AVISO (verde) para risco mínimo.
 * Reproduz o layout das placas de referência.
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
  const nivel = resultado.categoria.nivel
  const tema = nivel >= 3 ? 'perigo' : nivel === 0 ? 'aviso' : 'atencao'
  const cor = tema === 'perigo' ? '#dc2626' : tema === 'atencao' ? '#f5a623' : '#34d399'
  const palavra = tema === 'perigo' ? 'PERIGO' : tema === 'atencao' ? 'ATENÇÃO' : 'AVISO'

  const faixa = FAIXA[nivel]
  const riscoLabel = nivel === 5 ? 'PERIGO' : nivel === 0 ? 'Risco mínimo' : `Categoria ${nivel}`
  const choque = aproximacao(voc)
  const tensaoV = Math.round(voc * 1000)
  const epi = EPI[nivel]
  const data = dataHoje()

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
          Risco de Choque e Arc Flash
          <br />
          Necessário EPI Adequado
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
            Risco&nbsp;&nbsp;&nbsp;{riscoLabel}
          </div>
          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, margin: '6px 0 4px' }}>Proteção contra Arc Flash</div>
            {linha(`${Math.round(resultado.afb)} mm`, 'Região de Risco de Arco (AFB)')}
            {linha(`${resultado.energia.toFixed(1).replace('.', ',')} cal/cm²`, `Energia incidente em ${Math.round(distancia)} mm`)}
            {linha(faixa, 'Faixa de risco de arco')}
            <div style={{ fontSize: 15, fontWeight: 800, margin: '11px 0 4px' }}>Proteção contra Choque</div>
            {linha(`${tensaoV} V`, 'Risco de Choque')}
            {linha(`${choque.limitada} mm`, 'Região de Aproximação Limitada')}
            {linha(`${choque.restrita} mm`, 'Região de Aproximação Restrita')}
          </div>
        </div>
        {/* coluna direita — EPI */}
        <div style={{ flex: 1, padding: '8px 14px' }}>
          <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, marginBottom: 8 }}>EPI Necessário</div>
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
        <span>Equipamento:&nbsp;&nbsp;{nomeEquip}</span>
        <span>Data:&nbsp;&nbsp;{data}</span>
      </div>
      <div style={{ background: cor, borderTop: '1px solid #000', padding: '3px 16px', fontSize: 10, textAlign: 'center' }}>
        Atenção: mudanças no equipamento ou na configuração do sistema invalidam os cálculos e os EPIs necessários · IEEE 1584 / NBR 17227
      </div>
    </div>
  )
}

const FAIXA = [
  '< 1,2 cal/cm²',
  '1,2 – 4,0 cal/cm²',
  '4,0 – 8,0 cal/cm²',
  '8,0 – 25 cal/cm²',
  '25 – 40 cal/cm²',
  '> 40 cal/cm²',
]

const EPI: string[][] = [
  // 0 — risco mínimo
  ['Vestimenta de algodão não inflamável (mangas longas)', 'Óculos de segurança', 'Calçado de segurança'],
  // 1 — Cat 1 (4 cal)
  ['Vestimenta FR ≥ 4 cal/cm² (camisa + calça ou macacão)', 'Óculos de segurança', 'Protetor facial FR ou balaclava', 'Capacete classe E', 'Luvas de couro', 'Calçado de segurança'],
  // 2 — Cat 2 (8 cal)
  ['Vestimenta FR ≥ 8 cal/cm² (camisa + calça ou macacão)', 'Balaclava FR', 'Protetor facial com viseira classe E', 'Capacete classe II', 'Luvas isolantes c/ cobertura', 'Calçado dielétrico', 'Protetores auriculares'],
  // 3 — Cat 3 (25 cal)
  ['Conjunto FR ≥ 25 cal/cm² + capuz de arco', 'Capacete + protetor facial/capuz', 'Luvas isolantes c/ cobertura', 'Calçado dielétrico', 'Protetores auriculares'],
  // 4 — Cat 4 (40 cal)
  ['Conjunto FR ≥ 40 cal/cm² + capuz de arco', 'Capacete + capuz de arco completo', 'Luvas isolantes c/ cobertura', 'Calçado dielétrico', 'Protetores auriculares'],
  // 5 — perigo extremo
  ['NÃO TRABALHAR ENERGIZADO', 'Redesenhar proteção para reduzir IE < 40 cal/cm²', 'Aplicar técnicas de mitigação (relé de arco, ZSI)', 'Considerar manobra remota / desenergização'],
]

/** Distâncias de aproximação (mm) aproximadas por faixa de tensão. */
function aproximacao(voc: number): { limitada: number; restrita: number } {
  if (voc < 1) return { limitada: 700, restrita: 200 }
  if (voc < 15) return { limitada: 1500, restrita: 700 }
  return { limitada: 2500, restrita: 1300 }
}

function dataHoje(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

import { useState } from 'react'
import { Html } from '@react-three/drei'
import { color } from '../design/tokens'

/**
 * Elementos informativos da parede de trabalho (NBR 5410 §7): parede de
 * destaque (escurecida), painel INSIGHTS e tooltips clicáveis. NÃO altera a
 * posição do quadro/tomadas — fica na parede +x, atrás/ao lado dos equipamentos.
 */

const WALL_X = 6.22

/** Parede de destaque: escurece o trecho da parede atrás dos equipamentos. */
export function ParedeDestaque() {
  // caixa fina logo à frente da parede estrutural (atrás das tomadas/quadro)
  return (
    <mesh position={[WALL_X - 0.004, 1.55, 4.0]} receiveShadow>
      <boxGeometry args={[0.01, 3.2, 9.0]} />
      <meshStandardMaterial color="#bdb097" roughness={0.92} metalness={0} />
    </mesh>
  )
}

const TOPICOS: { icon: string; titulo: string; desc: string }[] = [
  { icon: '🛡️', titulo: 'Continuidade de serviço', desc: 'Sistemas essenciais com alimentação assegurada.' },
  { icon: '⚖️', titulo: 'Equipotencialização suplementar', desc: 'Redução de diferenças de potencial (BEP).' },
  { icon: '⚡', titulo: 'Proteção contra choques', desc: 'Proteção adicional por DR ≤ 30 mA.' },
  { icon: '🏷️', titulo: 'Identificação dos circuitos', desc: 'Circuitos identificados no quadro e nas tomadas.' },
  { icon: '🔌', titulo: 'Tomadas de uso específico', desc: 'Circuitos dedicados a equipamentos críticos.' },
  { icon: '🔧', titulo: 'Inspeção e manutenção', desc: 'Verificações periódicas e registros documentados.' },
]

const CIRCUITOS = ['QD-AC', 'QD-ILUM', 'QD-TUG', 'QD-UE', 'QD-ESS']

/** Painel INSIGHTS — detalhamento do procedimento, na parede ao lado das tomadas. */
export function InsightsBoard() {
  return (
    <Html transform position={[WALL_X - 0.012, 1.85, 6.7]} rotation={[0, -Math.PI / 2, 0]} scale={0.085}>
      <div
        style={{
          width: 900,
          fontFamily: 'Inter, system-ui, sans-serif',
          background: 'rgba(247,249,251,0.97)',
          border: '1px solid #c8d2dc',
          borderRadius: 16,
          padding: 28,
          color: '#1d2733',
          boxShadow: '0 20px 60px -20px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, borderBottom: '2px solid #2f6fd0', paddingBottom: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0.5, color: '#173a63' }}>INSIGHTS</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#2f6fd0' }}>NBR 5410 · SEÇÃO 7</span>
          <span style={{ marginLeft: 'auto', fontSize: 15, color: '#5b6b7c' }}>Instalação Hospitalar</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
          {/* tópicos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TOPICOS.map((t) => (
              <div key={t.titulo} style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 22, width: 30 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{t.titulo}</div>
                  <div style={{ fontSize: 13.5, color: '#5b6b7c', lineHeight: 1.3 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* diagrama unifilar simplificado */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5b6b7c', letterSpacing: 1, marginBottom: 10 }}>DIAGRAMA UNIFILAR SIMPLIFICADO</div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#5b6b7c', marginBottom: 6 }}>Alimentação — Rede pública / Grupo gerador</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginBottom: 8 }}>
              <Bola label="QG" />
              <Bola label="G" />
            </div>
            <div style={{ border: '2px solid #2f6fd0', borderRadius: 8, padding: '8px 14px', textAlign: 'center', fontWeight: 700, fontSize: 15, marginBottom: 14, background: '#eaf1fb' }}>
              QG · QUADRO GERAL
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              {CIRCUITOS.map((c) => (
                <div key={c} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ border: '1.5px solid #98a6b6', borderRadius: 6, height: 38, display: 'grid', placeItems: 'center', fontSize: 18 }}>⊡</div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{c}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, borderTop: '2px solid #2f9d3a', paddingTop: 6, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#2f7d2f' }}>
              ⏚ BARRA DE EQUIPOTENCIALIZAÇÃO (BEP)
            </div>
          </div>
        </div>

        {/* legenda */}
        <div style={{ display: 'flex', gap: 26, marginTop: 18, paddingTop: 12, borderTop: '1px solid #d4dce4', fontSize: 12.5, color: '#5b6b7c' }}>
          <span><b style={{ color: '#1d2733' }}>DR ≤ 30 mA</b> · proteção adicional</span>
          <span><b style={{ color: '#1d2733' }}>PE</b> · condutor de proteção</span>
          <span><b style={{ color: '#2f7d2f' }}>BEP</b> · equipotencialização</span>
          <span><b style={{ color: '#1d2733' }}>Identificação</b> · clara e permanente</span>
        </div>
      </div>
    </Html>
  )
}

function Bola({ label }: { label: string }) {
  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #5b6b7c', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700 }}>{label}</div>
  )
}

const HOTSPOTS: { pos: [number, number, number]; titulo: string; texto: string }[] = [
  {
    pos: [6.0, 2.2, 4.55],
    titulo: 'Quadro de distribuição',
    texto: 'Proteção por DR ≤ 30 mA, disjuntores identificados e barramento de equipotencialização (BEP). Base a 1,60 m do piso.',
  },
  {
    pos: [6.0, 1.45, 3.0],
    titulo: 'Tomadas (TUG / uso específico)',
    texto: 'Padrão NBR 14136 (2P+T). Ensaios ponto a ponto: continuidade do PE, isolamento, polaridade, loop e DR.',
  },
  {
    pos: [6.0, 0.95, 2.4],
    titulo: 'Equipotencialização (BEP)',
    texto: 'Liga as massas e elementos condutores ao mesmo potencial — essencial em áreas médicas para reduzir tensões de toque.',
  },
]

/** Tooltips clicáveis (ícones ⓘ) com informações da §7. */
export function InfoHotspots() {
  const [aberto, setAberto] = useState<number | null>(null)
  return (
    <>
      {HOTSPOTS.map((h, i) => (
        <Html key={i} position={h.pos} center distanceFactor={6} zIndexRange={[40, 0]}>
          <div style={{ pointerEvents: 'auto' }}>
            <button
              onClick={() => setAberto(aberto === i ? null : i)}
              title={h.titulo}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: `2px solid ${color.accent}`,
                background: aberto === i ? color.accent : 'rgba(11,15,20,0.85)',
                color: aberto === i ? '#0B0F14' : color.accent,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: `0 0 12px ${color.accent}77`,
              }}
            >
              i
            </button>
            {aberto === i && (
              <div
                style={{
                  position: 'absolute',
                  left: 34,
                  top: -10,
                  width: 230,
                  background: 'rgba(12,17,23,0.96)',
                  border: `1px solid ${color.accent}55`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: '#e9edf2',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  boxShadow: '0 12px 30px -10px #000',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: color.accent, marginBottom: 4 }}>{h.titulo}</div>
                <div style={{ fontSize: 12, lineHeight: 1.4, color: '#aeb9c5' }}>{h.texto}</div>
              </div>
            )}
          </div>
        </Html>
      ))}
    </>
  )
}

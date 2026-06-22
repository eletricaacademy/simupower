import { color } from '../design/tokens'

/** Altura do tampo da bancada (onde o equipamento e o instrumento se assentam). */
export const BENCH_TOP_Y = 0.95

const TOP_W = 3.4
const TOP_D = 1.9
const TOP_T = 0.1
const LEG = 0.13
const METAL = '#23282f'
const METAL_CLARO = '#3a424c'
const LARANJA = '#C2611A'
const LARANJA_ESC = '#9a4d14'

/**
 * Workbench — bancada de laboratório em laranja industrial com estrutura de aço.
 * Só caixas/cilindros com materiais sólidos (sem texturas/GLB) — custo de GPU
 * desprezível. Detalhes finos (`detail`) somem no nível baixo.
 */
export function Workbench({ detail = true }: { detail?: boolean }) {
  const topY = BENCH_TOP_Y - TOP_T / 2
  const legH = BENCH_TOP_Y - TOP_T
  const dx = TOP_W / 2 - LEG
  const dz = TOP_D / 2 - LEG

  const cantos = [
    [dx, dz],
    [-dx, dz],
    [dx, -dz],
    [-dx, -dz],
  ] as const

  return (
    <group>
      {/* tampo laranja + borda escura (laminado) */}
      <mesh position={[0, topY, 0]} castShadow receiveShadow>
        <boxGeometry args={[TOP_W, TOP_T, TOP_D]} />
        <meshStandardMaterial color={LARANJA} metalness={0.15} roughness={0.55} />
      </mesh>
      <mesh position={[0, topY - TOP_T / 2 - 0.012, 0]}>
        <boxGeometry args={[TOP_W + 0.02, 0.03, TOP_D + 0.02]} />
        <meshStandardMaterial color={LARANJA_ESC} metalness={0.2} roughness={0.6} />
      </mesh>
      {/* friso âmbar na borda frontal (assinatura, com parcimônia) */}
      <mesh position={[0, topY, TOP_D / 2 + 0.012]}>
        <boxGeometry args={[TOP_W, TOP_T * 0.5, 0.02]} />
        <meshStandardMaterial color={color.accent} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* avental/saia de aço sob o tampo */}
      <mesh position={[0, BENCH_TOP_Y - TOP_T - 0.09, dz]} castShadow>
        <boxGeometry args={[TOP_W - LEG, 0.16, 0.05]} />
        <meshStandardMaterial color={METAL_CLARO} metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[0, BENCH_TOP_Y - TOP_T - 0.09, -dz]} castShadow>
        <boxGeometry args={[TOP_W - LEG, 0.16, 0.05]} />
        <meshStandardMaterial color={METAL_CLARO} metalness={0.6} roughness={0.45} />
      </mesh>

      {/* pés de aço */}
      {cantos.map(([x, z], i) => (
        <mesh key={i} position={[x, legH / 2, z]} castShadow>
          <boxGeometry args={[LEG, legH, LEG]} />
          <meshStandardMaterial color={METAL} metalness={0.65} roughness={0.5} />
        </mesh>
      ))}

      {/* prateleira inferior */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[TOP_W - LEG, 0.05, TOP_D - LEG]} />
        <meshStandardMaterial color="#4a3320" metalness={0.15} roughness={0.7} />
      </mesh>
      {/* travessas da prateleira */}
      <mesh position={[0, 0.16, dz]} castShadow>
        <boxGeometry args={[TOP_W - LEG, 0.05, 0.05]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.16, -dz]} castShadow>
        <boxGeometry args={[TOP_W - LEG, 0.05, 0.05]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />
      </mesh>

      {/* pés niveladores + itens na prateleira (detalhe) */}
      {detail && (
        <>
          {cantos.map(([x, z], i) => (
            <mesh key={i} position={[x, 0.02, z]}>
              <cylinderGeometry args={[0.05, 0.06, 0.04, 12]} />
              <meshStandardMaterial color="#15181d" metalness={0.5} roughness={0.6} />
            </mesh>
          ))}
          {/* caixa de ferramentas */}
          <mesh position={[-1.3, 0.37, 0.1]} castShadow>
            <boxGeometry args={[0.7, 0.26, 0.4]} />
            <meshStandardMaterial color={color.accent} metalness={0.3} roughness={0.5} />
          </mesh>
          {/* rolo de cabo */}
          <mesh position={[1.2, 0.32, -0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.22, 0.08, 10, 20]} />
            <meshStandardMaterial color="#1f242b" roughness={0.7} />
          </mesh>
        </>
      )}
    </group>
  )
}

import { color } from '../design/tokens'

/**
 * LabRoom — cenário de laboratório de ensaios ao fundo: painel elétrico,
 * estante, estação de ensaio secundária, luminárias e faixa de "área de teste"
 * no piso. Tudo em caixas/planos com materiais sólidos (sem texturas/GLB), e os
 * detalhes pequenos (`detail=false`) somem no nível baixo para aliviar a GPU.
 */
export function LabRoom({ detail = true }: { detail?: boolean }) {
  return (
    <group>
      <PainelEletrico position={[-2.8, 0, -4.3]} detail={detail} />
      <Estante position={[3.0, 0, -4.3]} detail={detail} />
      <EstacaoSecundaria position={[-3.9, 0, -1.4]} rot={0.6} detail={detail} />
      {detail && <FaixaAreaTeste />}
    </group>
  )
}

const CINZA = '#454d59'
const CINZA_ESC = '#363d47'
const METAL = '#262b33'

/* ---- Painel elétrico (quadro de distribuição) ---- */
function PainelEletrico({
  position,
  detail,
}: {
  position: [number, number, number]
  detail: boolean
}) {
  return (
    <group position={position}>
      {/* corpo */}
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 2.6, 0.45]} />
        <meshStandardMaterial color={CINZA} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* porta recuada */}
      <mesh position={[0, 1.35, 0.235]}>
        <boxGeometry args={[1.25, 2.2, 0.03]} />
        <meshStandardMaterial color={CINZA_ESC} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* dobradiça/puxador */}
      <mesh position={[0.5, 1.35, 0.26]}>
        <boxGeometry args={[0.04, 0.4, 0.04]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
      </mesh>
      {detail && (
        <>
          {/* LEDs de status */}
          <Led position={[-0.45, 2.25, 0.27]} cor={color.status.pass} />
          <Led position={[-0.3, 2.25, 0.27]} cor={color.accent} />
          {/* eletrodutos saindo por cima */}
          <mesh position={[-0.4, 2.75, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 10]} />
            <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0.4, 2.75, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 10]} />
            <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />
          </mesh>
        </>
      )}
    </group>
  )
}

function Led({ position, cor }: { position: [number, number, number]; cor: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.03, 10, 10]} />
      <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={1.4} />
    </mesh>
  )
}

/* ---- Estante metálica com itens ---- */
function Estante({
  position,
  detail,
}: {
  position: [number, number, number]
  detail: boolean
}) {
  const prateleiras = [0.4, 1.2, 2.0]
  return (
    <group position={position}>
      {/* montantes */}
      {(
        [
          [-0.7, 0.55],
          [0.7, 0.55],
          [-0.7, -0.55],
          [0.7, -0.55],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 1.2, z]} castShadow>
          <boxGeometry args={[0.06, 2.4, 0.06]} />
          <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* prateleiras */}
      {prateleiras.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 1.2]} />
          <meshStandardMaterial color="#5b6470" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* itens (somem no nível baixo) */}
      {detail && (
        <>
          <mesh position={[-0.4, 1.36, 0]} castShadow>
            <boxGeometry args={[0.4, 0.28, 0.5]} />
            <meshStandardMaterial color="#7a4a22" roughness={0.7} />
          </mesh>
          <mesh position={[0.3, 1.38, 0.1]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.3, 14]} />
            <meshStandardMaterial color="#3f6b8a" roughness={0.6} />
          </mesh>
          <mesh position={[0.1, 0.56, -0.1]} castShadow>
            <boxGeometry args={[0.6, 0.3, 0.4]} />
            <meshStandardMaterial color={color.accent} metalness={0.2} roughness={0.6} />
          </mesh>
          <mesh position={[-0.3, 2.18, 0]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.5]} />
            <meshStandardMaterial color="#566" roughness={0.7} />
          </mesh>
        </>
      )}
    </group>
  )
}

/* ---- Estação de ensaio secundária (sugere um trafo, ensaio futuro) ---- */
function EstacaoSecundaria({
  position,
  rot,
  detail,
}: {
  position: [number, number, number]
  rot: number
  detail: boolean
}) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      {/* mesa simples */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.1, 1.2]} />
        <meshStandardMaterial color="#9a5018" roughness={0.6} />
      </mesh>
      {(
        [
          [0.9, 0.5],
          [-0.9, 0.5],
          [0.9, -0.5],
          [-0.9, -0.5],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.4, z]} castShadow>
          <boxGeometry args={[0.08, 0.8, 0.08]} />
          <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* trafo estilizado */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.7]} />
        <meshStandardMaterial color="#4b545f" metalness={0.5} roughness={0.5} />
      </mesh>
      {detail &&
        [-0.2, 0.2].map((x, i) => (
          <mesh key={i} position={[x, 1.45, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 0.25, 12]} />
            <meshStandardMaterial color="#caa64a" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
    </group>
  )
}

/* ---- Luminárias de teto (emissivas, alimentam o bloom sutil) ---- */

/* ---- Faixa "ÁREA DE TESTE" no piso (âmbar) ---- */
function FaixaAreaTeste() {
  const w = 5.4
  const d = 3.4
  const t = 0.06
  const y = 0.012
  return (
    <group>
      <mesh position={[0, y, d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, t]} />
        <meshStandardMaterial color={color.accent} roughness={0.7} />
      </mesh>
      <mesh position={[0, y, -d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, t]} />
        <meshStandardMaterial color={color.accent} roughness={0.7} />
      </mesh>
      <mesh position={[w / 2, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[t, d]} />
        <meshStandardMaterial color={color.accent} roughness={0.7} />
      </mesh>
      <mesh position={[-w / 2, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[t, d]} />
        <meshStandardMaterial color={color.accent} roughness={0.7} />
      </mesh>
    </group>
  )
}

import { color } from '../design/tokens'
import { Room, TEMA_SUB } from './Room'

/**
 * Substation — sala de subestação MT: usa a sala padrão (Room, tema branco) e
 * acrescenta os elementos de subestação (diagrama unifilar, cubículo/trafo,
 * extintor, eletrocalhas, placa e faixa de risco de arco no piso).
 */
const METAL = '#2a2f37'

export const ROOM = { size: 20, height: 5.6 }
const half = ROOM.size / 2
const H = ROOM.height

export function Substation({ detail = true }: { detail?: boolean }) {
  return (
    <group>
      <Room theme={TEMA_SUB} size={ROOM.size} height={H} detail={detail} />

      {/* faixa âmbar de risco de arco à frente do painel */}
      {detail && <FaixaRisco />}

      {/* diagrama unifilar na parede esquerda */}
      {detail && <Unifilar />}

      {/* cubículo/trafo secundário ao fundo */}
      <group position={[-5.5, 0, -half + 1.4]}>
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 2.2, 1.2]} />
          <meshStandardMaterial color="#6a7078" metalness={0.4} roughness={0.6} />
        </mesh>
        {detail &&
          [-0.4, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 2.45, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 0.4, 12]} />
              <meshStandardMaterial color="#caa64a" metalness={0.3} roughness={0.5} />
            </mesh>
          ))}
      </group>

      {/* extintor perto da porta */}
      {detail && (
        <group position={[half - 1.4, 0, -half + 0.6]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.7, 16]} />
            <meshStandardMaterial color="#c0282d" roughness={0.5} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.2, 10]} />
            <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* eletrocalhas no teto */}
      {detail && (
        <>
          <mesh position={[0, H - 0.5, -half + 1.2]} castShadow>
            <boxGeometry args={[ROOM.size - 3, 0.18, 0.35]} />
            <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[-half + 1.2, H - 0.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[ROOM.size - 3, 0.18, 0.35]} />
            <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.5} />
          </mesh>
        </>
      )}

      {/* placa de aviso na parede direita */}
      {detail && (
        <group position={[half - 0.08, 2.4, 2]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 0.04]} />
            <meshStandardMaterial color="#f5a623" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <cylinderGeometry args={[0.32, 0.32, 0.01, 3]} />
            <meshStandardMaterial color="#1a1d22" />
          </mesh>
        </group>
      )}
    </group>
  )
}

function FaixaRisco() {
  const w = 5
  const d = 3
  const t = 0.08
  const y = 0.02
  const seg = (x: number, z: number, lx: number, lz: number) => (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[lx, lz]} />
      <meshStandardMaterial color={color.accent} roughness={0.8} />
    </mesh>
  )
  return (
    <group position={[0, 0, 2.2]}>
      {seg(0, d / 2, w, t)}
      {seg(0, -d / 2, w, t)}
      {seg(w / 2, 0, t, d)}
      {seg(-w / 2, 0, t, d)}
    </group>
  )
}

function Unifilar() {
  return (
    <group position={[-half + 0.1, 2.4, -2]} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[2.6, 1.8, 0.05]} />
        <meshStandardMaterial color="#fbfdff" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.55, 0.03]}>
        <boxGeometry args={[2.0, 0.04, 0.01]} />
        <meshStandardMaterial color="#1f2a44" />
      </mesh>
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.05, 0.03]}>
          <boxGeometry args={[0.03, 0.9, 0.01]} />
          <meshStandardMaterial color="#1f2a44" />
        </mesh>
      ))}
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={`b${i}`} position={[x, -0.45, 0.03]}>
          <boxGeometry args={[0.18, 0.12, 0.01]} />
          <meshStandardMaterial color={color.accentCool} />
        </mesh>
      ))}
    </group>
  )
}

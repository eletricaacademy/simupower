/**
 * Room — sala fechada padrão (alvenaria) reutilizada por todas as simulações.
 * Casca (paredes + teto por dentro), piso, rodapés, luminárias e porta, com
 * MATERIAIS por tema. Só geometria/material simples — sem texturas/GLB.
 */
export interface RoomTheme {
  parede: string
  piso: string
  rodape: string
  porta: string
  /** cor de fundo do canvas (bordas) */
  bg: string
  luzEmissiva: string
}

/** Subestação MT — alvenaria branca. */
export const TEMA_SUB: RoomTheme = {
  parede: '#e9e9ec',
  piso: '#cfd0d3',
  rodape: '#b6b8bc',
  porta: '#5b6068',
  bg: '#d9dbde',
  luzEmissiva: '#eaf2ff',
}

/** Laboratório de Baixa Tensão — paredes claras azuladas, piso epóxi cinza. */
export const TEMA_BT: RoomTheme = {
  parede: '#d7dde4',
  piso: '#8b939c',
  rodape: '#5e656d',
  porta: '#46505b',
  bg: '#c7ccd2',
  luzEmissiva: '#eef4ff',
}

const METAL = '#2a2f37'

export function Room({
  theme,
  size,
  height,
  detail = true,
}: {
  theme: RoomTheme
  size: number
  height: number
  detail?: boolean
}) {
  const half = size / 2
  return (
    <group>
      {/* casca (paredes + teto pelo lado de dentro) */}
      <mesh position={[0, height / 2, 0]} receiveShadow>
        <boxGeometry args={[size, height, size]} />
        <meshStandardMaterial color={theme.parede} roughness={1} metalness={0} side={2} />
      </mesh>

      {/* piso */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={theme.piso} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* rodapés */}
      {(
        [
          [0, -half + 0.05, 0],
          [0, half - 0.05, Math.PI],
          [-half + 0.05, 0, Math.PI / 2],
          [half - 0.05, 0, -Math.PI / 2],
        ] as const
      ).map(([x, z, ry], i) => (
        <mesh key={i} position={[x, 0.08, z]} rotation={[0, ry, 0]}>
          <boxGeometry args={[size, 0.16, 0.04]} />
          <meshStandardMaterial color={theme.rodape} roughness={0.9} />
        </mesh>
      ))}

      {/* luminárias de teto */}
      {(detail ? [-half / 2.5, 0, half / 2.5] : [0]).map((x, i) => (
        <mesh key={i} position={[x, height - 0.12, 0]}>
          <boxGeometry args={[size / 7, 0.08, 0.7]} />
          <meshStandardMaterial color="#f4f7fb" emissive={theme.luzEmissiva} emissiveIntensity={0.9} />
        </mesh>
      ))}

      {/* porta na parede do fundo */}
      <group position={[half - 2.5, 1.1, -half + 0.07]}>
        <mesh>
          <boxGeometry args={[1.8, 2.2, 0.08]} />
          <meshStandardMaterial color={theme.porta} roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.04, 2.1, 0.05]} />
          <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

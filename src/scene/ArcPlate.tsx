import { Html } from '@react-three/drei'
import { useSim } from '../sim/store'
import { useArc } from '../sim/arcStore'
import { ArcLabel } from '../ui/ArcLabel'

/**
 * ArcPlate — a etiqueta de arco "instalada no quadro" (no painel 3D), exibida
 * após o passo final (af-epi). Html plano sobre a face frontal do painel.
 * Posição/escala ajustáveis conforme o enquadramento do modelo.
 */
export function ArcPlate() {
  const resultado = useArc((s) => s.resultado)
  const voc = useArc((s) => s.voc)
  const distancia = useArc((s) => s.distancia)
  const nome = useSim((s) => s.equipamento.nome)
  const instalada = useSim((s) => !!s.cumpridos['af-epi'])

  if (!resultado || !instalada) return null

  // Etiqueta ~A5 (metade de uma folha A4). ArcLabel = 660px → scale p/ ~0.6 m.
  // Posição/escala ajustáveis conforme o enquadramento do painel.
  return (
    <Html position={[-0.85, 1.95, 1.15]} transform scale={0.00091} style={{ pointerEvents: 'none' }}>
      <ArcLabel resultado={resultado} voc={voc} distancia={distancia} nomeEquip={nome} />
    </Html>
  )
}

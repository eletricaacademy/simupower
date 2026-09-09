import { useSim } from '../sim/store'
import { useSpda } from '../sim/spdaStore'
import { SPDA_PONTOS } from '../catalog/spdaPontos'
import { color } from '../design/tokens'

/** Controles de autoria da cena; utiliza a captura e o pick já existentes. */
export function SpdaCalibracao() {
  const pick = useSim(s => s.pickMode)
  const setPick = useSim(s => s.setPickMode)
  const peca = useSim(s => s.peca)
  const pose = useSim(s => s.cenaPose)
  const capturar = useSim(s => s.pedirCaptura)
  const selecionar = useSpda(s => s.setPontoAtivo)
  const estilo = { background: color.surface, color: color.text, border: `1px solid ${color.hairline}` }
  return <details className="mt-3 text-[12px]">
    <summary>Calibração do ambiente 3D</summary>
    <button className="w-full rounded p-2 mt-2" style={estilo} onClick={() => setPick(!pick)}>
      {pick ? 'Desligar identificação' : 'Identificar ponto'}
    </button>
    {peca && <output className="block font-mono break-all mt-2" style={{ color: color.accentCool }}>{peca}</output>}
    <div className="grid grid-cols-2 gap-1 my-2">
      {SPDA_PONTOS.map(p => <button key={p.id} className="rounded p-1" style={estilo} onClick={() => selecionar(p.id)}>{p.id}</button>)}
    </div>
    <button className="w-full rounded p-2" style={estilo} onClick={capturar}>Capturar posição da câmera</button>
    {pose && <output className="block font-mono break-all mt-2" style={{ color: color.accentCool }}>{pose}</output>}
  </details>
}

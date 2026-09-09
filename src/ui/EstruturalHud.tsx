import { useEffect, useState } from 'react'
import { useEstrutural } from '../sim/estruturalStore'
import { useSim } from '../sim/store'
import { useView } from '../sim/viewStore'
import { PARES_ESTRUTURAIS } from '../catalog/estruturalPontos'
import { color } from '../design/tokens'
import { HudTopBar } from './HudTopBar'
import { MobileSheet } from './MobileSheet'
import { QualityPicker } from './QualityPicker'

export function EstruturalHud() {
  const [config, setConfig] = useState(false)
  useEffect(() => { useEstrutural.getState().reset(); useSim.getState().setTour(false) }, [])
  return <div className="absolute inset-0 pointer-events-none">
    <HudTopBar onConfig={() => setConfig(!config)} configAberto={config} />
    {config && <div className="absolute right-4 top-16 z-50 pointer-events-auto hud-glass rounded-xl p-4"><QualityPicker /></div>}
    <div className="hidden md:block absolute right-4 top-20 bottom-4 pointer-events-auto"><PainelEstrutural /></div>
    <MobileSheet onReiniciar={() => useEstrutural.getState().reset()}><PainelEstrutural /></MobileSheet>
  </div>
}
function PainelEstrutural() {
  const s = useEstrutural()
  const botao = { background: color.surface, color: color.text, border: `1px solid ${color.hairline}`, borderRadius: 7, padding:'9px 12px' }
  return <div className="hud-glass rounded-xl p-4 w-[330px] max-w-full max-h-full overflow-y-auto hud-scroll text-[12px] space-y-3" style={{ color: color.text }}>
    <div><p className="text-[10px] tracking-widest uppercase" style={{ color:color.accent }}>SPDA natural / estrutural</p><h2 className="font-display text-xl font-semibold">Galpão industrial</h2><p style={{ color:color.textMuted }}>ABNT NBR 5419-3:2026</p></div>
    <p>Explore as ferragens dos pilares e vigas. Compare o contato direto na obra com o acesso pelos Aterrinsert após a concretagem.</p>
    <div className="flex gap-2">
      <button style={{ ...botao, color:s.fase === 'obra' ? color.accent : color.text }} aria-pressed={s.fase === 'obra'} onClick={() => s.setFase('obra')}>Ferragens expostas</button>
      <button style={{ ...botao, color:s.fase === 'pronto' ? color.accent : color.text }} aria-pressed={s.fase === 'pronto'} onClick={() => s.setFase('pronto')}>Galpão pronto</button>
    </div>
    {s.fase === 'pronto' && <label className="flex gap-2 items-center"><input type="checkbox" checked={s.revelar} onChange={e => s.setRevelar(e.target.checked)} />Revelar ferragens internas</label>}
    <label className="block">Pontos de conexão
      <select className="block w-full mt-1" style={botao} value={s.par} onChange={e => s.setPar(e.target.value)}>
        {PARES_ESTRUTURAIS.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
    </label>
    <div className="flex gap-2"><button style={botao} onClick={() => useView.getState().pedir('origem')}>Ver P1/C1</button><button style={botao} onClick={() => useView.getState().pedir('quadro')}>Ver P2/C2</button></div>
    <button className="w-full" style={{ ...botao, color:color.accent }} onClick={s.conectar}>{s.garras ? 'Garras conectadas' : 'Conectar as duas garras'}</button>
    <div className="flex gap-2"><button style={botao} onClick={() => useView.getState().pedir('foco')}>Ver Inbrat</button><button style={botao} onClick={() => useView.getState().pedir('reset')}>Ver galpão</button></div>
    <p style={{ color:color.textMuted }}>Dois cabos PP: P1/C1 e P2/C2. No galpão pronto, cada garra toca o pino de acesso do conector estrutural.</p>
    <div className="rounded-lg p-3" style={{ background:color.surface, border:`1px solid ${color.hairline}` }}>
      <p className="font-semibold" style={{ color:color.accent }}>Ambiente em desenvolvimento</p>
      <p className="mt-1">Conexões disponíveis para exploração. Medições e avaliação de conformidade serão liberadas após conferir os critérios de continuidade na edição 2026.</p>
    </div>
  </div>
}

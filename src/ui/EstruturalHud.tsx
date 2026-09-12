import { ConexoesInbrat } from './ConexoesInbrat'
import { BotaoTestesEmLote } from './BotaoTestesEmLote'
import { executarEstruturalEmLote } from '../sim/testesEmLote'
import { PainelRecolhivel } from './PainelRecolhivel'
import { useEffect, useState } from 'react'
import { useEstrutural } from '../sim/estruturalStore'
import { useSim } from '../sim/store'
import { useView } from '../sim/viewStore'
import { PARES_ESTRUTURAIS } from '../catalog/estruturalPontos'
import { color } from '../design/tokens'
import { HudTopBar } from './HudTopBar'
import { MobileSheet } from './MobileSheet'
import { QualityPicker } from './QualityPicker'
import { criterioEstrutural } from '../engine/estrutural'

export function EstruturalHud() {
  const [config, setConfig] = useState(false)
  useEffect(() => { useEstrutural.getState().reset(); useSim.getState().setTour(false) }, [])
  return <div className="absolute inset-0 pointer-events-none">
    <HudTopBar onConfig={() => setConfig(!config)} configAberto={config} />
    {config && <div className="absolute right-4 top-16 z-50 pointer-events-auto hud-glass rounded-xl p-4"><QualityPicker /></div>}
    <PainelRecolhivel titulo="painel de ensaio" className="hidden md:block absolute right-4 top-20 bottom-4 pointer-events-auto"><PainelEstrutural /></PainelRecolhivel>
    <MobileSheet onReiniciar={() => useEstrutural.getState().reset()}><PainelEstrutural /></MobileSheet>
  </div>
}
function PainelEstrutural() {
  const s = useEstrutural()
  const par = PARES_ESTRUTURAIS.find(p => p.id === s.par)!
  const leitura = s.leituras[s.par], criterio = criterioEstrutural(par.tipo)
  const completos = PARES_ESTRUTURAIS.every(p => s.leituras[p.id])
  const quantidade = Object.keys(s.leituras).length
  const exportar = () => {
    const linhas = [['Ensaio didático de continuidade estrutural — não é laudo de instalação real'], ['ABNT NBR 5419-3:2026', 'Corrente simulada: 1 A CC', s.fase, s.defeito],
      ['Trecho','Resistência (ohm)','Limite (ohm)','Resultado do trecho','Referência','Data'],
      ...PARES_ESTRUTURAIS.map(p => { const l = s.leituras[p.id]; return [p.nome,l?.r.toFixed(6) ?? '',l?.limite ?? '',l ? (l.aprovado ? 'Dentro do limite' : 'Fora do limite') : 'Pendente',l?.norma ?? '',l?.data ?? ''] })]
    const blob = new Blob(['\uFEFF' + linhas.map(l => l.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(';')).join('\r\n')], {type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob), a = document.createElement('a')
    a.href=url; a.download='ensaio-estrutural-5419-2026.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000)
  }
  const botao = { background: color.surface, color: color.text, border: `1px solid ${color.hairline}`, borderRadius: 7, padding:'9px 12px' }
  return <div className="hud-glass rounded-xl p-4 w-[330px] max-w-full max-h-full overflow-y-auto hud-scroll text-[12px] space-y-3" style={{ color: color.text }}>
    <div><p className="text-[10px] tracking-widest uppercase" style={{ color:color.accent }}>SPDA natural / estrutural</p><h2 className="font-display text-xl font-semibold">Galpão industrial</h2><p style={{ color:color.textMuted }}>ABNT NBR 5419-3:2026</p></div>
    <p>Concreto moldado no local, com pilares e fundação interligados. Primeiro: topo de cada pilar até a base de outro. Depois: captação até o BEP.</p>
    <div className="flex gap-2">
      <button style={{ ...botao, color:s.fase === 'obra' ? color.accent : color.text }} aria-pressed={s.fase === 'obra'} onClick={() => s.setFase('obra')}>Ferragens expostas</button>
      <button style={{ ...botao, color:s.fase === 'pronto' ? color.accent : color.text }} aria-pressed={s.fase === 'pronto'} onClick={() => s.setFase('pronto')}>Galpão pronto</button>
    </div>
    {s.fase === 'pronto' && <label className="flex gap-2 items-center"><input type="checkbox" checked={s.revelar} onChange={e => s.setRevelar(e.target.checked)} />Revelar ferragens internas</label>}
    {s.fase === 'obra' && <p style={{ color:color.textMuted }}>Na obra, o ensaio é demonstrativo. O acompanhamento documentado das condições de construção pode dispensar a primeira verificação — F.1.2.2.</p>}
    <details><summary>Preparação e escopo · F.1</summary><p>Verificar APR, clima, acesso seguro, projeto estrutural e documentação. Suspender em condição de tempestade. Inspecionar conexões e assegurar contato metálico das garras.</p><p>Este cenário usa oito topos e quatro bases espaçadas a cada 20 m no perímetro de 80 m, incluindo a base ligada ao BEP. Não representa pré-moldado (F.2) nem fundação isolada (F.3).</p></details>
    <button style={botao} className="w-full" disabled={s.preparado} onClick={s.preparar}>{s.preparado ? 'Preparação confirmada · 1 A CC' : 'Confirmar preparação · Kelvin 1 A CC'}</button>
    <ConexoesInbrat />
    <p style={{color:color.textMuted}}>Quatro terminais, dois cabos PP: P1/C1 e P2/C2. Corrente simulada de 1 A CC conforme F.1.3; sem emular as faixas do firmware Inbrat.</p>
    <label className="block">Pontos de conexão
      <select className="block w-full mt-1" style={botao} value={s.par} onChange={e => s.setPar(e.target.value)}>
        {PARES_ESTRUTURAIS.map(p => <option key={p.id} value={p.id}>{s.leituras[p.id] ? '✓ ' : ''}{p.nome}</option>)}
      </select>
    </label>
    <div className="flex gap-2"><button style={botao} onClick={() => useView.getState().pedir('origem')}>Ver P1/C1</button><button style={botao} onClick={() => useView.getState().pedir('quadro')}>Ver P2/C2</button></div>
    <button className="w-full" style={{ ...botao, color:color.accent }} onClick={s.conectar}>{s.garras ? 'Garras conectadas' : 'Conectar as duas garras'}</button>
    <div className="rounded-lg p-3" style={{ background:color.surface }} aria-live="polite">
      <p className="font-mono text-3xl" style={{color:leitura ? (leitura.aprovado ? color.status.pass : color.status.fail) : color.textMuted}}>{leitura ? (Number.isFinite(leitura.r) ? leitura.r.toFixed(3) : 'OL') : '— — —'} Ω</p>
      <p>{par.tipo === 'primeira' ? 'Primeira verificação' : 'Verificação comprobatória'} · limite {criterio.limite} Ω</p><p>{criterio.norma}</p>
      {leitura && <p>{leitura.aprovado ? 'Trecho dentro do limite' : 'Trecho fora do limite — corrigir e repetir'}</p>}
    </div>
    <button className="w-full" style={{...botao, opacity:s.preparado && s.garras ? 1 : 0.5, color:color.accent}} disabled={!s.preparado || !s.garras} onClick={s.medir}>{leitura ? 'Remedir trecho' : 'Medir trecho'}</button>
    <BotaoTestesEmLote habilitado={s.preparado} executar={executarEstruturalEmLote} detalhe="Conecta as garras em cada par, mede as oito cruzadas e a comprobatória e abre a conclusão do relatório." />
    {leitura && s.garras && <button style={botao} onClick={() => s.setFluxo(!s.fluxo)}>{s.fluxo ? 'Ocultar corrente' : 'Mostrar corrente'}</button>}
    <div className="flex gap-2"><button style={botao} onClick={() => useView.getState().pedir('foco')}>Ver Inbrat</button><button style={botao} onClick={() => useView.getState().pedir('reset')}>Ver galpão</button></div>
    <p style={{ color:color.textMuted }}>Setas: C1 → rede de armaduras → C2; P1/P2 medem tensão. Sentidos calculados na rede resistiva; tamanho e velocidade das setas são ilustrativos. A fundação aparece através do solo durante a animação.</p>
    <label className="block">Cenário didático<select value={s.defeito} className="block w-full" style={botao} onChange={e => s.setDefeito(e.target.value as typeof s.defeito)}><option value="integro">Conexões íntegras</option><option value="bep">Ligação BEP deteriorada</option><option value="pilar">Contato superior de P1 deteriorado</option></select></label>
    <div className="rounded-lg p-3" style={{ background:color.surface, border:`1px solid ${color.hairline}` }}>
      <p>{quantidade}/{PARES_ESTRUTURAIS.length} leituras registradas</p>
      <button style={botao} disabled={!completos} onClick={s.emitir}>Consolidar relatório</button>
      {s.laudo && <div className="mt-2"><p>{Object.values(s.leituras).every(l => l.aprovado) ? 'Todos os trechos dentro de seus limites.' : 'Existem trechos fora do limite; corrigir e repetir os ensaios.'}</p><p>Resultado dos ensaios simulados. Não certifica o SPDA completo nem uma instalação real.</p><button style={botao} onClick={exportar}>Baixar relatório CSV</button></div>}
      <button className="mt-2" style={botao} onClick={s.reset}>Novo ensaio</button>
    </div>
  </div>
}

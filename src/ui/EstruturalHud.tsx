import { ConexoesInbrat } from './ConexoesInbrat'
import { BotaoTestesEmLote } from './BotaoTestesEmLote'
import { executarEstruturalEmLote } from '../sim/testesEmLote'
import { PainelRecolhivel } from './PainelRecolhivel'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { fmtNum } from '../i18n/numero'
import { useEstrutural } from '../sim/estruturalStore'
import { useSim } from '../sim/store'
import { useView } from '../sim/viewStore'
import { PARES_ESTRUTURAIS } from '../catalog/estruturalPontos'
import { color } from '../design/tokens'
import { HudTopBar } from './HudTopBar'
import { MobileSheet } from './MobileSheet'
import { QualityPicker } from './QualityPicker'
import { criterioEstrutural } from '../engine/estrutural'

/** Número com as casas que ele já tem (0.2 → "0,2"; 1 → "1"), no separador do idioma. */
function fmtLivre(v: number): string {
  return fmtNum(v, (String(v).split('.')[1] ?? '').length)
}

/** Nome do par recomposto por id no idioma ativo (`estruturalPontos.ts` fica em PT). */
function nomePar(p: (typeof PARES_ESTRUTURAIS)[number], t: TFunction): string {
  if (p.tipo === 'comprobatoria') return t('estrutural:par.captacao-bep')
  return t('estrutural:par.cruzada', { a: p.a, b: p.b })
}

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
  const { t } = useTranslation('estrutural')
  const s = useEstrutural()
  const par = PARES_ESTRUTURAIS.find(p => p.id === s.par)!
  const leitura = s.leituras[s.par], criterio = criterioEstrutural(par.tipo)
  const completos = PARES_ESTRUTURAIS.every(p => s.leituras[p.id])
  const quantidade = Object.keys(s.leituras).length
  const exportar = () => {
    // Relatório no idioma ativo; números com o separador do idioma (o CSV usa ';').
    const linhas = [[t('csv.titulo')], ['ABNT NBR 5419-3:2026', t('csv.corrente'), t(`csv.fase.${s.fase}`), t(`csv.defeito.${s.defeito}`)],
      [t('csv.trecho'), t('csv.resistencia'), t('csv.limite'), t('csv.resultado'), t('csv.referencia'), t('csv.data')],
      ...PARES_ESTRUTURAIS.map(p => { const l = s.leituras[p.id]; return [nomePar(p, t), l ? (Number.isFinite(l.r) ? fmtNum(l.r, 6) : 'OL') : '', l ? fmtLivre(l.limite) : '', l ? (l.aprovado ? t('csv.dentro') : t('csv.fora')) : t('csv.pendente'), l?.norma ?? '', l?.data ?? ''] })]
    const blob = new Blob(['\uFEFF' + linhas.map(l => l.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(';')).join('\r\n')], {type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob), a = document.createElement('a')
    a.href=url; a.download=t('csv.arquivo'); a.click(); setTimeout(() => URL.revokeObjectURL(url),1000)
  }
  const botao = { background: color.surface, color: color.text, border: `1px solid ${color.hairline}`, borderRadius: 7, padding:'9px 12px' }
  return <div className="hud-glass rounded-xl p-4 w-[330px] max-w-full max-h-full overflow-y-auto hud-scroll text-[12px] space-y-3" style={{ color: color.text }}>
    <div><p className="text-[10px] tracking-widest uppercase" style={{ color:color.accent }}>{t('rotulo')}</p><h2 className="font-display text-xl font-semibold">{t('titulo')}</h2><p style={{ color:color.textMuted }}>{t('norma')}</p></div>
    <p>{t('intro')}</p>
    <div className="flex gap-2">
      <button style={{ ...botao, color:s.fase === 'obra' ? color.accent : color.text }} aria-pressed={s.fase === 'obra'} onClick={() => s.setFase('obra')}>{t('faseObra')}</button>
      <button style={{ ...botao, color:s.fase === 'pronto' ? color.accent : color.text }} aria-pressed={s.fase === 'pronto'} onClick={() => s.setFase('pronto')}>{t('fasePronto')}</button>
    </div>
    {s.fase === 'pronto' && <label className="flex gap-2 items-center"><input type="checkbox" checked={s.revelar} onChange={e => s.setRevelar(e.target.checked)} />{t('revelar')}</label>}
    {s.fase === 'obra' && <p style={{ color:color.textMuted }}>{t('obraNota')}</p>}
    <details><summary>{t('prepResumo')}</summary><p>{t('prepTexto1')}</p><p>{t('prepTexto2')}</p></details>
    <button style={botao} className="w-full" disabled={s.preparado} onClick={s.preparar}>{s.preparado ? t('preparado') : t('preparar')}</button>
    <ConexoesInbrat />
    <p style={{color:color.textMuted}}>{t('terminais')}</p>
    <label className="block">{t('pontos')}
      <select className="block w-full mt-1" style={botao} value={s.par} onChange={e => s.setPar(e.target.value)}>
        {PARES_ESTRUTURAIS.map(p => <option key={p.id} value={p.id}>{s.leituras[p.id] ? '✓ ' : ''}{nomePar(p, t)}</option>)}
      </select>
    </label>
    <div className="flex gap-2"><button style={botao} onClick={() => useView.getState().pedir('origem')}>{t('verP1')}</button><button style={botao} onClick={() => useView.getState().pedir('quadro')}>{t('verP2')}</button></div>
    <button className="w-full" style={{ ...botao, color:color.accent }} onClick={s.conectar}>{s.garras ? t('conectadas') : t('conectar')}</button>
    <div className="rounded-lg p-3" style={{ background:color.surface }} aria-live="polite">
      <p className="font-mono text-3xl" style={{color:leitura ? (leitura.aprovado ? color.status.pass : color.status.fail) : color.textMuted}}>{leitura ? (Number.isFinite(leitura.r) ? fmtNum(leitura.r, 3) : 'OL') : '— — —'} Ω</p>
      <p>{t('limite', { tipo: par.tipo === 'primeira' ? t('primeira') : t('comprobatoria'), l: fmtLivre(criterio.limite) })}</p><p>{criterio.norma}</p>
      {leitura && <p>{leitura.aprovado ? t('dentro') : t('fora')}</p>}
    </div>
    <button className="w-full" style={{...botao, opacity:s.preparado && s.garras ? 1 : 0.5, color:color.accent}} disabled={!s.preparado || !s.garras} onClick={s.medir}>{leitura ? t('remedir') : t('medir')}</button>
    <BotaoTestesEmLote habilitado={s.preparado} executar={executarEstruturalEmLote} detalhe={t('loteDetalhe')} />
    {leitura && s.garras && <button style={botao} onClick={() => s.setFluxo(!s.fluxo)}>{s.fluxo ? t('ocultarCorrente') : t('mostrarCorrente')}</button>}
    <div className="flex gap-2"><button style={botao} onClick={() => useView.getState().pedir('foco')}>{t('verInbrat')}</button><button style={botao} onClick={() => useView.getState().pedir('reset')}>{t('verGalpao')}</button></div>
    <p style={{ color:color.textMuted }}>{t('setas')}</p>
    <label className="block">{t('cenario')}<select value={s.defeito} className="block w-full" style={botao} onChange={e => s.setDefeito(e.target.value as typeof s.defeito)}><option value="integro">{t('defeito.integro')}</option><option value="bep">{t('defeito.bep')}</option><option value="pilar">{t('defeito.pilar')}</option></select></label>
    <div className="rounded-lg p-3" style={{ background:color.surface, border:`1px solid ${color.hairline}` }}>
      <p>{t('leituras', { n: quantidade, total: PARES_ESTRUTURAIS.length })}</p>
      <button style={botao} disabled={!completos} onClick={s.emitir}>{t('consolidar')}</button>
      {s.laudo && <div className="mt-2"><p>{Object.values(s.leituras).every(l => l.aprovado) ? t('todosDentro') : t('existemFora')}</p><p>{t('aviso')}</p><button style={botao} onClick={exportar}>{t('baixarCsv')}</button></div>}
      <button className="mt-2" style={botao} onClick={s.reset}>{t('novoEnsaio')}</button>
    </div>
  </div>
}

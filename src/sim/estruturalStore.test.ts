import { expect, it } from 'vitest'
import { useEstrutural } from './estruturalStore'
import { PARES_ESTRUTURAIS } from '../catalog/estruturalPontos'
it('exige preparação e conexão; relatório exige as nove leituras e mudança de cenário invalida resultados', () => {
  const s=()=>useEstrutural.getState()
  s().reset(); s().medir(); expect(Object.keys(s().leituras)).toHaveLength(0)
  s().preparar(); s().medir(); expect(Object.keys(s().leituras)).toHaveLength(0)
  s().emitir(); expect(s().laudo).toBe(false)
  for(const p of PARES_ESTRUTURAIS){s().setPar(p.id);expect(s().fluxo).toBe(false);s().conectar();s().medir()}
  expect(Object.keys(s().leituras)).toHaveLength(9)
  s().emitir(); expect(s().laudo).toBe(true);expect(s().fluxo).toBe(false)
  s().setDefeito('bep');expect(Object.keys(s().leituras)).toHaveLength(0);expect(s().laudo).toBe(false)
  s().reset()
})

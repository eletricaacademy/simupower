import type { TraducaoEnsaio } from '../localizar'
import {
  USINA,
  MODULOS_TOTAL,
  POTENCIA_DC_KWP,
  PONTOS_CONTINUIDADE_FV,
  PONTOS_TOQUE_PASSO_FV,
  DISTANCIAS_C_M,
} from '../../usinaFvPontos'

// mesmos textos derivados dos dados do catálogo em PT (ponto decimal em inglês)
const kwp = POTENCIA_DC_KWP.toFixed(1)
const nCont = PONTOS_CONTINUIDADE_FV.length
const nTP = PONTOS_TOQUE_PASSO_FV.length
const cLonge = DISTANCIAS_C_M[DISTANCIAS_C_M.length - 1]

/** Catálogo do ensaio `aterramento-usina-fv` em inglês, por id de passo. */
export const EN_USINA_FV: Record<string, TraducaoEnsaio> = {
  'aterramento-usina-fv': {
    nome: 'Grounding of a photovoltaic plant',
    norma: 'NBR 16690 · NBR 16274 · NBR 15749 · NBR 15751',
    steps: {
      'fv-seguranca': {
        titulo: 'Safety and test conditions',
        descricao:
          'Prepare the job safety analysis (JSA) for the plant: the PV array produces DC voltage whenever there is light, and the grid can pick up potential from a utility-side fault. Check weather, lockouts and access.',
        detalhes: [
          `Ground-mounted plant: ${MODULOS_TOTAL} modules of ${USINA.moduloWp} Wp (${kwp} kWp), ${USINA.mesas} tables, skid with ${USINA.inversores} inverters of ${USINA.inversorKw} kW`,
          `Step-up transformer ${USINA.trafoKva} kVA ${USINA.tensaoBtV} V / ${USINA.tensaoMtKv} kV and metering and protection cubicle`,
          'Inverters off and DC/AC disconnects open and locked out (NR-10)',
          'Do NOT test during a thunderstorm: a nearby strike raises the potential of the grid and the stakes',
          'Insulating gloves for the clamps and the long fall-of-potential leads',
        ],
        cuidados: [
          'Opening the disconnect does not remove the module voltage: the DC side stays energized under light.',
          'While current is being injected, nobody touches the stakes or the test leads.',
        ],
        feito: 'JSA and lockouts completed.',
        acao: 'Confirm preparation',
        norma: 'NR-10 · NBR 16690',
      },
      'fv-visual': {
        titulo: 'Visual inspection of the grounding',
        descricao:
          'Walk the plant before measuring: table bonding leads to the grid, jumpers between profiles, fence and gate, skid, transformer and substation.',
        detalhes: [
          'Tables: clamp with serrated washer (pierces the anodizing) and bonding lead to the grid',
          'Fence: grounded posts and flexible braid on the gate leaf',
          'Skid and transformer: inverter PE, tank and neutral bonded to the grid; crushed rock layer intact',
          'Inspection wells accessible; substation grid bonded to the plant grid',
          'Use “Show buried grid” to see the ring, the cross conductors and the ground rods',
        ],
        erros: [
          'Relying on mechanical contact between anodized profiles — anodizing is an insulator.',
          'Forgetting that the gate hinge is not a protective conductor.',
        ],
        feito: 'Visual inspection recorded.',
        acao: 'Complete visual inspection',
        norma: 'NBR 16274 · NBR 16690',
      },
      'fv-continuidade': {
        titulo: 'Bonding continuity',
        descricao: `With the milliohmmeter, zero the test leads and measure from the skid main bonding bar to each exposed conductive part: the ${USINA.mesas} tables, the inverters, the transformer, the substation, the gate and the fence.`,
        detalhes: [
          'Fixed clamp on the skid main bonding bar; remote lead at each point',
          'Low-resistance function with test current ≥ 200 mA',
          'Adopted criterion: ≤ 0.5 Ω pass · 0.5–1.0 Ω caution · > 1.0 Ω or OL fail',
          `Measure all ${nCont} points to complete this step`,
        ],
        cuidados: ['Test with the system de-energized and locked out; do not disconnect protective conductors in service.'],
        feito: 'Continuity measured at every point.',
        acao: 'Complete continuity',
        norma: 'NBR 16274 · continuity test',
      },
      'fv-resistencia': {
        titulo: 'Grid resistance — fall of potential',
        descricao:
          'Connect E at the inspection well next to the gate and run the stakes along the road. Choose the C stake distance, record P at 52%, 62% and 72% and check the plateau.',
        detalhes: [
          'Large grid: with the C stake too close, the curve forms no plateau and the 62% reading is misleading',
          `Reference distance: ≥ 5× the grid diagonal (≈ ${cLonge} m here)`,
          'Record P at 52%, 62% and 72% — stable plateau if the variation is ≤ 10%',
          'Stakes in undisturbed soil, in line, away from fences and buried cables',
        ],
        cuidados: ['Step voltage near the stakes during injection: mark the route of the leads.'],
        feito: 'Curve plotted and plateau evaluated.',
        acao: 'Complete grid measurement',
        norma: 'NBR 15749 · fall of potential',
      },
      'fv-toque-passo': {
        titulo: 'Touch and step voltages',
        descricao:
          'Inject current into the grid and, with foot electrodes and the resistor that represents the body, measure touch and step voltage at the critical points. Extrapolate to the fault current and compare with the limit.',
        detalhes: [
          'Points: transformer tank, main LV switchboard door, table, gate (outside), transformer base and perimeter',
          'Reading at the test current → extrapolated to the fault current flowing through the grid',
          'The tolerable limit depends on the surface resistivity: crushed rock raises the limit',
          `Measure all ${nTP} points to complete this step`,
        ],
        cuidados: ['Only the test crew in the area during injection.'],
        feito: 'Touch and step evaluated.',
        acao: 'Complete touch and step',
        norma: 'NBR 15749 (measurement) · NBR 15751 (limits)',
      },
      'fv-laudo': {
        titulo: 'Plant grounding report',
        descricao:
          'Consolidate the three tests: continuity points passed, grid resistance with plateau and touch/step voltages. Findings require correction and a new test.',
        detalhes: [
          'Record instrument, date, weather and soil resistivity',
          'Grid resistance is only valid with a stable plateau',
          'Corrections: flexible braid, serrated washer, crushed rock, grid reinforcement',
        ],
        feito: 'Report issued.',
        acao: 'Issue report',
        norma: 'NBR 16274 · NBR 15749',
      },
    },
  },
}

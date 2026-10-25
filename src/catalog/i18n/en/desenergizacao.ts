import type { TraducaoEnsaio } from '../localizar'

/**
 * Catálogo do ensaio `desenergizacao-subestacao` em inglês, por id de passo.
 *
 * A sequência continua a da NR-10 (10.5 / 10.6), na mesma ordem e com os mesmos
 * passos; o vocabulário segue o usual de NFPA 70E / OSHA (isolate, lockout/
 * tagout, test for absence of voltage, temporary protective grounding).
 */
export const EN_DESENERGIZACAO: Record<string, TraducaoEnsaio> = {
  'desenergizacao-subestacao': {
    nome: 'De-energization procedure',
    norma: 'NR-10 · 10.5 / 10.6',
    steps: {
      'des-apr': {
        titulo: 'Planning and PPE',
        descricao: 'First of all: risk assessment, work permit and protective equipment.',
        detalhes: [
          'Job safety analysis (JSA) / work permit issued',
          'PPE: arc-rated (FR) clothing, rubber insulating gloves + leather protectors, hard hat with face shield',
          'Collective equipment: voltage detector, grounding set, locks/tags (LOTO)',
          'Barricading and access control of the area',
        ],
        cuidados: [
          'Confirm the voltage and the (single-line) diagram of the circuit before starting.',
          'Inspect the PPE: rubber insulating gloves tested and free of holes.',
          'Assign who is responsible for the lockout key.',
        ],
        erros: [
          'Starting without a signed work permit/JSA.',
          'Using expired rubber gloves or gloves without leather protectors.',
          'Not barricading the work zone.',
        ],
        feito: 'Planning confirmed. PPE and collective equipment ready to start.',
        acao: 'Confirm planning',
        norma: 'NR-10',
      },
      'des-seccionar': {
        titulo: '1. Isolation (disconnect)',
        descricao: 'Open the circuit at the circuit breaker and at the disconnect switch, creating a verifiable open point.',
        detalhes: [
          'Open the circuit breaker',
          'Open the disconnect switch (visible break)',
          'Confirm the open indication',
        ],
        cuidados: [
          'Operate in the correct sequence: first the breaker (under load), then the disconnect switch.',
          'Confirm the opening by the indication lights (red→green) and, if possible, visually.',
        ],
        erros: [
          'Opening the disconnect switch under load (arc hazard).',
          'Relying only on the push button without confirming the actual position.',
        ],
        feito: 'Breaker and disconnect switch open — circuit isolated (green light).',
        acao: 'Isolate circuit',
      },
      'des-bloquear': {
        titulo: '2. Lockout/tagout — prevent re-energization',
        descricao: 'Lock out the device (LOTO) and attach a warning tag.',
        detalhes: [
          'Padlock/LOTO device on the handle',
          'Tag with name/date/person in charge',
          'Key kept by the worker performing the task',
        ],
        cuidados: [
          'Use a lockout device (LOTO) that physically prevents operation.',
          'Each worker must apply their own padlock (group lockout, if applicable).',
          'The padlock key stays with the person performing the work.',
        ],
        erros: [
          'Tagging only, without a lock.',
          'Leaving the padlock key at the switchgear.',
          'A lockout that does not prevent operation.',
        ],
        feito: 'LOTO device installed and tagged — re-energization prevented.',
        acao: 'Apply lockout',
      },
      'des-testar': {
        titulo: '3. Test for absence of voltage',
        descricao: 'Test with a voltage detector (live–dead–live technique) on all phases.',
        detalhes: [
          'Test the detector on an energized source',
          'Test the circuit (must show absence of voltage)',
          'Re-verify the detector on the source',
        ],
        cuidados: [
          'Detector rated for the voltage (MV) and within its calibration date.',
          'Live–dead–live test: prove the detector works before and after.',
          'Check ALL phases.',
        ],
        erros: [
          'Skipping the live–dead–live test (the detector may be faulty).',
          'Testing only one phase.',
          'Using an LV detector on MV.',
        ],
        feito: 'Absence of voltage confirmed on all three phases.',
        acao: 'Test voltage',
      },
      'des-aterrar': {
        titulo: '4. Temporary protective grounding',
        descricao: 'Install the temporary protective grounding set, bonding the phases together.',
        detalhes: [
          'Connect to ground/grid FIRST',
          'Then to the conductors (all phases)',
          'Bond the work zone (equipotential zone)',
        ],
        cuidados: [
          'Connection order: ground first, then the conductors.',
          'Grounding set sized for the short-circuit current.',
          'Ground both sides of the work point if it can be fed from both.',
        ],
        erros: [
          'Connecting to the conductors before ground.',
          'Undersized grounding cable.',
          'Forgetting one of the phases.',
        ],
        feito: 'Phases grounded and bonded.',
        acao: 'Install grounding',
      },
      'des-proteger': {
        titulo: '5. Protection of live parts',
        descricao: 'Insulate or barricade the nearby energized parts within the controlled zone.',
        detalhes: [
          'Insulating blankets/covers',
          'Physical barriers',
          'Mark the parts that remain energized',
        ],
        cuidados: [
          'Identify what remains energized nearby.',
          'Use insulating covers rated for the voltage.',
          'Keep the safety distances (controlled/risk zone).',
        ],
        erros: [
          'Ignoring adjacent circuits that are still energized.',
          'A barrier that is not rated for the voltage.',
        ],
        feito: 'Nearby live parts protected and marked.',
        acao: 'Protect live parts',
      },
      'des-sinalizar': {
        titulo: '6. Signage',
        descricao: 'Install the signage that prohibits re-energization.',
        detalhes: [
          'Tag "DO NOT OPERATE"',
          'Signage at the control point and at the work location',
          'Identify the circuit',
        ],
        cuidados: [
          'Post signs both at the operating point and at the work location.',
          'Signage must be visible and clear.',
        ],
        erros: [
          'Posting signage at only one point.',
          'Sign without identification of the person in charge/circuit.',
        ],
        feito: 'Signage installed: "DO NOT OPERATE".',
        acao: 'Post signage',
      },
      'des-liberado': {
        titulo: 'Released for work',
        descricao: 'Sequence complete: installation de-energized per NR-10. Work authorized.',
        detalhes: ['All 6 steps completed', 'Safety status confirmed'],
        cuidados: ['Recheck the safety status before releasing the crew.'],
        feito: 'Installation de-energized and safe — maintenance may begin.',
        acao: 'Confirm release',
      },
      'reen-conferir': {
        titulo: 'End of work — check',
        descricao: 'Confirm the work is finished, tools are removed and people are clear.',
        detalhes: [
          'People outside the risk zone',
          'Tools/materials removed',
          'Crew aware of the re-energization',
        ],
        cuidados: ['Count the crew and confirm that no one is in contact with the circuit.'],
        erros: ['Re-energizing with people/tools still in the installation.'],
        feito: 'Crew, tools and area checked.',
        acao: 'Confirm check',
      },
      'reen-rem-sinalizar': {
        titulo: 'Remove signage',
        descricao: 'Remove the do-not-operate signage.',
        feito: 'Signage removed.',
        acao: 'Remove signage',
      },
      'reen-rem-proteger': {
        titulo: 'Remove protections',
        descricao: 'Remove barriers and insulating covers.',
        feito: 'Protections removed.',
        acao: 'Remove protections',
      },
      'reen-rem-aterrar': {
        titulo: 'Remove grounding',
        descricao: 'Remove the temporary protective grounding (first from the conductors, then from ground).',
        detalhes: ['Remove from the conductors FIRST', 'Then from ground/grid'],
        cuidados: ['Reverse of the installation order: conductors first, ground last.'],
        erros: ['Removing the ground before the conductors.'],
        feito: 'Temporary grounding removed.',
        acao: 'Remove grounding',
      },
      'reen-rem-bloquear': {
        titulo: 'Remove lockout',
        descricao: 'Remove the padlock and tag from the switching device.',
        cuidados: ['Only the person who applied the lockout removes it.'],
        feito: 'Lockout (LOTO) removed.',
        acao: 'Remove lockout',
      },
      'reen-carregar-mola': {
        titulo: 'Charge the breaker spring',
        descricao: 'Charge the operating spring before closing the circuit breaker.',
        detalhes: [
          'Operate the spring-charging crank/motor',
          'Wait for the "spring charged" indication',
        ],
        cuidados: ['Confirm the spring is fully charged before closing.'],
        erros: ['Trying to close with the spring discharged.'],
        feito: 'Spring charged — breaker ready to close.',
        acao: 'Charge spring',
      },
      'reen-religar': {
        titulo: 'Re-energize',
        descricao: 'Close the disconnect switch and the circuit breaker, re-energizing the circuit.',
        detalhes: ['Close the disconnect switch', 'Close the circuit breaker', 'Confirm energization'],
        cuidados: ['Warn the crew before re-energizing. No one in contact with the circuit.'],
        erros: ['Re-energizing without prior warning.', 'Closing without the spring charged.'],
        feito: 'Disconnect switch and breaker closed — circuit re-energized (red light).',
        acao: 'Close breaker',
      },
      'reen-energizada': {
        titulo: 'Substation re-energized',
        descricao: 'Circuit re-energized and in operation. Procedure completed.',
        feito: 'Substation re-energized and in operation.',
        acao: 'Finish',
      },
    },
  },
}

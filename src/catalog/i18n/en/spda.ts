import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `continuidade-spda` em inglês, por id de passo. */
export const EN_SPDA: Record<string, TraducaoEnsaio> = {
  'continuidade-spda': {
    nome: 'LPS continuity',
    norma: 'NBR 5419-3 — LPS inspection and maintenance',
    steps: {
      'spda-seguranca': {
        titulo: 'Safety and test conditions',
        descricao:
          'Complete the job safety analysis (JSA), check the weather conditions and prepare access to the LPS measurement points.',
        detalhes: [
          'JSA and suitable PPE (work at height, if the roof must be accessed)',
          'Do NOT inspect with a thunderstorm in the area or lightning in the forecast',
          'Calibrated continuity instrument, with leads and clips in good condition',
          'Identify the down conductors and locate the test joint boxes',
        ],
        cuidados: [
          'The LPS may become energized by induction during nearby thunderstorms — suspend the test.',
          'Roof access requires a fall protection system (NR-35).',
        ],
        feito: 'Preparation and risk analysis completed.',
        acao: 'Confirm preparation',
        norma: 'NBR 5419-3 · NR-35',
      },
      'spda-visual': {
        titulo: 'Visual inspection of the LPS',
        descricao:
          'Before measuring, visually inspect the air termination, down conductors, connections and test joint boxes. Continuity testing confirms what the visual inspection finds.',
        detalhes: [
          'Air termination: air terminals secured, ring intact, nothing loose',
          'Down conductors: no unnecessary splices and regular fastening',
          'Connections: no corrosion, no looseness, protected from the weather',
          'Test joint boxes: accessible, disconnectable connector in working condition',
        ],
        erros: [
          'Measuring without inspecting: a good reading does not guarantee fastening or minimum cross-section.',
          'Ignoring corrosion at the base of the down conductor — the most common failure point.',
        ],
        feito: 'Visual inspection recorded.',
        acao: 'Finish visual inspection',
        norma: 'NBR 5419-3 · 7 (inspection)',
      },
      'spda-zerar': {
        titulo: 'Prepare the instrument (zero the leads)',
        descricao:
          'Select the CONTINUITY (low-resistance) function and NULL the test leads: touch one clip to the other and compensate for the lead resistance.',
        detalhes: [
          'Continuity function with test current ≥ 200 mA',
          'Short the leads together and activate compensation (zero/REL)',
          'Without nulling, the leads add ~0.13 Ω to ALL readings',
        ],
        erros: ['Failing a good section because the test leads were not compensated.'],
        feito: 'Leads compensated — instrument ready.',
        acao: 'Zero the leads',
        norma: 'NBR 5419-3 · Annex (tests)',
      },
      'spda-medir': {
        titulo: 'Measure between down conductors and to the BEP',
        descricao:
          'Measure the adjacent pairs D1–D2, D2–D3, D3–D4 and D4–D1: first at the upper terminals, then at the lower ones. Repeat for the diagonals D1–D3 and D2–D4. Finish with D1–BEP (main bonding bar) in the electrical room.',
        detalhes: [
          'Test joints open: one clip in each box; upper terminals via the air-termination path, lower terminals via the ground ring',
          'An intact section reads a few milliohms; a poor connection raises the reading',
          'Criterion adopted: R ≤ 0.2 Ω compliant · 0.2–1.0 Ω warning · > 1.0 Ω or OL non-compliant',
          'Record the 12 measurements between down conductors and the D1–BEP measurement; restore the test joints after a real test',
        ],
        cuidados: [
          'The lower measurement checks conductor continuity, not the electrode resistance to earth.',
          'Electrical room: main LV switchboard closed; access and safety conditions per the JSA and NR-10.',
        ],
        feito: 'All sections measured.',
        acao: 'Finish measurements',
        norma: 'NBR 5419-3 · 7 (continuity tests)',
      },
      'spda-laudo': {
        titulo: 'Continuity report',
        descricao:
          'Compile the readings: sections passed, nonconformities, probable cause and corrective action. The LPS is compliant only if ALL sections are within the criterion.',
        detalhes: [
          'Record the reading, date and instrument used for each section',
          'A nonconformity requires repair and a NEW measurement of the section',
          'Inspection interval according to the protection level (NBR 5419-3)',
        ],
        feito: 'Report issued.',
        acao: 'Issue report',
        norma: 'NBR 5419-3 · 7',
      },
    },
  },
}

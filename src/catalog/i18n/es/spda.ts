import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `continuidade-spda` em espanhol, por id de passo. */
export const ES_SPDA: Record<string, TraducaoEnsaio> = {
  'continuidade-spda': {
    nome: 'Continuidad del SPCR',
    norma: 'NBR 5419-3 — Inspección y mantenimiento del SPCR',
    steps: {
      'spda-seguranca': {
        titulo: 'Seguridad y condiciones del ensayo',
        descricao:
          'Realice el análisis de riesgos (ATS), verifique las condiciones climáticas y prepare el acceso a los puntos de medición del SPCR.',
        detalhes: [
          'Análisis de riesgos (ATS) y EPP adecuados (trabajo en altura, si hay acceso a la cubierta)',
          'NO inspeccionar con tormenta en la zona o con pronóstico de descargas atmosféricas',
          'Instrumento de continuidad calibrado, con cables y pinzas en buen estado',
          'Identificar las bajantes y ubicar las cajas de inspección',
        ],
        cuidados: [
          'El SPCR puede quedar energizado por inducción durante tormentas cercanas: suspenda el ensayo.',
          'El acceso a la cubierta exige un sistema de protección contra caídas (NR-35).',
        ],
        feito: 'Preparación y análisis de riesgos concluidos.',
        acao: 'Confirmar preparación',
        norma: 'NBR 5419-3 · NR-35',
      },
      'spda-visual': {
        titulo: 'Inspección visual del SPCR',
        descricao:
          'Antes de medir, inspeccione visualmente la captación, las bajantes, las conexiones y las cajas de inspección. La continuidad confirma lo que la inspección visual detecta.',
        detalhes: [
          'Captación: captores fijos, anillo íntegro, sin aflojamiento',
          'Bajantes: conductor sin empalmes innecesarios y con fijación regular',
          'Conexiones: sin corrosión, sin holgura, protegidas contra la intemperie',
          'Cajas de inspección: accesibles, con el conector desconectable en condiciones de uso',
        ],
        erros: [
          'Medir sin inspeccionar: una buena lectura no garantiza la fijación ni la sección mínima.',
          'Ignorar la corrosión en la base de la bajante, el punto de falla más común.',
        ],
        feito: 'Inspección visual registrada.',
        acao: 'Concluir inspección visual',
        norma: 'NBR 5419-3 · 7 (inspección)',
      },
      'spda-zerar': {
        titulo: 'Preparar el instrumento (poner a cero las puntas)',
        descricao:
          'Seleccione la función CONTINUIDAD (baja resistencia) y ponga a CERO las puntas de prueba: junte una pinza con la otra y compense la resistencia de los cables.',
        detalhes: [
          'Función de continuidad con corriente de ensayo ≥ 200 mA',
          'Cortocircuitar las puntas y activar la compensación (cero/REL)',
          'Sin poner a cero, los cables suman ~0,13 Ω en TODAS las lecturas',
        ],
        erros: ['Rechazar un tramo en buen estado por olvidar compensar las puntas de prueba.'],
        feito: 'Puntas compensadas: instrumento listo.',
        acao: 'Poner a cero las puntas',
        norma: 'NBR 5419-3 · Anexo (ensayos)',
      },
      'spda-medir': {
        titulo: 'Medir entre bajantes y hasta la BEP',
        descricao:
          'Mida los pares vecinos D1–D2, D2–D3, D3–D4 y D4–D1: primero en los terminales superiores y después en los inferiores. Repita en las cruzadas D1–D3 y D2–D4. Finalice con D1–BEP en la sala eléctrica.',
        detalhes: [
          'Seccionamientos abiertos: una pinza en cada caja; los superiores por el recorrido de la captación, los inferiores por el anillo de puesta a tierra',
          'Un tramo íntegro marca algunos miliohmios; una mala conexión eleva la lectura',
          'Criterio adoptado: R ≤ 0,2 Ω conforme · 0,2–1,0 Ω atención · > 1,0 Ω u OL no conforme',
          'Registre las 12 mediciones entre bajantes y la medición D1–BEP; restablezca los seccionamientos después del ensayo real',
        ],
        cuidados: [
          'La medición inferior verifica la continuidad de los conductores, no la resistencia del electrodo respecto al suelo.',
          'Sala eléctrica: TGBT cerrado; acceso y condiciones de seguridad según el análisis de riesgos (ATS) y la NR-10.',
        ],
        feito: 'Todos los tramos medidos.',
        acao: 'Concluir mediciones',
        norma: 'NBR 5419-3 · 7 (ensayos de continuidad)',
      },
      'spda-laudo': {
        titulo: 'Informe de continuidad',
        descricao:
          'Consolide las lecturas: tramos aprobados, no conformidades, causa probable y acción correctiva. El SPCR solo es conforme con TODOS los tramos dentro del criterio.',
        detalhes: [
          'Registrar por tramo la lectura, la fecha y el instrumento utilizado',
          'Una no conformidad exige corrección y una NUEVA medición del tramo',
          'Periodicidad de la inspección según el nivel de protección (NBR 5419-3)',
        ],
        feito: 'Informe emitido.',
        acao: 'Emitir informe',
        norma: 'NBR 5419-3 · 7',
      },
    },
  },
}

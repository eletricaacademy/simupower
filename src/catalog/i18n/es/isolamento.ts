import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `resistencia-isolamento` em espanhol, por id de passo. */
export const ES_ISOLAMENTO: Record<string, TraducaoEnsaio> = {
  'resistencia-isolamento': {
    nome: 'Resistencia de aislamiento',
    norma: 'IEEE Std 43 · NBR / IEC 60034-27',
    steps: {
      's1-loto': {
        titulo: 'Seguridad (LOTO)',
        descricao:
          'Confirme la desenergización y el bloqueo/etiquetado del equipo antes de cualquier contacto.',
        acao: 'Confirmar bloqueo',
        norma: 'NR-10 · LOTO',
      },
      's2-descarga-inicial': {
        titulo: 'Descarga inicial',
        descricao:
          'Ponga momentáneamente a tierra los terminales para drenar las cargas residuales y la capacitancia acumulada.',
        acao: 'Poner terminales a tierra',
      },
      's3-tensao': {
        titulo: 'Tensión de ensayo',
        descricao: 'Seleccione la tensión. Para un motor de baja tensión, el valor estándar es 500 V.',
        acao: 'Definir tensión',
      },
      's4-earth': {
        titulo: 'Conectar EARTH (negra)',
        descricao: 'Conecte la punta de prueba negra (E) a la carcasa puesta a tierra del motor.',
        acao: 'Conectar EARTH',
      },
      's5-line': {
        titulo: 'Conectar LINE (roja)',
        descricao: 'Conecte la punta de prueba roja (L) al terminal del devanado bajo ensayo.',
        acao: 'Conectar LINE',
      },
      's6-test': {
        titulo: 'Aplicar TEST (60 s)',
        descricao:
          'Energice durante 60 s. La lectura sube por la absorción dieléctrica. Registramos R(30 s) y R(60 s), calculamos DAR, IP y R@40 °C y mostramos el veredicto.',
        acao: 'Iniciar TEST',
      },
      's7-descarga-final': {
        titulo: 'Descarga final',
        descricao:
          'Descargue el equipo antes de retirar las puntas de prueba. Nunca toque los terminales energizados.',
        acao: 'Descargar',
      },
    },
  },
}

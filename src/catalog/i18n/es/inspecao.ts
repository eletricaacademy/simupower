import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `inspecao-subestacao` em espanhol, por id de passo. */
export const ES_INSPECAO: Record<string, TraducaoEnsaio> = {
  'inspecao-subestacao': {
    nome: 'Inspección de subestación',
    norma: 'NR-10 · NBR 14039',
    steps: {
      'insp-acesso': {
        titulo: 'Acceso y señalización',
        descricao: 'Verifique las condiciones de acceso y la señalización de seguridad de la subestación.',
        detalhes: [
          'Puerta/cerraduras íntegras e identificación del recinto',
          'Carteles de advertencia "Peligro de Muerte / Alta Tensión"',
          'Diagrama unifilar fijado y legible',
          'Disponibilidad de EPP y alfombra/tarima aislante',
          'Acceso restringido a personal autorizado (NR-10)',
        ],
        acao: 'Evaluar ítem',
        norma: 'NR-10',
      },
      'insp-trafo': {
        titulo: 'Transformador',
        descricao: 'Inspeccione el estado general del transformador y sus accesorios.',
        detalhes: [
          'Fugas de aceite en la cuba, los radiadores y las juntas',
          'Nivel de aceite en el visor dentro del rango',
          'Sílica gel (azul = ok; rosada = saturada)',
          'Temperatura/termómetro y ruido anormal',
          'Bushings (aisladores pasantes): limpieza, fisuras y conexiones',
          'Puesta a tierra de la cuba firme',
        ],
        acao: 'Evaluar ítem',
      },
      'insp-cubiculos': {
        titulo: 'Celdas e interruptores',
        descricao: 'Verifique las celdas de maniobra y los dispositivos de protección.',
        detalhes: [
          'Puertas de las celdas cerradas y trabadas',
          'Señalización de maniobra (abierto/cerrado/puesto a tierra)',
          'Indicadores y pulsadores operativos',
          'Enclavamientos funcionando',
          'Ausencia de señales de descarga/carbonización',
        ],
        acao: 'Evaluar ítem',
      },
      'insp-aterramento': {
        titulo: 'Puesta a tierra',
        descricao: 'Revise el sistema de puesta a tierra y de equipotencialización.',
        detalhes: [
          'Conexiones de la malla firmes y sin corrosión',
          'Cables de tierra íntegros e identificados (verde-amarillo)',
          'Continuidad de las carcasas con la malla',
          'Conexiones exotérmicas/conectores en buen estado',
        ],
        acao: 'Evaluar ítem',
      },
      'insp-cabos': {
        titulo: 'Cables y conexiones',
        descricao: 'Busque anomalías en los conductores y las conexiones.',
        detalhes: [
          'Puntos calientes / decoloración (termografía)',
          'Aislamiento dañado, reseco o agrietado',
          'Conexiones flojas u oxidadas',
          'Orden y fijación de cables/conductos',
          'Radio de curvatura e identificación de fases',
        ],
        acao: 'Evaluar ítem',
      },
      'insp-ambiente': {
        titulo: 'Iluminación, ventilación y limpieza',
        descricao: 'Evalúe las condiciones ambientales y de protección contra incendios del recinto.',
        detalhes: [
          'Iluminación adecuada e iluminación de emergencia',
          'Ventilación/extracción sin obstrucciones',
          'Limpieza general y ausencia de objetos extraños',
          'Sin filtraciones/humedad ni ingreso de animales',
          'Extintor adecuado, cargado y vigente',
        ],
        acao: 'Evaluar ítem',
      },
      'insp-laudo': {
        titulo: 'Emitir informe',
        descricao: 'Concluya la inspección y genere el veredicto de conformidad de la subestación.',
        acao: 'Concluir inspección',
      },
    },
  },
}

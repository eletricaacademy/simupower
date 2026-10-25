import type { TraducaoEnsaio } from '../localizar'

/** Catálogo do ensaio `arco-eletrico` em espanhol, por id de passo. */
export const ES_ARCO: Record<string, TraducaoEnsaio> = {
  'arco-eletrico': {
    nome: 'Análisis de arco eléctrico',
    norma: 'IEEE 1584 · NFPA 70E · NR-10',
    steps: {
      'af-seguranca': {
        titulo: 'Análisis de riesgos (NR-10)',
        descricao:
          'Antes de trabajar energizado: confirme el análisis documental, la delimitación del área y la necesidad del estudio de arco.',
        acao: 'Confirmar análisis',
        norma: 'NR-10 · NFPA 70E',
      },
      'af-tensao': {
        titulo: 'Tensión del sistema',
        descricao: 'Seleccione la tensión nominal de la barra bajo estudio.',
        acao: 'Definir tensión',
      },
      'af-corrente': {
        titulo: 'Corriente de cortocircuito',
        descricao:
          'Ingrese la corriente de cortocircuito presunta (falla franca) en el punto, obtenida del estudio de cortocircuito.',
        acao: 'Definir Icc',
      },
      'af-tempo': {
        titulo: 'Tiempo de despeje',
        descricao:
          'Tiempo total de extinción del arco = actuación de la protección + apertura del interruptor. Cuanto menor, menor la energía.',
        acao: 'Definir tiempo',
      },
      'af-config': {
        titulo: 'Configuración y distancia',
        descricao:
          'Defina la distancia de trabajo, la separación (gap) entre conductores y si el arco ocurre en caja (celda) o al aire libre.',
        acao: 'Definir configuración',
      },
      'af-calcular': {
        titulo: 'Calcular energía incidente',
        descricao:
          'Calcula la energía incidente (cal/cm²), la frontera de protección contra arco (AFB) y la categoría de EPP según IEEE 1584 / NFPA 70E.',
        acao: 'Calcular arco',
      },
      'af-epi': {
        titulo: 'Definir EPP y etiqueta',
        descricao:
          'Con base en la categoría, defina el EPP adecuado y coloque la etiqueta de arco en el equipo.',
        acao: 'Concluir',
      },
    },
  },
}

import type { TraducaoEnsaio } from '../localizar'
import {
  USINA,
  MODULOS_TOTAL,
  POTENCIA_DC_KWP,
  PONTOS_CONTINUIDADE_FV,
  PONTOS_TOQUE_PASSO_FV,
  DISTANCIAS_C_M,
} from '../../usinaFvPontos'

// mesmos textos derivados dos dados do catálogo em PT (vírgula decimal em espanhol)
const kwp = POTENCIA_DC_KWP.toFixed(1).replace('.', ',')
const nCont = PONTOS_CONTINUIDADE_FV.length
const nTP = PONTOS_TOQUE_PASSO_FV.length
const cLonge = DISTANCIAS_C_M[DISTANCIAS_C_M.length - 1]
const kva = String(USINA.trafoKva).replace('.', ',')
const kvMt = String(USINA.tensaoMtKv).replace('.', ',')

/** Catálogo do ensaio `aterramento-usina-fv` em espanhol, por id de passo. */
export const ES_USINA_FV: Record<string, TraducaoEnsaio> = {
  'aterramento-usina-fv': {
    nome: 'Puesta a tierra en planta fotovoltaica',
    norma: 'NBR 16690 · NBR 16274 · NBR 15749 · NBR 15751',
    steps: {
      'fv-seguranca': {
        titulo: 'Seguridad y condiciones del ensayo',
        descricao:
          'Elabore el análisis de riesgos (ATS) de la planta: el generador FV produce tensión CC siempre que hay luz, y la malla puede recibir potencial de una falla en la red. Verifique el clima, los bloqueos y los accesos.',
        detalhes: [
          `Planta en suelo: ${MODULOS_TOTAL} módulos de ${USINA.moduloWp} Wp (${kwp} kWp), ${USINA.mesas} mesas, skid con ${USINA.inversores} inversores de ${USINA.inversorKw} kW`,
          `Transformador elevador ${kva} kVA ${USINA.tensaoBtV} V / ${kvMt} kV y celda de medición y protección`,
          'Inversores apagados y seccionadores CC/CA abiertos y bloqueados (NR-10)',
          'NO ensayar con tormenta: una descarga cercana eleva el potencial de la malla y de las estacas',
          'Guantes aislantes para las pinzas y los cables largos de la caída de potencial',
        ],
        cuidados: [
          'Abrir el seccionador no anula la tensión de los módulos: el lado CC sigue energizado bajo la luz.',
          'Durante la inyección de corriente, nadie toca las estacas ni los cables de ensayo.',
        ],
        feito: 'Análisis de riesgos y bloqueos concluidos.',
        acao: 'Confirmar preparación',
        norma: 'NR-10 · NBR 16690',
      },
      'fv-visual': {
        titulo: 'Inspección visual de la puesta a tierra',
        descricao:
          'Recorra la planta antes de medir: derivaciones de las mesas a la malla, puentes entre perfiles, cerco y portón, skid, transformador y subestación.',
        detalhes: [
          'Mesas: grapa con arandela dentada (perfora el anodizado) y derivación a la malla',
          'Cerco: postes puestos a tierra y trenza flexible en la hoja del portón',
          'Skid y transformador: PE de los inversores, cuba y neutro conectados a la malla; grava íntegra',
          'Cámaras de inspección accesibles; malla de la subestación interconectada con la de la planta',
          'Use “Mostrar malla enterrada” para ver el anillo, los conductores transversales y las jabalinas',
        ],
        erros: [
          'Confiar en el contacto mecánico entre perfiles anodizados: el anodizado es aislante.',
          'Olvidar que la bisagra del portón no es un conductor de protección.',
        ],
        feito: 'Inspección visual registrada.',
        acao: 'Concluir inspección visual',
        norma: 'NBR 16274 · NBR 16690',
      },
      'fv-continuidade': {
        titulo: 'Continuidad de la equipotencialización',
        descricao: `Con el miliohmímetro, compense las puntas y mida desde la BEP del skid hasta cada masa: las ${USINA.mesas} mesas, los inversores, el transformador, la subestación, el portón y el cerco.`,
        detalhes: [
          'Pinza fija en la BEP del skid; terminal remoto en cada punto',
          'Función de baja resistencia con corriente ≥ 200 mA',
          'Criterio adoptado: ≤ 0,5 Ω conforme · 0,5–1,0 Ω atención · > 1,0 Ω u OL no conforme',
          `Mida los ${nCont} puntos para concluir la etapa`,
        ],
        cuidados: ['Ensayo con el sistema desenergizado y bloqueado; no desconecte conductores de protección en servicio.'],
        feito: 'Continuidad medida en todos los puntos.',
        acao: 'Concluir continuidad',
        norma: 'NBR 16274 · ensayo de continuidad',
      },
      'fv-resistencia': {
        titulo: 'Resistencia de la malla: caída de potencial',
        descricao:
          'Conecte E en la cámara de inspección junto al portón y lleve las estacas por el camino. Elija la distancia de la estaca C, registre P al 52 %, 62 % y 72 % y verifique la meseta.',
        detalhes: [
          'Malla grande: con la estaca C cerca, la curva no forma meseta y la lectura al 62 % engaña',
          `Distancia de referencia: ≥ 5× la diagonal de la malla (≈ ${cLonge} m aquí)`,
          'Registrar P al 52 %, 62 % y 72 %: meseta estable si varía ≤ 10 %',
          'Estacas en suelo natural, en línea, lejos de cercos y cables enterrados',
        ],
        cuidados: ['Tensión de paso junto a las estacas durante la inyección: señalice el recorrido de los cables.'],
        feito: 'Curva levantada y meseta evaluada.',
        acao: 'Concluir medición de la malla',
        norma: 'NBR 15749 · caída de potencial',
      },
      'fv-toque-passo': {
        titulo: 'Tensiones de contacto y de paso',
        descricao:
          'Inyecte corriente en la malla y mida, con electrodos de pie y el resistor que representa el cuerpo, la tensión de contacto y de paso en los puntos críticos. Extrapole a la corriente de falla y compare con el límite.',
        detalhes: [
          'Puntos: cuba del transformador, puerta del TGBT, mesa, portón (lado externo), base del transformador y perímetro',
          'Lectura con la corriente de ensayo → extrapolada a la corriente de falla que circula por la malla',
          'El límite soportable depende de la resistividad de la superficie: la grava aumenta el límite',
          `Mida los ${nTP} puntos para concluir la etapa`,
        ],
        cuidados: ['Solo el equipo de ensayo en el área durante la inyección.'],
        feito: 'Contacto y paso evaluados.',
        acao: 'Concluir contacto y paso',
        norma: 'NBR 15749 (medición) · NBR 15751 (límites)',
      },
      'fv-laudo': {
        titulo: 'Informe de la puesta a tierra de la planta',
        descricao:
          'Consolide los tres ensayos: puntos de continuidad aprobados, resistencia de la malla con meseta y tensiones de contacto/paso. Los hallazgos exigen corrección y un nuevo ensayo.',
        detalhes: [
          'Registrar instrumento, fecha, clima y resistividad del suelo',
          'La resistencia de la malla solo vale con meseta estable',
          'Correcciones: trenza flexible, arandela dentada, grava, refuerzo de la malla',
        ],
        feito: 'Informe emitido.',
        acao: 'Emitir informe',
        norma: 'NBR 16274 · NBR 15749',
      },
    },
  },
}

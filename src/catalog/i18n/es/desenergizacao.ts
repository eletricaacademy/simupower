import type { TraducaoEnsaio } from '../localizar'

/**
 * Catálogo do ensaio `desenergizacao-subestacao` em espanhol, por id de passo.
 *
 * A sequência continua a da NR-10 (10.5 / 10.6), na mesma ordem e com os mesmos
 * passos; só o vocabulário segue as "cinco reglas de oro" usuais na América do
 * Sul (corte efectivo, bloqueo, verificación de ausencia de tensión, puesta a
 * tierra y en cortocircuito, señalización), mais a proteção das partes vivas.
 */
export const ES_DESENERGIZACAO: Record<string, TraducaoEnsaio> = {
  'desenergizacao-subestacao': {
    nome: 'Procedimiento de desenergización',
    norma: 'NR-10 · 10.5 / 10.6',
    steps: {
      'des-apr': {
        titulo: 'Planificación y EPP',
        descricao: 'Antes de todo: análisis de riesgos, permiso de trabajo y equipos de protección.',
        detalhes: [
          'Análisis de riesgos (ATS) / Permiso de Trabajo (PT) emitido',
          'EPP: ropa ignífuga (FR), guantes aislantes + protectores de cuero, casco con visor',
          'EPC: detector de tensión, equipo de puesta a tierra, candados/tarjetas (LOTO)',
          'Delimitación y control de acceso al área',
        ],
        cuidados: [
          'Confirme la tensión y el esquema (unifilar) del circuito antes de comenzar.',
          'Inspeccione los EPP: guantes aislantes ensayados y sin perforaciones.',
          'Defina el responsable de la llave de bloqueo.',
        ],
        erros: [
          'Comenzar sin PT/ATS firmado.',
          'Usar guantes aislantes vencidos o sin protector de cuero.',
          'No delimitar la zona de trabajo.',
        ],
        feito: 'Planificación confirmada. EPP/EPC listos para comenzar.',
        acao: 'Confirmar planificación',
        norma: 'NR-10',
      },
      'des-seccionar': {
        titulo: '1. Corte efectivo (seccionamiento)',
        descricao: 'Abra el circuito en el interruptor y en el seccionador, creando una apertura comprobable.',
        detalhes: [
          'Abrir el interruptor',
          'Abrir el seccionador (corte visible)',
          'Confirmar la indicación de abierto',
        ],
        cuidados: [
          'Opere en la secuencia correcta: primero el interruptor (bajo carga), después el seccionador.',
          'Confirme la apertura por la señalización (rojo→verde) y, si es posible, visualmente.',
        ],
        erros: [
          'Abrir el seccionador bajo carga (riesgo de arco).',
          'Confiar solo en la botonera sin confirmar la posición real.',
        ],
        feito: 'Interruptor y seccionador abiertos — circuito seccionado (luz verde).',
        acao: 'Seccionar circuito',
      },
      'des-bloquear': {
        titulo: '2. Bloqueo contra la reenergización',
        descricao: 'Bloquee el dispositivo (LOTO) e instale una tarjeta de advertencia.',
        detalhes: [
          'Candado/dispositivo LOTO en la manija',
          'Tarjeta con nombre/fecha/responsable',
          'Llave bajo control del ejecutante',
        ],
        cuidados: [
          'Use un dispositivo de bloqueo (LOTO) que impida físicamente la maniobra.',
          'Cada trabajador debe tener su propio candado (bloqueo múltiple, si corresponde).',
          'La llave del candado queda con quien ejecuta el trabajo.',
        ],
        erros: [
          'Solo etiquetar sin poner candado.',
          'Dejar la llave del candado en el tablero.',
          'Bloqueo que no impide la maniobra.',
        ],
        feito: 'Dispositivo LOTO instalado y etiquetado — reenergización impedida.',
        acao: 'Aplicar bloqueo',
      },
      'des-testar': {
        titulo: '3. Verificación de ausencia de tensión',
        descricao: 'Pruebe con el detector de tensión (técnica vivo–muerto–vivo) en todas las fases.',
        detalhes: [
          'Probar el detector en una fuente energizada',
          'Probar el circuito (debe indicar ausencia)',
          'Volver a confirmar el detector en la fuente',
        ],
        cuidados: [
          'Detector adecuado a la tensión (MT) y con la calibración vigente.',
          'Prueba vivo–muerto–vivo: compruebe que el detector funciona antes y después.',
          'Verifique TODAS las fases.',
        ],
        erros: [
          'No hacer la prueba vivo–muerto–vivo (el detector puede estar defectuoso).',
          'Probar solo una fase.',
          'Usar un detector de BT en MT.',
        ],
        feito: 'Ausencia de tensión confirmada en las tres fases.',
        acao: 'Verificar tensión',
      },
      'des-aterrar': {
        titulo: '4. Puesta a tierra temporal y en cortocircuito',
        descricao: 'Instale el equipo de puesta a tierra temporal, con las fases en cortocircuito y equipotencializadas.',
        detalhes: [
          'Conectar PRIMERO a tierra/malla',
          'Después a los conductores (todas las fases)',
          'Equipotencializar la zona de trabajo',
        ],
        cuidados: [
          'Orden de conexión: primero la tierra, después los conductores.',
          'Equipo de puesta a tierra con sección adecuada a la corriente de cortocircuito.',
          'Ponga a tierra a ambos lados del punto de trabajo, si hay alimentación por ambos.',
        ],
        erros: [
          'Conectar a los conductores antes que a tierra.',
          'Cable de puesta a tierra subdimensionado.',
          'Olvidar una de las fases.',
        ],
        feito: 'Fases puestas a tierra y equipotencializadas.',
        acao: 'Instalar puesta a tierra',
      },
      'des-proteger': {
        titulo: '5. Protección de las partes energizadas',
        descricao: 'Aísle o coloque barreras en las partes energizadas cercanas dentro de la zona controlada.',
        detalhes: [
          'Mantas/cubiertas aislantes',
          'Barreras físicas',
          'Demarcar las partes que siguen energizadas',
        ],
        cuidados: [
          'Identifique lo que sigue energizado alrededor.',
          'Use cubiertas aislantes adecuadas a la tensión.',
          'Mantenga las distancias de seguridad (zona controlada/de riesgo).',
        ],
        erros: [
          'Ignorar circuitos adyacentes aún energizados.',
          'Barrera que no soporta la tensión.',
        ],
        feito: 'Partes energizadas cercanas protegidas y demarcadas.',
        acao: 'Proteger partes energizadas',
      },
      'des-sinalizar': {
        titulo: '6. Señalización',
        descricao: 'Instale la señalización que impide la reenergización.',
        detalhes: [
          'Cartel "PROHIBIDO MANIOBRAR"',
          'Señalización en el mando y en el lugar de trabajo',
          'Identificar el circuito',
        ],
        cuidados: [
          'Señalice tanto en el punto de maniobra como en el lugar de trabajo.',
          'La señalización debe ser visible y clara.',
        ],
        erros: [
          'Señalizar en un solo punto.',
          'Cartel sin identificación del responsable/circuito.',
        ],
        feito: 'Señalización instalada: "PROHIBIDO MANIOBRAR".',
        acao: 'Señalizar',
      },
      'des-liberado': {
        titulo: 'Liberado para el trabajo',
        descricao: 'Secuencia completa: instalación desenergizada conforme a la NR-10. Trabajo autorizado.',
        detalhes: ['Las 6 etapas concluidas', 'Estado de seguridad confirmado'],
        cuidados: ['Vuelva a verificar el estado de seguridad antes de liberar al equipo.'],
        feito: 'Instalación desenergizada y segura — puede iniciar el mantenimiento.',
        acao: 'Confirmar liberación',
      },
      'reen-conferir': {
        titulo: 'Fin del trabajo — verificación',
        descricao: 'Confirme el término del trabajo, el retiro de herramientas y el alejamiento de las personas.',
        detalhes: [
          'Personas fuera de la zona de riesgo',
          'Herramientas/materiales retirados',
          'Equipo informado de la reenergización',
        ],
        cuidados: ['Cuente al equipo y confirme que nadie está en contacto con el circuito.'],
        erros: ['Reconectar con personas/herramientas todavía en la instalación.'],
        feito: 'Equipo, herramientas y área verificados.',
        acao: 'Confirmar verificación',
      },
      'reen-rem-sinalizar': {
        titulo: 'Retirar la señalización',
        descricao: 'Retire la señalización de bloqueo.',
        feito: 'Señalización retirada.',
        acao: 'Retirar señalización',
      },
      'reen-rem-proteger': {
        titulo: 'Retirar las protecciones',
        descricao: 'Retire las barreras y cubiertas aislantes.',
        feito: 'Protecciones retiradas.',
        acao: 'Retirar protecciones',
      },
      'reen-rem-aterrar': {
        titulo: 'Retirar la puesta a tierra',
        descricao: 'Retire la puesta a tierra temporal (primero de los conductores, después de tierra).',
        detalhes: ['Retirar PRIMERO de los conductores', 'Después de tierra/malla'],
        cuidados: ['Orden inverso al de la instalación: primero los conductores, la tierra al final.'],
        erros: ['Retirar la tierra antes que los conductores.'],
        feito: 'Puesta a tierra temporal retirada.',
        acao: 'Retirar puesta a tierra',
      },
      'reen-rem-bloquear': {
        titulo: 'Retirar el bloqueo',
        descricao: 'Retire el candado y la tarjeta del dispositivo de maniobra.',
        cuidados: ['Solo el responsable del bloqueo lo retira.'],
        feito: 'Bloqueo (LOTO) retirado.',
        acao: 'Retirar bloqueo',
      },
      'reen-carregar-mola': {
        titulo: 'Cargar el resorte del interruptor',
        descricao: 'Cargue el resorte de accionamiento antes del cierre del interruptor.',
        detalhes: [
          'Accionar la manivela/motor de carga del resorte',
          'Esperar la indicación "resorte cargado"',
        ],
        cuidados: ['Confirme que el resorte esté totalmente cargado antes de cerrar.'],
        erros: ['Intentar cerrar con el resorte descargado.'],
        feito: 'Resorte cargado — interruptor listo para cerrar.',
        acao: 'Cargar resorte',
      },
      'reen-religar': {
        titulo: 'Reconectar',
        descricao: 'Cierre el seccionador y el interruptor, reenergizando el circuito.',
        detalhes: ['Cerrar el seccionador', 'Cerrar el interruptor', 'Confirmar la energización'],
        cuidados: ['Avise al equipo antes de reconectar. Nadie en contacto con el circuito.'],
        erros: ['Reconectar sin aviso previo.', 'Cerrar sin el resorte cargado.'],
        feito: 'Seccionador e interruptor cerrados — circuito reenergizado (luz roja).',
        acao: 'Cerrar interruptor',
      },
      'reen-energizada': {
        titulo: 'Subestación reenergizada',
        descricao: 'Circuito reenergizado y en operación. Procedimiento concluido.',
        feito: 'Subestación reenergizada y en operación.',
        acao: 'Concluir',
      },
    },
  },
}

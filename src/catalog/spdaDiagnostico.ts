import type { Vec3, Vista } from './types'

export type TipoParadaDiagnostico = 'nao-conformidade' | 'verificacao'

export interface ParadaDiagnosticoSPDA {
  id: string
  titulo: string
  local: string
  tipo: TipoParadaDiagnostico
  imagem: string
  alt: string
  pergunta: string
  diagnostico: string
  risco: string
  acao: string
  referencia: string
  ancora: Vec3
  vista: Vista
}

/**
 * Evidências reais fornecidas pelo Pablo e posicionadas no prédio do módulo 7.
 * As fotos apoiam o diagnóstico visual; não substituem medição nem laudo.
 *
 * ⚠ REVISAR COM O PABLO: confirmar os itens exatos da NBR 5419:2026 antes de
 * publicar material didático externo. Aqui a referência permanece por assunto.
 */
export const SPDA_DIAGNOSTICOS: ParadaDiagnosticoSPDA[] = [
  {
    id: 'conexao-bimetalica',
    titulo: 'Contato direto Cu-Al',
    local: 'Caixa de inspeção D4',
    tipo: 'nao-conformidade',
    imagem: '/images/diagnostico-spda/conexao-bimetalica-ausente.jpeg',
    alt: 'Caixa de inspeção aberta com condutores de cobre e alumínio sem conector bimetálico',
    pergunta: 'O que está errado nesta conexão entre materiais diferentes?',
    diagnostico: 'Cobre e alumínio foram deixados em contato direto, sem conector bimetálico adequado.',
    risco: 'O par galvânico favorece corrosão, aumenta a resistência de contato e pode comprometer a continuidade do SPDA.',
    acao: 'Refazer a união com componente compatível e protegido contra corrosão; limpar, apertar e verificar a continuidade depois da correção.',
    referencia: 'ABNT NBR 5419-3:2026 — compatibilidade de materiais e proteção contra corrosão.',
    ancora: [-6.3, 0.75, 4.38],
    vista: { pos: [-9.2, 2.2, 7.1], target: [-6.3, 0.75, 4.3] },
  },
  {
    id: 'dps-inoperante',
    titulo: 'DPS sem funcionar',
    local: 'QGBT da sala elétrica',
    tipo: 'nao-conformidade',
    imagem: '/images/diagnostico-spda/dps-inoperante.jpg',
    alt: 'Quadro elétrico com dispositivos de proteção contra surtos sem funcionamento',
    pergunta: 'Qual condição precisa ser identificada antes de considerar a proteção contra surtos operacional?',
    diagnostico: 'Os DPS estão sem funcionamento e não podem ser considerados proteção ativa da instalação.',
    risco: 'Equipamentos internos ficam sem a proteção prevista contra sobretensões conduzidas, inclusive as associadas a descargas atmosféricas.',
    acao: 'Substituir os DPS, verificar proteção de retaguarda, conexões, coordenação e registrar a inspeção do conjunto.',
    referencia: 'ABNT NBR 5419-4:2026 — medidas de proteção contra surtos; verificar também a aplicação da NBR 5410.',
    ancora: [-2.6, 1.7, 0.35],
    vista: { pos: [-3.7, 1.8, -3.4], target: [-2.6, 1.55, 0.25] },
  },
  {
    id: 'distancia-seguranca',
    titulo: 'Distância insuficiente',
    local: 'Descida D2 — fachada norte/leste',
    tipo: 'nao-conformidade',
    imagem: '/images/diagnostico-spda/distancia-seguranca.jpg',
    alt: 'Condutores e infraestrutura instalados muito próximos de uma descida do SPDA',
    pergunta: 'O que deve ser verificado quando outras instalações passam junto da descida?',
    diagnostico: 'Condutores e infraestruturas estão próximos da descida, com distância inferior à distância de segurança aplicável.',
    risco: 'A proximidade pode permitir centelhamento perigoso e transferir parte da corrente do raio para instalações internas.',
    acao: 'Calcular a distância de segurança para o caso, afastar as instalações ou aplicar a medida de equipotencialização/isolação tecnicamente prevista.',
    referencia: 'ABNT NBR 5419-3:2026 — isolamento elétrico e distância de segurança.',
    ancora: [6.3, 4.4, -4.28],
    vista: { pos: [9.4, 5.3, -7.4], target: [6.3, 4.4, -4.25] },
  },
  {
    id: 'continuidade-cobertura',
    titulo: 'Ensaio na cobertura',
    local: 'Anel de captação',
    tipo: 'verificacao',
    imagem: '/images/diagnostico-spda/ensaio-continuidade-cobertura.jpg',
    alt: 'Ensaio de continuidade elétrica sendo executado em cobertura metálica',
    pergunta: 'O que esta foto comprova e o que ainda precisa ser registrado?',
    diagnostico: 'A imagem documenta a execução de um ensaio de continuidade na cobertura; ela não demonstra, sozinha, que o resultado foi conforme.',
    risco: 'Sem identificar os pontos, o método, o instrumento e as leituras, a fotografia isolada não sustenta o parecer técnico.',
    acao: 'Registrar pontos ensaiados, preparação, instrumento, corrente de ensaio, leituras, critério aplicável e conclusão no relatório.',
    referencia: 'ABNT NBR 5419-3:2026 — verificação da continuidade e documentação da inspeção.',
    ancora: [0, 9.35, -4.28],
    vista: { pos: [10.5, 13.2, -10.8], target: [0, 9.3, -4.25] },
  },
]

export function getDiagnosticoSPDA(id: string | null) {
  return SPDA_DIAGNOSTICOS.find((item) => item.id === id)
}

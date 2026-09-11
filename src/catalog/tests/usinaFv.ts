import type { TestProcedure } from '../types'
import {
  VISTAS_FV,
  USINA,
  MODULOS_TOTAL,
  POTENCIA_DC_KWP,
  PONTOS_CONTINUIDADE_FV,
  PONTOS_TOQUE_PASSO_FV,
  DISTANCIAS_C_M,
} from '../usinaFvPontos'

// textos derivados dos dados: mudar a planta não deixa o procedimento desatualizado
const kwp = POTENCIA_DC_KWP.toFixed(1).replace('.', ',')
const nCont = PONTOS_CONTINUIDADE_FV.length
const nTP = PONTOS_TOQUE_PASSO_FV.length
const cLonge = DISTANCIAS_C_M[DISTANCIAS_C_M.length - 1]

/**
 * ATERRAMENTO EM USINA FOTOVOLTAICA DE SOLO (100 kW) — três ensaios na ordem
 * de campo: continuidade da equipotencialização, resistência da malha pela
 * queda de potencial e tensões de toque/passo, fechando num laudo único.
 *
 * Navegação manual (padrão dos módulos guiados); as travas de cada etapa ficam
 * no HUD (`ui/UsinaFvHud.tsx`) e os dados em `catalog/usinaFvPontos.ts`.
 *
 * ⚠ REVISAR COM O PABLO: edições vigentes e itens exatos da NBR 16690, NBR 16274,
 * NBR 15749 e NBR 15751 citados nos passos. As `vista`s são do placeholder
 * procedural — CALIBRAR (CODEX) quando o GLB entrar.
 */
export const usinaFvProcedure: TestProcedure = {
  id: 'aterramento-usina-fv',
  nome: 'Aterramento em Usina Fotovoltaica',
  norma: 'NBR 16690 · NBR 16274 · NBR 15749 · NBR 15751',
  instrumento: 'terrometro',
  engineRef: 'usina-fv',
  modo: 'usina-fv',
  tensoes: [],
  tensaoPadrao: 0,
  duracaoS: 0,
  steps: [
    {
      id: 'fv-seguranca',
      titulo: 'Segurança e condições do ensaio',
      descricao:
        'Faça a APR da usina: o arranjo gera tensão CC sempre que há luz, e a malha pode receber potencial de uma falta na rede. Confira clima, bloqueios e acessos.',
      detalhes: [
        `Usina de solo: ${MODULOS_TOTAL} módulos de ${USINA.moduloWp} Wp (${kwp} kWp), ${USINA.mesas} mesas, skid com ${USINA.inversores} inversores de ${USINA.inversorKw} kW`,
        `Transformador elevador ${String(USINA.trafoKva).replace('.', ',')} kVA ${USINA.tensaoBtV} V / ${String(USINA.tensaoMtKv).replace('.', ',')} kV e cabine de medição e proteção`,
        'Inversores desligados e seccionadoras CC/CA abertas e bloqueadas (NR-10)',
        'NÃO ensaiar com tempestade: descarga próxima eleva o potencial da malha e das estacas',
        'Luvas isolantes para as garras e cabos longos da queda de potencial',
      ],
      cuidados: [
        'Abrir a seccionadora não zera a tensão dos módulos: o lado CC continua energizado sob luz.',
        'Durante a injeção de corrente, ninguém toca nas estacas nem nos cabos de ensaio.',
      ],
      feito: 'APR e bloqueios concluídos.',
      acao: 'Confirmar preparação',
      acaoTipo: 'confirmar',
      norma: 'NR-10 · NBR 16690',
      vista: VISTAS_FV.geral,
    },
    {
      id: 'fv-visual',
      titulo: 'Inspeção visual do aterramento',
      descricao:
        'Percorra a planta antes de medir: derivações das mesas à malha, jumpers entre perfis, cerca e portão, skid, transformador e subestação.',
      detalhes: [
        'Mesas: grampo com arruela serrilhada (perfura a anodização) e derivação à malha',
        'Cerca: mourões aterrados e cordoalha flexível na folha do portão',
        'Skid e trafo: PE dos inversores, tanque e neutro ligados à malha; brita íntegra',
        'Caixas de inspeção acessíveis; malha da SE interligada à da usina',
        'Use “Mostrar malha enterrada” para ver o anel, as transversais e as hastes',
      ],
      erros: [
        'Confiar no contato mecânico entre perfis anodizados — a anodização é isolante.',
        'Esquecer que a dobradiça do portão não é condutor de proteção.',
      ],
      feito: 'Inspeção visual registrada.',
      acao: 'Concluir inspeção visual',
      acaoTipo: 'confirmar',
      requer: ['fv-seguranca'],
      norma: 'NBR 16274 · NBR 16690',
      vista: VISTAS_FV.planta,
    },
    {
      id: 'fv-continuidade',
      titulo: 'Continuidade da equipotencialização',
      descricao:
        `Com o miliohmímetro, compense as pontas e meça do BEP do skid até cada massa: as ${USINA.mesas} mesas, os inversores, o trafo, a SE, o portão e a cerca.`,
      detalhes: [
        'Garra fixa no BEP do skid; terminal remoto em cada ponto',
        'Função de baixa resistência com corrente ≥ 200 mA',
        'Critério adotado: ≤ 0,5 Ω conforme · 0,5–1,0 Ω atenção · > 1,0 Ω ou OL não conforme',
        `Meça os ${nCont} pontos para concluir a etapa`,
      ],
      cuidados: ['Ensaio com o sistema desenergizado e bloqueado; não desconectar condutores de proteção em serviço.'],
      feito: 'Continuidade medida em todos os pontos.',
      acao: 'Concluir continuidade',
      acaoTipo: 'confirmar',
      requer: ['fv-visual'],
      norma: 'NBR 16274 · ensaio de continuidade',
      vista: VISTAS_FV.skid,
    },
    {
      id: 'fv-resistencia',
      titulo: 'Resistência da malha — queda de potencial',
      descricao:
        'Conecte E na caixa de inspeção junto ao portão e leve as estacas pela estrada. Escolha a distância da estaca C, registre P a 52 %, 62 % e 72 % e confira o patamar.',
      detalhes: [
        'Malha grande: com a estaca C perto, a curva não forma patamar e a leitura a 62 % engana',
        `Distância de referência: ≥ 5× a diagonal da malha (≈ ${cLonge} m aqui)`,
        'Registrar P em 52 %, 62 % e 72 % — patamar estável se variar ≤ 10 %',
        'Estacas em solo natural, em linha, longe de cercas e cabos enterrados',
      ],
      cuidados: ['Tensão de passo junto às estacas durante a injeção: sinalize o trajeto dos cabos.'],
      feito: 'Curva levantada e patamar avaliado.',
      acao: 'Concluir medição da malha',
      acaoTipo: 'confirmar',
      requer: ['fv-continuidade'],
      norma: 'NBR 15749 · queda de potencial',
      vista: VISTAS_FV.estacas,
    },
    {
      id: 'fv-toque-passo',
      titulo: 'Tensões de toque e de passo',
      descricao:
        'Injete corrente na malha e meça, com eletrodos de pé e o resistor que representa o corpo, a tensão de toque e de passo nos pontos críticos. Extrapole para a corrente de falta e compare com o limite.',
      detalhes: [
        'Pontos: tanque do trafo, porta do QGBT, mesa, portão (lado externo), base do trafo e perímetro',
        'Leitura na corrente de ensaio → extrapolada para a corrente de falta que escoa pela malha',
        'Limite suportável depende da resistividade da superfície: a brita aumenta o limite',
        `Meça os ${nTP} pontos para concluir a etapa`,
      ],
      cuidados: ['Somente a equipe de ensaio na área durante a injeção.'],
      feito: 'Toque e passo avaliados.',
      acao: 'Concluir toque e passo',
      acaoTipo: 'confirmar',
      requer: ['fv-resistencia'],
      norma: 'NBR 15749 (medição) · NBR 15751 (limites)',
      vista: VISTAS_FV.trafo,
    },
    {
      id: 'fv-laudo',
      titulo: 'Laudo do aterramento da usina',
      descricao:
        'Consolide os três ensaios: pontos de continuidade aprovados, resistência da malha com patamar e tensões de toque/passo. Achados exigem correção e novo ensaio.',
      detalhes: [
        'Registrar instrumento, data, clima e resistividade do solo',
        'Resistência da malha só vale com patamar estável',
        'Correções: cordoalha, arruela serrilhada, brita, reforço da malha',
      ],
      feito: 'Laudo emitido.',
      acao: 'Emitir laudo',
      acaoTipo: 'confirmar',
      requer: ['fv-toque-passo'],
      norma: 'NBR 16274 · NBR 15749',
      vista: VISTAS_FV.geral,
    },
  ],
}

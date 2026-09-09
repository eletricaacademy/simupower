# SPDA natural/estrutural — galpão industrial

## Contrato Claude × Codex — 09/09/2026

Autorizado por Pablo: novo módulo separado do SPDA convencional, com ferragens,
Aterrinsert e galpão industrial. Usar sempre ABNT NBR 5419:2026, parte 3 para os
ensaios de continuidade; conferir correções da edição. Não transpor limites ou
procedimentos de 2005/2015 apenas substituindo o ano.

## Referências

- Vídeo visual: https://www.youtube.com/watch?v=O_flIvGlVLY — frames observados:
  gaiolas de armadura, barras verticais e horizontais de continuidade e conexões.
  A abertura cita NBR 5419/2005; não é a fonte normativa deste módulo.
- Fabricante: https://tel.com.br/product/aterrinsert/ — acesso às ferragens/Rebar,
  ensaios sem escarificar concreto e ligação à equipotencialização; TEL-656 com
  disco externo e rosca M12. Aterrinsert é conector de acesso, não eletrodo isolado.
- Catálogo oficial: https://www.abntcatalogo.com.br/ — edição 2026 e versão corrigida.

## Escopo

- Galpão com pilares de concreto armado, vigas, fundações e cobertura industrial.
- Duas apresentações iniciais: ferragens expostas e galpão pronto; modo de revelar
  estrutura interna para visualizar o caminho elétrico.
- Contatos procedurais derivados da mesma geometria que desenha os conectores.
- Conexão direta nas ferragens na obra e nos Aterrinsert no galpão pronto.
- Reaproveitar Inbrat, dois cabos PP P1/C1 e P2/C2, uma garra em cada extremidade.
- Medições entre pilares, vertical no pilar e ligação ao BEP, com topologia própria;
  não assumir seccionamentos ou copiar o anel do módulo convencional.
- Mudanças mínimas em catálogo, HUD e estado necessárias ao novo módulo estão
  autorizadas pelo pedido de implementação. Um agente por arquivo.

## Pendente para validação normativa

Solicitado ao Pablo o caminho do PDF ABNT NBR 5419-3:2026 ou trechos de ensaios.
⚠ REVISAR COM O PABLO: corrente do ensaio, método, sequência, limites e critérios
específicos de cada verificação. Não emitir conformidade normativa sem validação.
O desenvolvimento visual pode prosseguir independentemente dessa confirmação.

## Primeira implementação

- Catálogo `estruturalPontos.ts` orienta galpão procedural de 16 × 24 m, oito pilares
  de 7 m e cumeeira de 9 m; cenas e contatos derivam dessas dimensões.
- `EstruturalElements.tsx`: ferragens expostas, obra pronta, transparência,
  Aterrinsert com disco/pino de acesso, BEP/QGBT internos e pares exploráveis.
- Inbrat aceita conexão visual externa sem ler resultados do SPDA convencional.
  O visor permanece sem leitura: nenhum cálculo ou veredito normativo inventado.
- Store e HUD próprios; catálogo, menu, App e Stage roteiam o novo módulo.
- Pendentes: geometria final das fundações enterradas, conectores internos de
  continuidade, calibração sobre futuro GLB, topologia elétrica, corrente animada,
  engine/testes normativos, etapas guiadas e relatório. A versão atual é um
  ambiente em desenvolvimento, identificado assim na interface.

Validação desta etapa: build aprovado, 75 testes existentes aprovados, inspeção
desktop do galpão pronto, garra no Aterrinsert e transparência. Mobile 390 × 844
conferido com painel rolável e minimizável; viewport restaurado após o teste.

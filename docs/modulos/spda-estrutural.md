# SPDA natural/estrutural — galpão industrial

### Execução rápida opcional — Codex, 11/09/2026

Autorizado pelo Pablo: após confirmar preparação, o botão “Executar todos os
testes da etapa” seleciona cada par, conecta as garras, mede as oito cruzadas e a
comprobatória e abre a conclusão do relatório. Preserva fase e defeito escolhidos,
sem modificar engine ou critérios. Mudanças fora da área exclusiva em
`ui/EstruturalHud.tsx` e novo `sim/testesEmLote.ts`. Navegador confirmou 9/9 e
conclusão; build e 136 testes aprovados, incluindo equivalência manual/lote.
Sem deploy.

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

## Fonte normativa recebida e aplicada — 09/09/2026

Pablo forneceu as quatro partes em:
`G:\Outros computadores\Nitro e LOQ Pablo 2026\1- PABLO Backup\01- ONLINE\01 -Cursos\7-SPDA\Curso Novo 2026\NBR 5419 2026\`.
Lida a Parte 3, `NBR_5419_3_2026.pdf`, segunda edição de 10/03/2026, 97 páginas
do PDF (87 numeradas). Texto e imagens do Anexo F conferidos. O PDF original não
foi alterado nem incorporado ao repositório; extrações ficam em `.sim-shots/` ignorada.
As demais partes foram indicadas pelo usuário, mas não foram auditadas nesta etapa.

Critérios aplicados, em paráfrase:

- F.1, páginas impressas 77–79: conjunto pilar/fundação em concreto moldado no
  local; cruzadas topo–base de pilares diferentes. Cobrir todos os topos e as bases
  selecionadas, incluindo a base de ligação ao BEP. Limite inclusivo de 1 Ω.
- F.1.3: quatro terminais; corrente entre 1 e 5 A, com CC permitida. Usamos 1 A CC
  simulada. P1/P2 medem potencial; resistência dos cabos não é somada ao resultado
  Kelvin ideal. O visual Inbrat não certifica ou emula faixas específicas do firmware.
- F.1.2.2: acompanhamento documentado da construção pode dispensar a primeira
  verificação. No modo obra as medições são demonstrativas, explicitadas na UI.
- F.2, páginas 79–80: verificação vertical de pilar é outra aplicação; pré-moldados
  não são tratados como conjunto F.1. Não incluímos F.2 como aprovação deste galpão.
- F.3, páginas 80–81: fundação isolada requer ausência de caminhos pelos demais
  elementos. Não é aplicável à rede interligada do cenário, portanto não oferecida.
- F.4.4, página 82: comprobatória entre captação e BEP, limite inclusivo de 0,2 Ω.
  A etapa representa conclusão da instalação; não automatiza condições periódicas.

## Ensaios implementados

### Aterrinsert externo - 09/09/2026

- No galpão pronto, os Aterrinserts ficam na face externa dos pilares, acessíveis
  para inspeção e conexão das garras sem entrar na edificação.
- No modo obra, o contato permanece diretamente na ferragem exposta. O percurso
  interno entre a armadura e o conector foi preservado, sem alterar a topologia
  ou os valores elétricos do ensaio.

Validação automatizada: 86 testes aprovados, incluindo solução série/paralelo,
conservação de corrente, limites inclusivos, cobertura de pontos, defeitos,
travas de preparação/relatório e cabo PP acima do solo. Build aprovado.
No navegador: nove leituras concluídas e relatório consolidado no cenário íntegro;
conferidos primeira verificação, comprobatória no BEP, setas e cabo físico com
fluxo oculto. A primeira leitura exibiu 0,020 Ω e a comprobatória 0,025 Ω.
São resultados do modelo didático. O painel mobile da versão visual foi conferido
anteriormente; esta rodada completa dos ensaios foi exercitada no desktop.

- Oito cruzadas F.1, uma por topo, mais uma captação–BEP F.4. Nove registros.
- Bases P1, P5, P8 e P4 a cada 20 m no perímetro de 80 m; BEP ligado à base P4.
  Coordenadas dos pilares e vigas atualizadas juntas. Os oito pilares incluem quinas.
- Engine nodal pura resolve resistências em paralelo e sentido da corrente em cada
  ramo. Parâmetros de aço/seção equivalente/contato são didáticos, não dados medidos
  de obra ou valores normativos de dimensionamento. As garras usam os contatos da cena.
- Defeitos didáticos: contato superior P1 deteriorado e ligação BEP deteriorada.
- Preparação, conexão, leitura, corrente animada e relatório CSV com referência por
  trecho. Não confundir resultado dos ensaios simulados com conformidade global do SPDA.
- A ligação da captação é acrescentada na comprobatória; não participa como caminho
  paralelo da primeira verificação. Fluxo reutiliza a rede calculada e os cabos PP.
- Correção adicional solicitada por Pablo: interpolação do PP não ultrapassa a
  altura dos apoios. A capa não afunda antes das subidas; setas seguem a mesma curva.
- Mudanças autorizadas em engine/store/HUD/catálogo registradas neste contrato;
  módulo convencional preservado. Sua revisão técnica para 2026 é tarefa separada:
  F.5–F.7 não autorizam assumir indiscriminadamente 0,2 Ω/1 Ω para cabos não naturais.

## Histórico — primeira implementação visual (superado pelos ensaios acima)

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

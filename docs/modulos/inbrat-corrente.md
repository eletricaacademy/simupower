# Inbrat — identificação dos terminais e fluxo didático

Revisão Codex, 11/09/2026, solicitada pelo Pablo para todos os ensaios com Inbrat.

Fonte primária: [manual INMD1 PRO, páginas 10 e 13](https://inbrat.com.br/wp-content/uploads/2026/06/Miliohmimetro-INMD1-PRO-Manual-Inbrat.pdf).
O manual identifica C1/C2 como vias vermelhas de corrente e P1/P2 como vias
pretas de medição. Uma garra Kelvin reúne P1/C1; a outra, P2/C2. Não confundir
cor da via com cor do punho da garra. A [ficha do fabricante](https://inbrat.com.br/produto/inmd1-pro-miliohmimetro-de-1-2a/)
informa corrente unidirecional; o manual consultado não declara C1 positivo
nem C2 negativo. Confirmar a polaridade com o fabricante antes de atribuí-la
ao equipamento físico. Não houve contato externo com o fabricante.

## Auditoria dos três usos

- `Inbrat.tsx`: vias de índice 0 = P (pretas), índice 1 = C (vermelhas).
  São dois cabos PP, cada um com uma garra Kelvin. Punho preto identifica
  P1/C1 na cena; punho vermelho identifica P2/C2, sem significado de polaridade.
- SPDA convencional: `SpdaFluxo.tsx` usa a via C de cada cabo. Setas saem
  de C1, atravessam a instalação e retornam por C2. P1/P2 não recebem fluxo.
- SPDA estrutural: `Inbrat.tsx` usa a mesma via C, com retorno invertido no
  segundo cabo; a rede estrutural adota a mesma origem/destino do par.
- FV: reutiliza o instrumento na continuidade, sem animação de corrente
  nos cabos dessa etapa. O fluxo das estacas no ensaio de queda de potencial
  pertence ao terrômetro e não foi alterado por esta revisão.

Mantido C1 → instalação → C2 como convenção didática explícita, sem inverter
setas com base apenas na cor dos punhos. Explicação compartilhada em
`ui/ConexoesInbrat.tsx`, disponível nos três HUDs. Nenhuma alteração de
engine, leituras, limites, store ou resultados calculados.

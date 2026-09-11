# SimuPower — contexto para agentes (Claude Code · Codex)

> **Este arquivo é a memória compartilhada dos dois agentes.** O Codex lê `AGENTS.md`
> automaticamente; o Claude Code lê `CLAUDE.md`, que importa este arquivo. Mudou uma
> convenção? Muda **aqui**, não em cópias.

Plataforma standalone de **ensaios elétricos virtuais em 3D** (PT-BR), para treinamento
em NR-10 / normas ABNT. Dono do produto: **Pablo** (Elétrica Academy).

## 1. Stack e comandos

Vite 5 + React 18 + TypeScript · three r0.169 + @react-three/fiber v8 + drei v9 +
postprocessing · zustand v4 · Tailwind v4 (`@theme`) · @fontsource · Vitest.

```
npm install      # PC novo (node_modules NÃO vai no zip: tem binários win-x64)
npm run dev      # dev server (5173)
npm run build    # typecheck + build  ← tem que passar antes de entregar
npm test         # vitest             ← tem que passar antes de entregar
```

## 2. Arquitetura (a regra de ouro)

```
engine pura e testada  →  catálogo orientado a dados  →  cena/HUD renderizam o par
   (src/engine)              (src/catalog)                (src/scene, src/ui)
```

- **`src/engine/*.ts`** — funções puras, sem React, sem three, **com `.test.ts`**. Toda
  a física/norma vive aqui.
- **`src/catalog/`** — `types.ts` (esquema) · `equipment/*` · `tests/*` (procedimentos com
  passos, textos, normas, vistas de câmera) · `index.ts` (`EQUIPAMENTOS`, `ENSAIOS`, `PAR_*`).
  **Conteúdo novo = dado novo, não código novo.**
- **`src/sim/`** — stores zustand. `store.ts` (`useSim`) é o estado geral (par ativo,
  passos, câmera, pick/calibração); cada módulo tem o seu (`aterStore`, `spdaStore`…).
- **`src/scene/`** — three/R3F. `Stage.tsx` escolhe a cena pelo `equipamento.cenario`.
- **`src/ui/`** — HUDs. `App.tsx` escolhe o HUD pelo `ensaio.modo`.

### Como nasce um módulo novo (receita completa)

1. `src/engine/<x>.ts` + `src/engine/<x>.test.ts` — física e vereditos.
2. `src/catalog/<x>Pontos.ts` (se o módulo tiver pontos/trechos de medição).
3. `src/catalog/tests/<x>.ts` — `TestProcedure` (passos, normas, `vista`s).
4. `src/catalog/equipment/<x>.ts` — `Equipment` (modelo, escala, `cenario`).
5. `src/catalog/types.ts` — acrescentar em `Cenario`, `EngineRef`, `ModoSim`.
6. `src/catalog/index.ts` — registrar nos mapas + exportar `PAR_<X>`.
7. `src/sim/<x>Store.ts` — estado do ensaio.
8. `src/ui/<X>Hud.tsx` — HUD (molde: `AterramentoHud.tsx` / `SpdaHud.tsx`).
9. `src/scene/<X>Elements.tsx` + ramo em `Stage.tsx`.
10. `App.tsx` (roteia o `modo`) e `ui/MainMenu.tsx` (card do módulo).
11. `ROADMAP.md` — documentar o módulo. **Sempre.**

## 3. Convenções que não se negociam

- **SPDA: usar sempre a série ABNT NBR 5419:2026 nos exemplos**, conforme decisão
  explícita do Pablo em 09/09/2026. Conferir a parte aplicável e suas correções.
  Vídeos e materiais de 2005/2015 servem como referência visual/histórica, nunca
  como prova dos critérios de 2026. Não apenas trocar o ano de regras antigas.

- **Tudo em PT-BR**: nomes, comentários, textos de UI. Comentários explicam *por quê*.
- **Nenhum hex solto**: cores vêm de `src/design/tokens.ts` (`color.accent`,
  `color.status.pass|marginal|fail`…).
- **Norma citada** em cada passo/veredito; quando o número não estiver 100% fechado na
  norma, marcar `⚠ REVISAR COM O PABLO` no comentário em vez de inventar.
- **Mundo 3D: 1 unidade ≈ 1 metro**, +Y para cima, base dos objetos em `y = 0`
  (exceção conhecida: pátio de aterramento com `ATER_GROUND_Y = 0.8`).
- **Calibração de pontos**: nunca chutar coordenada. Usar o `pickMode` (⚙ → Identificar
  ponto) e o capturador de pose da câmera do HUD; colar o valor no catálogo.
- HUD desktop **e** mobile (`MobileSheet`), sempre.
- Perfis de qualidade gráfica (`scene/quality.ts`) — cenas novas respeitam `cfg.tier`.

### Pipeline de assets (armadilha conhecida)

`gltf-transform optimize --compress quantize` **rotaciona/transforma o modelo** e quebra
malhas fundidas (`_(Loose_Entity)`) em sopa de triângulos. Bruto em `assets-raw/models/`,
otimizado em `public/models/`. Se o modelo estragar, **entregar o original** (foi a decisão
do Pablo para `quadro-eletrico.glb`). Draco/meshopt: o projeto evita de propósito.

## 4. Divisão de trabalho — CLAUDE × CODEX

Os dois agentes trabalham no mesmo repositório. Para não colidirem, a fronteira é **por
arquivo**, não por tarefa:

| Área | Dono | Arquivos |
|---|---|---|
| Física, normas, vereditos, testes | **Claude** | `src/engine/**` |
| Estado do ensaio | **Claude** | `src/sim/**` |
| HUD / painéis / laudos | **Claude** | `src/ui/**` |
| Dados do procedimento (passos, textos, critérios) | **Claude** | `src/catalog/tests/**`, campos "elétricos" de `src/catalog/*Pontos.ts` |
| **Ambiente 3D, modelos, materiais, luz da cena** | **Codex** | `src/scene/**`, `public/models/**`, `assets-raw/**` |
| **Coordenadas calibradas** (`pos`, `posOrigem`, `vista`, `escalaAlvo`, `modelPath`) | **Codex** | campos marcados `CALIBRAR (CODEX)` no catálogo |

**Regras de convivência:**

1. **Um agente por arquivo.** Precisou mexer fora da sua área? Faça o mínimo, avise no
   commit e registre no contrato do módulo (`docs/modulos/*.md`).
2. **A interface entre os dois é sempre um arquivo de dados** (`catalog/*Pontos.ts`), com
   um bloco de contrato no topo. Não renomear ids nem remover campos sem alinhar.
3. **O módulo tem que rodar sem o modelo 3D.** Cena nova nasce com placeholder procedural
   (`PREDIO_PROCEDURAL = true` em `scene/SpdaElements.tsx` é o exemplo). O Codex troca o
   placeholder pelo GLB depois, sem tocar na ferramenta.
4. **Antes de passar a bola**: `npm run build` e `npm test` limpos, e commit feito.
   Trocar de agente com árvore suja gera conflito.
5. Cada módulo em construção tem um contrato em `docs/modulos/<modulo>.md` com o
   checklist de handoff — é lá que se olha "o que falta".

## 5. Estado atual (2026-09)

9 módulos: isolamento em motor · arco elétrico · inspeção de subestação ·
desenergização/LOTO · resistência de aterramento · verificação NBR 5410 §7 ·
**continuidade do SPDA**, **SPDA natural/estrutural** (09/09/2026) e
**aterramento em usina fotovoltaica** (11/09/2026, ambiente 3D provisório).

Detalhes e histórico completo: **`ROADMAP.md`**.
Contratos de módulo em construção: **`docs/modulos/`**.

### Novo módulo autorizado — SPDA natural/estrutural

Pablo autorizou seguir com um galpão industrial, ensaios nas ferragens e acesso
por Aterrinsert. Referência visual: https://www.youtube.com/watch?v=O_flIvGlVLY
(Termotécnica; o vídeo cita 2005). Norma do novo módulo: ABNT NBR 5419-3:2026.
Contrato e pendências: `docs/modulos/spda-estrutural.md`. Manter o SPDA convencional
como módulo separado. Proposta inicial: ferragens expostas e galpão concretado,
com visualização interna das armaduras e do percurso elétrico.

Galpão procedural com obra/pronto, ferragens, garras e ensaios. Pablo forneceu os
quatro PDFs de 2026 no disco G: (caminho em `docs/modulos/spda-estrutural.md`).
Parte 3 lida: F.1 cruzadas topo–base, limite inclusivo 1 Ω; F.4 captação–BEP,
limite inclusivo 0,2 Ω; simulação Kelvin 1 A CC, quatro terminais em dois PP.
O módulo agora tem oito cruzadas + comprobatória, engine nodal, fluxo, defeitos e
relatório CSV. Concreto moldado no local, não pré-moldado nem fundação isolada.
Critérios e fonte no contrato. Não somar resistência dos cabos à leitura Kelvin
ideal nem copiar limites fixos para ensaios não naturais F.5–F.7. O convencional
ainda precisa de revisão técnica própria para 2026, sem simples troca do ano.

### Continuação compartilhada — SPDA (09/09/2026)

Antes de continuar, ler a revisão vigente de `docs/modulos/spda-continuidade.md`.
Ela prevalece sobre o histórico e sobre o prompt inicial `PROMPT-CODEX-spda.md`,
que ainda descreve o BEP externo e o ambiente pendente. Conferir `git status` e
a branch antes de editar; não sobrescrever trabalho de outro agente.

**Decisões do Pablo a preservar:**

- Edificação GLB mais realista, com fallback procedural. Entorno reduzido a três
  prédios distantes, iluminação suavizada e bloom desativado no SPDA.
- Miliohmímetro Inbrat INMD1 PRO ampliado 3× para leitura visual e girado 180°.
  Exatamente dois cabos PP de duas vias: P1/C1 juntos e P2/C2 juntos, cada cabo
  terminado em uma garra. Não voltar a quatro cabos/garras separados.
- Marcadores deslocados para fora das caixas, sem encobrir contatos; botão para ocultar.
- Medir pares vizinhos D1–D2, D2–D3, D3–D4, D4–D1, primeiro nos terminais superiores
  e depois inferiores; repetir nas cruzadas D1–D3 e D2–D4. Mover as duas garras
  preserva o par e mantém leituras independentes. Com D1 inferior–BEP são 13 registros.
- BEP dentro da sala elétrica, ao lado do QGBT fechado, com entrada pela porta norte.
- Ao medir, animar C1 → condutores → C2, incluindo os dois ramos do anel e a ligação
  ao BEP. P1/P2 representam leitura de tensão. Mostrar/ocultar fluxo e enquadrar
  percurso completo; setas ilustrativas, sem indicar intensidade física. Anel
  enterrado visível através do solo, com profundidade esquemática de 0,35 m.

**Implementação e validação registradas:**

- `1034ac0`: 13 medições, modelo de ramos em paralelo e sala elétrica interna.
- `e52b161`: animação da corrente, dados em `src/catalog/spdaFluxo.ts`, renderização
  em `src/scene/SpdaFluxo.tsx` usando os cabos de `Inbrat.tsx`; controles no HUD/store.
- Ajustes fora da área exclusiva do Codex foram necessários para os pedidos do
  Pablo e estão documentados no contrato. Manter um agente por arquivo.
- Build, 75 testes e `git diff --check` aprovados na entrega da animação. Conferidos
  no navegador os percursos superior, inferior e BEP, além de ocultar/mostrar fluxo.
- O fluxo anterior de 13 leituras foi validado até o laudo e em mobile 390×844.
  A conferência mobile específica da nova animação ficou inconclusiva porque a
  conexão de automação com a aba foi perdida; não tratá-la como validada.
- Nenhum deploy nesta entrega. Branch na gravação: `feat/spda-continuidade`.
  Revalidar branch, servidor local e estado da árvore na próxima sessão.

### Publicação e continuidade — 09/09/2026

- Pablo autorizou deploy e registro na memória. Código funcional `894240c`,
  integrado com `origin/main` em `a09f05e` para preservar o controle de acesso.
- `CurvaCaboPP` evita que a interpolação afunde os cabos no piso. Instrumento e
  animação usam o mesmo trajeto nos dois módulos SPDA. Build e 86 testes passaram.
- Hospedagem confirmada: GitHub Pages, branch `gh-pages` do repositório
  `eletricaacademy/simupower`, domínio `https://simupower.eletricaacademy.com.br/`.
  Preservar `public/CNAME` e `public/.nojekyll`. `dist/` contém um Git próprio;
  seu HEAD local pode estar atrasado. Sempre buscar a referência remota antes
  de publicar, usar seu commit como pai e enviar sem force push.
- Build publicado em `39d460b` (fonte `a09f05e`). Propagação confirmada em
  09/09/2026: HTML de produção referencia `assets/index-CwcKcfv3.js`.
  Nas próximas publicações, um HTTP 200 sozinho não confirma a versão nova.
  Não publicar `.sim-shots/`, PDFs normativos ou modelos brutos.
- Ideias propostas, ainda não autorizadas para implementação: diagnóstico de
  falhas ocultas no SPDA, comparação visual de leituras e próxima simulação de
  resistividade do solo pelo método de Wenner. Para SPDA, manter NBR 5419:2026;
  para Wenner, conferir a norma específica aplicável antes de definir critérios.

### Diagnóstico fotográfico, Aterrinserts e publicação — 10/09/2026

- No SPDA estrutural pronto, os oito Aterrinserts superiores e inferiores ficam
  na face externa dos pilares; na obra, a garra continua acessando a ferragem
  interna exposta. Implementação e teste geométrico: `481b7f1`.
- O módulo separado de continuidade recebeu **Diagnóstico por fotos** com quatro
  paradas: Cu-Al sem conector bimetálico em D4, DPS inoperante no QGBT, distância
  de segurança insuficiente junto à D2 e ensaio de continuidade na cobertura.
  A quarta parada é verificação em campo, não não conformidade. Implementação:
  `fb5d771`; validação visual documentada em `a787a37`.
- As quatro imagens locais ficam em `public/images/diagnostico-spda/`. O painel é
  responsivo, move a câmera para uma pose catalogada, mostra marcador 3D e revela
  diagnóstico, risco, ação e referência por assunto. Não altera engine, leituras
  ou laudo. Confirmar os itens normativos exatos com Pablo antes de material externo.
- Validação: build aprovado, 91/91 testes, quatro paradas percorridas em 1440×900
  e painel rolável até “Concluir tour” em 390×844, sem erros no console.
- Fonte remota atualizada em `feat/spda-continuidade` até `a787a37`. GitHub Pages
  publicado em `a7a82b7`, preservando `CNAME` e `.nojekyll`. Produção confirmada
  pelo HTML `assets/index-BBnV-emn.js`, cena `assets/Stage-BS3n_vMD.js`, quatro
  fotos e `models/spda-predio.glb`, todos respondendo 200 em 10/09/2026.
- O remoto Git embutido em `dist/` foi normalizado para a URL HTTPS sem credencial.
  Nesta publicação foi usado clone temporário limpo do `origin/gh-pages`, sem
  force push. Revalidar hashes e referências remotas antes da próxima publicação.

### Sincronização com o servidor — 11/09/2026

- Claude buscou `origin`: `feat/spda-continuidade` local = remota. Depois do código
  publicado (`a787a37`) só houve commits de documentação. `origin/main` (`1024e3d`,
  senha promocional) já está integrado na branch; o `main` local avançou só por
  fast-forward. Não havia branch nova do Codex no remoto nem stash pendente.
- `main` ainda **não** recebeu o SPDA: a branch está 19 commits à frente e produção
  é publicada a partir dela. Merge/PR para `main` aguarda decisão do Pablo.
- Produção conferida: HTML referencia `assets/index-BBnV-emn.js`, o mesmo hash do
  build local. Não havia nada novo para publicar e não houve deploy.
- Build aprovado e 91/91 testes nesta sincronização. Próximo passo aguardando o
  Pablo; as ideias propostas em 09/09 continuam sem autorização para implementar.

### Novo módulo — Aterramento em usina fotovoltaica (11/09/2026)

Pedido do Pablo: usina FV **de solo** com skid, transformador, subestação e painéis —
começou em 100 kW e, no mesmo dia, passou a **300 kW** "conforme a recomendação" do
Claude. **Claude fez a ferramenta e o cenário procedural; o ambiente 3D definitivo é
do Codex.** Branch `feat/aterramento-usina-fv` (sai de `feat/spda-continuidade`).
Contrato, checklist e briefing para o Codex: `docs/modulos/aterramento-usina-fv.md` —
ler antes de mexer.

- Planta em `src/catalog/usinaFvPontos.ts`: 540 × 555 Wp em 10 mesas 2P×27 a 20°,
  **norte = −Z**, skid com 3 × 100 kW + QGBT, trafo 300 kVA 380 V/13,8 kV, cabine de
  medição e proteção, poste MT fora da cerca, portão e estrada ao sul (+Z). Malha com
  condutor em cada linha de pilares e anel de equalização a 1 m da cerca.
- **Decisão do Pablo — só resultados, não o método:** os potenciais de solo vêm do
  método do GroundPRO (`Ground New HTZ`, momentos/Heppe, solo homogêneo) calculados
  FORA e gravados em `src/catalog/usinaFvResultados.ts` (arquivo gerado, unitário
  ρ = 1 Ω·m e 1 A). O solver NÃO entra neste repositório, que é **público** no GitHub,
  nem no bundle do navegador. Não trazer código do GroundPRO para cá. Mudou a malha
  ou as posições? Os resultados precisam ser recalculados (um teste acusa).
- Três ensaios + laudo: continuidade do BEP do skid a 15 massas; queda de potencial
  (curvas pré-calculadas; só há patamar com a estaca C a 5× a diagonal, 470 m);
  toque e passo com o potencial real sob os pés e brita. Defeito físico no cenário
  com defeitos: trecho do anel de equalização ausente em frente ao portão.
- 3D didático: malha através do solo, mapa de potencial no solo (escala de 16 cores
  do GroundPRO, em `tokens.ts`) e modo "áreas seguras", zona de influência e janela
  do patamar na estrada, corrente animada nas estacas, pessoa no toque/passo.
- Números sem fonte fechada estão como constantes `⚠ REVISAR COM O PABLO` na engine.
  Não copiar os limites do SPDA para cá. SPDA da usina fora do escopo (se entrar,
  NBR 5419:2026). **Confirmado por Pablo (11/09): corpo de 50 kg** nos limites de
  toque/passo — não trocar por 70 kg.
- Pablo pediu para não mexer no GroundPRO nem nos processos do Codex. O gerador dos
  resultados ainda não tem destino definitivo (ver contrato).
- Codex: trocar o placeholder `scene/UsinaFvElements.tsx` pelo GLB, desligar
  `USINA_PROCEDURAL`, recalibrar só `CALIBRAR (CODEX)`; a camada didática continua.
- Validado: build, 123/123 testes e, no navegador desktop, todas as etapas sem erro
  no console. Celular não conferido nesta revisão. Sem deploy.
- Segurança (dúvida do Pablo): o que vai para o bundle pode ser lido no navegador,
  inclusive a senha de acesso do menu. O GroundPRO roda o solver no navegador; para
  proteger a lógica dele, a saída é mover o cálculo para uma função no servidor.

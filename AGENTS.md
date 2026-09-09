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

7 módulos: isolamento em motor · arco elétrico · inspeção de subestação ·
desenergização/LOTO · resistência de aterramento · verificação NBR 5410 §7 ·
**continuidade do SPDA** (ferramenta e ambiente 3D implementados; atualização em 09/09/2026).

Detalhes e histórico completo: **`ROADMAP.md`**.
Contratos de módulo em construção: **`docs/modulos/`**.

### Novo módulo autorizado — SPDA natural/estrutural

Pablo autorizou seguir com um galpão industrial, ensaios nas ferragens e acesso
por Aterrinsert. Referência visual: https://www.youtube.com/watch?v=O_flIvGlVLY
(Termotécnica; o vídeo cita 2005). Norma do novo módulo: ABNT NBR 5419-3:2026.
Contrato e pendências: `docs/modulos/spda-estrutural.md`. Manter o SPDA convencional
como módulo separado. Proposta inicial: ferragens expostas e galpão concretado,
com visualização interna das armaduras e do percurso elétrico.

Primeira etapa visual integrada: card SPDA natural / estrutural no menu, galpão
procedural, obra/pronto, revelar ferragens e conectar garras. Build e 75 testes
existentes aprovados; desktop e painel mobile conferidos. **Ainda não há medição,
animação da corrente ou laudo no módulo estrutural.** Aguardando fonte da edição
2026 para validar os critérios; contrato lista também as próximas tarefas visuais.

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

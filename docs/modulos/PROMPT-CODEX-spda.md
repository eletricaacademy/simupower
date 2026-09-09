# Prompt para o Codex — ambiente 3D do módulo de Continuidade do SPDA

> Cole o bloco abaixo numa conversa nova do Codex, com o repositório `Simupower` aberto.
> Ele é autossuficiente: aponta o que ler, o que fazer e o que **não** tocar.

---

Você está no repositório **SimuPower** — plataforma de ensaios elétricos virtuais em 3D
(Vite + React + TypeScript + three/@react-three/fiber, tudo em PT-BR).

**Antes de escrever qualquer código, leia nesta ordem:**

1. `AGENTS.md` (raiz) — arquitetura, convenções e a divisão de trabalho entre agentes.
2. `docs/modulos/spda-continuidade.md` — o contrato deste módulo (seção 4 é a sua tarefa).
3. `src/catalog/spdaPontos.ts` e `src/scene/SpdaElements.tsx` — os dois arquivos de fronteira.

## Contexto

O módulo 7 (**Continuidade do SPDA — ABNT NBR 5419-3**) já está pronto do lado da
ferramenta: engine, catálogo de passos, store, HUD e laudo funcionam, com 21 testes
passando. Falta o **ambiente 3D**. Hoje a cena usa um **prédio procedural provisório**
(`PREDIO_PROCEDURAL = true` em `src/scene/SpdaElements.tsx`) só para o módulo rodar.

Para ver rodando: `npm run dev` → menu → card "Continuidade do SPDA".

## Sua tarefa

Substituir o placeholder por um cenário 3D de verdade.

**Prédio comercial/industrial a céu aberto, ~12 m × 8 m de base × 9 m de altura**
(medidas em `PREDIO`, `src/catalog/spdaPontos.ts`), centrado na origem, base em `y = 0`,
**1 unidade = 1 metro**. O SPDA precisa estar visível e legível para o aluno:

1. **Captação** — anel de condutor nu no perímetro da cobertura + captores (mini-hastes)
   nas quinas e no meio dos lados maiores.
2. **4 descidas** nas quinas, condutor de cobre nu aparente, com fixações regulares.
3. **4 caixas de inspeção** na base (≈0,7 m do piso), com conector desconectável — é onde
   a ponta de prova do instrumento encosta.
4. **BEP** (barramento de equipotencialização principal) na fachada oeste, ligado à caixa D1.
5. **Defeitos visíveis** (opcional, mas ajuda muito): emenda folgada na descida **D3** e
   conector esverdeado/corroído na base da **D4**.

Grama, céu e sol **já vêm prontos** do `Outdoor.tsx` — o `Stage.tsx` liga isso sozinho para
`cenario: 'predio-spda'` com `groundY = 0`. **Não recriar chão nem céu.**

## Passo a passo

1. Modelar/otimizar o GLB → `public/models/spda-predio.glb` (bruto em `assets-raw/models/`).
   ⚠️ Armadilha conhecida do projeto: `gltf-transform optimize --compress quantize`
   **rotaciona o modelo** e quebra malhas fundidas. Se estragar, entregue o original.
2. `src/catalog/equipment/spdaPredio.ts` → preencher `modelPath: 'models/spda-predio.glb'`
   e ajustar `escalaAlvo`.
3. `src/scene/SpdaElements.tsx` → `PREDIO_PROCEDURAL = false` e remover/adaptar
   `PredioProcedural`. **Não mexa em `Marcadores`, `Marcador` nem `Trecho`** — são a
   ligação com o estado do ensaio.
4. Rodar, abrir ⚙ → **Identificar ponto**, clicar em cada ponto de teste e colar as
   coordenadas em `SPDA_PONTOS` (`pos` = onde a ponta de prova encosta; `posOrigem` = a
   outra extremidade do trecho).
5. Capturar as poses de câmera (⚙ do HUD) e regravar as 5 `vista`s em
   `src/catalog/tests/spda.ts`.
6. `npm run build` e `npm test` limpos → commit → registrar o que mudou no `ROADMAP.md`
   (seção "7. Continuidade do SPDA") e marcar as pendências resolvidas em
   `docs/modulos/spda-continuidade.md`.

## Não toque nestes arquivos

`src/engine/**`, `src/sim/**`, `src/ui/**`, `src/catalog/tests/spda.ts` (exceto as `vista`s),
e os campos elétricos de `src/catalog/spdaPontos.ts` (comprimento, material, seção,
conexões, defeito, textos). Eles são do outro agente. **Não renomeie os ids dos trechos:**
`capt-anel`, `desc-d1`, `desc-d2`, `desc-d3`, `desc-d4`, `eq-bep`.

Se precisar mudar algo fora da sua área, faça o mínimo, avise no commit e anote em
`docs/modulos/spda-continuidade.md`.

## Critério de pronto

- O prédio real aparece no lugar do placeholder, com SPDA completo e visível.
- Os 6 marcadores caem exatamente nos pontos de teste corretos do modelo.
- As 5 etapas do procedimento enquadram a câmera no que o texto está descrevendo.
- `npm run build` e `npm test` limpos; `ROADMAP.md` atualizado.

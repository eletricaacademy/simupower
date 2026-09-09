# Módulo 7 — Continuidade do SPDA (NBR 5419-3)

**Contrato Claude × Codex.** Estado em 2026-09-08: **ferramenta pronta e rodando**
(com prédio procedural provisório); **ambiente 3D pendente — tarefa do Codex**.

Abrir pelo menu → card "Continuidade do SPDA" (senha de acesso das ferramentas: a mesma
dos demais módulos, em `MainMenu.tsx`).

---

## 1. O que o módulo ensina

Inspeção de continuidade do SPDA conforme **ABNT NBR 5419-3** (inspeção e manutenção):
o percurso captação → descida → caixa de inspeção → BEP tem que estar eletricamente
íntegro. Mede-se a resistência de cada trecho com instrumento em função **continuidade
(RLO, ≥ 200 mA)**.

Fisica implementada (`src/engine/spda.ts`):

```
R_medida = ρ·L/S + Σ R_conexões (+ R_defeito) (+ R_pontas se não compensar)
```

- Trecho íntegro dá **miliohms** — o que domina a leitura são as conexões.
- Defeitos plantados: `emenda-frouxa` (+0,82 Ω → faixa de atenção), `corrosao` (+2,6 Ω →
  reprova), `rompido` (circuito aberto → visor **OL**).
- Erro didático clássico: **não zerar as pontas** soma ~0,128 Ω em todas as leituras.

**Critério adotado (⚠ REVISAR COM O PABLO — a NBR 5419-3 exige "continuidade" sem fixar
um número único):** `≤ 0,5 Ω` conforme · `0,5–1,0 Ω` atenção · `> 1,0 Ω` ou `OL` não
conforme. Constantes `LIMITE_CONFORME` / `LIMITE_ATENCAO` no topo da engine.

Fluxo (5 passos, `src/catalog/tests/spda.ts`): segurança/APR → inspeção visual → preparar
instrumento (zerar pontas) → medir os 6 trechos → laudo com não conformidades, causa
provável e ação corretiva.

---

## 2. Arquivos e donos

### Claude (pronto)

| Arquivo | Papel |
|---|---|
| `src/engine/spda.ts` | física, vereditos, laudo — função pura |
| `src/engine/spda.test.ts` | 21 testes |
| `src/catalog/spdaPontos.ts` | **arquivo de fronteira** — trechos ensaiados |
| `src/catalog/tests/spda.ts` | procedimento (5 passos) |
| `src/catalog/equipment/spdaPredio.ts` | **gancho do modelo 3D** |
| `src/sim/spdaStore.ts` | estado (trecho ativo, medições, laudo) |
| `src/ui/SpdaHud.tsx` | HUD + instrumento + laudo |
| wiring | `types.ts`, `catalog/index.ts` (`PAR_SPDA`), `App.tsx`, `MainMenu.tsx` |

### Codex (a fazer)

| Arquivo | Tarefa |
|---|---|
| `public/models/spda-predio.glb` | **modelo do prédio com SPDA** (bruto em `assets-raw/models/`) |
| `src/scene/SpdaElements.tsx` | trocar `PredioProcedural` pelo cenário real |
| `src/catalog/spdaPredio.ts` | preencher `modelPath` e `escalaAlvo` |
| `src/catalog/spdaPontos.ts` | calibrar `pos`, `posOrigem`, `vista` |
| `src/catalog/tests/spda.ts` | regravar as 5 `vista`s de câmera |

---

## 3. Interface congelada (não mudar sem alinhar)

O que a cena 3D pode ler do estado:

```ts
import { useSpda } from '../sim/spdaStore'
const pontoAtivo = useSpda((s) => s.pontoAtivo)   // id do trecho selecionado
const medicoes  = useSpda((s) => s.medicoes)      // { [id]: { r, display, cor, aprovado } }
useSpda.getState().setPontoAtivo(id)              // clicar no ponto 3D seleciona o trecho
```

Ids dos 6 trechos (**não renomear**): `capt-anel`, `desc-d1`, `desc-d2`, `desc-d3`
(emenda frouxa), `desc-d4` (corrosão), `eq-bep`.

Cores por resultado: `pass` / `marginal` / `fail` de `design/tokens.ts` — a cena já usa,
basta manter o mapeamento em `SpdaElements.Marcadores` (esse componente é do Claude).

---

## 4. Briefing do ambiente 3D (para o Codex)

Prédio comercial/industrial a céu aberto, ~**12 m × 8 m × 9 m** (medidas em
`PREDIO`, `catalog/spdaPontos.ts`), com SPDA completo e visível:

1. **Captação** — anel de condutor nu no perímetro da cobertura + captores (mini-hastes)
   nas quinas e no meio dos lados maiores.
2. **4 descidas** nas quinas, condutor de cobre nu aparente, fixações regulares.
3. **4 caixas de inspeção** na base (≈0,7 m do piso) com conector desconectável — é onde
   a ponta de prova encosta.
4. **BEP** (barramento de equipotencialização) na fachada oeste, ligado à caixa D1.
5. Entorno: grama e céu já vêm do `Outdoor.tsx` (o `Stage` já liga isso para
   `cenario: 'predio-spda'`, com `groundY = 0`). Não recriar chão/céu.
6. **Defeitos visíveis** (bônus, ajuda muito o aluno): emenda folgada na D3 e conector
   esverdeado/corroído na base da D4.

Convenção: 1 unidade = 1 m, base do prédio em `y = 0`, prédio centrado na origem.

### Passo a passo do handoff

1. Modelar/otimizar → `public/models/spda-predio.glb` (bruto em `assets-raw/models/`).
2. `catalog/equipment/spdaPredio.ts`: `modelPath: 'models/spda-predio.glb'` + `escalaAlvo`.
3. `scene/SpdaElements.tsx`: `PREDIO_PROCEDURAL = false` (o `Equipment3D` assume o modelo).
4. Rodar, abrir o ⚙ → **Identificar ponto**, clicar em cada ponto de teste e colar as
   coordenadas em `SPDA_PONTOS` (`pos` = onde a ponta encosta, `posOrigem` = outra ponta).
5. Capturar as poses de câmera e regravar as `vista`s dos 5 passos.
6. `npm run build` + `npm test` limpos → commit → atualizar o `ROADMAP.md`.

---

## 5. Pendências conhecidas

- [ ] Modelo 3D do prédio (Codex) e calibração dos 6 pontos.
- [ ] Confirmar com o Pablo o **critério de aceitação** (0,5 / 1,0 Ω).
- [ ] Locução dos passos (padrão dos outros módulos: `public/sounds/voz/`).
- [ ] Avaliar medir também a **resistência de aterramento de cada descida** (hoje o
      módulo é só continuidade; o módulo 5 já cobre queda de potencial).
- [ ] Som próprio: hoje reusa `sounds/campo.mp3` (campo aberto), como o módulo 5.

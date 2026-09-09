# Módulo 7 — Continuidade do SPDA (NBR 5419-3)

**Contrato Claude × Codex.** Estado em 2026-09-08: **ferramenta e ambiente 3D integrados**.
Prédio GLB com SPDA, contatos calibrados e reprodução visual do Inbrat INMD1 PRO.

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

**Critério (CONFIRMADO pelo Pablo em 2026-09-08):** `≤ 0,2 Ω` conforme · `0,2–1,0 Ω`
atenção · `> 1,0 Ω` ou `OL` não conforme. A NBR 5419-3 exige "continuidade" sem fixar um
número único; o valor é do Pablo. Constantes `LIMITE_CONFORME` / `LIMITE_ATENCAO` no topo
da engine.

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

### Codex (entregue)

| Arquivo | Tarefa |
|---|---|
| `public/models/spda-predio.glb` | **modelo do prédio com SPDA** (bruto em `assets-raw/models/`) |
| `src/scene/SpdaElements.tsx` | trocar `PredioProcedural` pelo cenário real |
| `src/catalog/equipment/spdaPredio.ts` | `modelPath` e escala 1:1 do GLB |
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

- [x] Modelo 3D do prédio (Codex) e calibração dos 6 pontos.
- [x] Critério de aceitação confirmado pelo Pablo em 2026-09-08: **0,2 / 1,0 Ω**.
- [ ] Locução dos passos (padrão dos outros módulos: `public/sounds/voz/`).
- [ ] Avaliar medir também a **resistência de aterramento de cada descida** (hoje o
      módulo é só continuidade; o módulo 5 já cobre queda de potencial).
- [ ] Som próprio: hoje reusa `sounds/campo.mp3` (campo aberto), como o módulo 5.

## 6. Entrega do Codex — 2026-09-08

- GLB autoral: edificação 12 × 8 × 9 m, com vãos reais e vidro recuado, esquadrias,
  persianas, peitoris, pingadeiras, portões, puxadores, marquises com tirantes,
  arandelas, drenagem pluvial, venezianas, alçapão e exaustores.
- Reboco com cor, normal e rugosidade em três PNGs de 512 px incorporados ao GLB.
  UV em metros; sem downloads em execução. Geometria agrupada por sete materiais,
  respeitando os perfis de qualidade já aplicados pelo Stage/Equipment3D.
- Anel contínuo, seis captores, quatro descidas com fixações, caixas abertas com
  conectores e ligação física D1–BEP. Emenda frouxa D3 e oxidação D4 acompanham
  `cenario === 'com-defeitos'`. Espessuras dos condutores têm exagero visual didático;
  os valores elétricos de seção, comprimento e resistência continuam os do catálogo.
- Fonte editável e reprodução: `node assets-raw/models/gerar-spda.mjs`. O bruto
  mantém peças nomeadas; a versão de uso funde por material sem alterar eixos.
  `spda-geometria.json` registra limites e transformação esperada do carregador.
  Estes arquivos específicos de autoria entram no commit apesar do ignore geral de `assets-raw/`.
- `PREDIO_PROCEDURAL = false`; catálogo aponta para o GLB. `modelPath` vazio mantém
  uma cena simplificada para a ferramenta funcionar sem o asset declarado.

### Calibração e enquadramentos

Os contatos abaixo foram capturados por clique no material `SPDA_cobre`, através
de “Identificar ponto”. O HUD arredonda a centímetros. Referências superiores
seguem as coordenadas dos nós construtivos do anel; a proximidade de todas as
extremidades com a geometria é verificada em `scene/spdaModelo.test.ts`.

| Trecho | Contato capturado (x, y, z) |
|---|---|
| capt-anel | 6.21, 9.36, -4.27 |
| desc-d1 | -6.28, 0.70, -4.35 |
| desc-d2 | 6.26, 0.70, -4.35 |
| desc-d3 | 6.27, 0.70, 4.35 |
| desc-d4 | -6.26, 0.70, 4.35 |
| eq-bep | -6.28, 0.92, 1.49 |

Vistas capturadas no HUD: visão geral (segurança/laudo); vista elevada da cobertura
(inspeção); INMD1 PRO próximo do BEP (preparar instrumento); captação (início das
medições). Cada seleção de trecho também possui aproximação própria.
Na identificação, os marcadores ficam temporariamente ocultos para o clique
atingir a superfície do GLB. `Marcadores`, `Marcador` e `Trecho` não foram alterados.

### Inbrat — escopo visual solicitado por Pablo durante a execução

Modelo adotado como referência: **INMD1 PRO**, na ausência de outro código indicado.
`scene/Inbrat.tsx` modela maleta vermelha, borda de borracha, terminais P1/C1/P2/C2,
painel, visor, teclas e fechos, em 258 × 205 × 120 mm. O visor recebe a leitura do
store; quatro cabos ilustram as duas extremidades do trecho. “Ver equipamento 3D”
e “Ver conexão” permitem alternar o enquadramento sem alterar a medição.

Fontes oficiais consultadas:
- [Produto e dimensões](https://inbrat.com.br/produto/inmd1-pro-miliohmimetro-de-1-2a/).
- [Foto frontal utilizada como referência](https://inbrat.com.br/wp-content/uploads/2025/09/INMD1-05.jpg).

**Limite funcional:** reprodução visual, não emulação do firmware ou da metrologia
do fabricante. A engine conserva a didática original de compensação das pontas,
leituras e critérios. A Inbrat descreve medição Kelvin de quatro terminais; a
página pública apresenta informações de faixa divergentes das de outras páginas
do fabricante. ⚠ REVISAR COM O PABLO antes de alterar o modelo elétrico para uma
simulação fiel ao instrumento real. Nenhuma faixa foi inventada ou substituída.

### Mudanças mínimas fora dos arquivos exclusivos da cena

- `ui/SpdaHud.tsx`: ligação de controles de calibração que faltavam no painel,
  identificação visual Inbrat e botões de câmera; painel de configurações acima
  do instrumento; limite de altura com rolagem. Sem mudanças nos cálculos ou ações
  de medir, compensar, selecionar, concluir e emitir laudo.
- `design/tokens.ts`: materiais do prédio e cores do gabinete/painel Inbrat.
- `catalog/tests/spda.ts`: apenas vistas e comentário de calibração.
- Nenhuma alteração em `engine/**`, `sim/**` ou nos campos elétricos dos trechos.

### Verificação

- Build de produção e **69 testes Vitest aprovados** (66 existentes e três de geometria).
- Testes geométricos verificam metros, centralização, assentamento, contato com
  cobre, orçamento de malhas, texturas locais e ausência de codecs externos.
- Fluxo desktop exercitado até o laudo com seis medições: quatro aprovadas, D3 em
  atenção e D4 reprovada. Conferidas vistas da cobertura e das quatro caixas/BEP.
- MobileSheet, painel Inbrat e acesso ao módulo conferidos em viewport de 390 × 844,
  inclusive com qualidade baixa; o campo horizontal se adapta ao retrato para
  evitar cortes laterais. A câmera permanece livre e os botões permitem
  aproximação do equipamento/conexão.

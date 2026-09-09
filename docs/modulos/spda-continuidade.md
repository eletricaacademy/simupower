# Módulo 7 — Continuidade do SPDA (NBR 5419-3)

**Contrato Claude × Codex.** Estado em 2026-09-09: **roteiro entre descidas e sala elétrica interna**.
Prédio GLB com SPDA, contatos calibrados e reprodução visual do Inbrat INMD1 PRO.

Abrir pelo menu → card "Continuidade do SPDA" (senha de acesso das ferramentas: a mesma
dos demais módulos, em `MainMenu.tsx`).

---

## Revisão vigente — pares de descidas e BEP interno (09/09)

Esta revisão, explicitamente solicitada e confirmada por Pablo, substitui o roteiro
de seis trechos descrito no histórico abaixo. São **13 registros independentes**:

- D1–D2, D2–D3, D3–D4 e D4–D1: superior e inferior em cada par (8).
- Cruzadas D1–D3 e D2–D4: superior e inferior em cada par (4).
- D1 inferior até o BEP interno, ao lado do QGBT fechado (1).

As caixas mostram os dois terminais separados, em y=0,84 e y=0,56. O comando
“Mover as duas garras” alterna o nível mantendo o par e a posição do instrumento.
P1/C1 e P2/C2 seguem em dois cabos PP, cada qual terminado em uma garra. Cabos
cruzados contornam a edificação; no BEP, o cabo de D1 passa pela porta norte.
As duas esferas indicam as extremidades ativas fora das conexões.

O térreo do GLB agora é oco e tem sala elétrica com piso, divisórias, porta aberta,
QGBT, BEP e ligação equipotencial. “Entrar na sala elétrica” leva à porta e anima
a entrada. Vistas individuais de P1/C1 e P2/C2 permitem conferir as duas garras.
O fallback procedural também contém sala e contatos superiores/inferiores.

**Modelo elétrico didático:** anel retangular de 42 m, com os dois percursos em
paralelo; as duas descidas (superior) ou ligações ao anel (inferior) estão em série.
Os ramos incluem resistências de conexão. Defeito de D3 aplicado aos percursos
superiores que o incluem; corrosão de D4 aos inferiores que o incluem. A leitura
inferior é continuidade metálica, não resistência em relação ao solo. O anel
enterrado é representado no modelo elétrico; o terreno permanece opaco.
⚠ REVISAR COM O PABLO: seções, resistências de contato e topologia são parâmetros
didáticos do cenário, não dimensionamento executivo ou reprodução de uma obra.
Critérios de aceitação previamente aprovados foram preservados.

**Fronteira autorizada:** catálogo ativo, textos de procedimento, engine para os
ramos em paralelo, comandos de câmera e HUD foram alterados para atender ao novo
fluxo confirmado. Os registros antigos ficam em `SPDA_PONTOS_LEGADO` para consulta;
seus ids não foram reaproveitados para medições diferentes. `eq-bep` mantém sua
identidade com novo contato interno. A linha reta de `Trecho` foi retirada para
não sugerir um caminho atravessando a construção.

**Validação:** testes de 13 registros, independência superior/inferior, anel em
paralelo, contato geométrico com o cobre e laudo completo. A sequência de 72 testes
inclui os testes existentes de todos os demais módulos.
Os oito terminais e o BEP foram recapturados pelo modo Identificar ponto no GLB.
Vista de entrada capturada no HUD: posição [-3,70; 1,80; -3,40], alvo [-3,70; 1,30; 0,50].
Fluxo desktop executado até o laudo: 13/13 medições, sete aprovadas e seis apontamentos
no cenário com defeitos. Em 390 × 844, conferidos painel de medição e alternância
superior/inferior preservando as leituras já registradas.

## Histórico da implementação anterior (08/09)

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
painel, visor, teclas e fechos, com proporções de referência de 258 × 205 × 120 mm.
A pedido do Pablo, a exibição usa ampliação didática de **3×**, mantendo o prédio
em metros. O visor recebe a leitura do store. Conforme esclarecimento do Pablo,
são **dois cabos PP retos de duas vias**, com capa externa preta: um reúne P1/C1,
outro P2/C2. Há uma única garra por cabo, totalizando duas garras, uma em cada
extremidade calibrada do trecho. As vias aparecem separadas apenas nas terminações,
junto aos bornes e dentro de cada garra. As garras têm mandíbulas metálicas,
articulação e punhos isolados. O cabo é flexível, sem espiral.
A maleta foi girada 180° em torno do eixo vertical a pedido do Pablo; bornes e
saídas dos cabos acompanham a rotação, mantendo as garras nos contatos calibrados.
“Ocultar marcadores” permite inspecionar as garras sem sobreposição; a seleção
continua disponível no painel, e os marcadores podem ser reexibidos. As funções
Após solicitação explícita do Pablo, `Marcador` recebeu apenas um deslocamento
visual lateral nas caixas e no BEP, liberando a visão dos conectores. As posições
calibradas, as garras, a seleção, as cores por resultado e `Trecho` foram preservados.
“Ver equipamento 3D”
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
- `catalog/tests/spda.ts`: apenas vistas e comentário de calibração; a vista da
  preparação foi recapturada para a ampliação de 3×.
- Nenhuma alteração em `engine/**`, `sim/**` ou nos campos elétricos dos trechos.

### Ajustes visuais solicitados em 09/09

- Entorno do SPDA reduzido de dez para três prédios distantes; aterramento preservado.
- Bloom desativado no SPDA, exposição 0,78, luz solar 1,25 e ambiente 0,4;
  céu azul uniforme sem o halo branco do shader atmosférico.
- Marcadores das caixas deslocados lateralmente para não cobrir as conexões,
  conforme autorização explícita do Pablo para esse ajuste em `Marcador`.

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

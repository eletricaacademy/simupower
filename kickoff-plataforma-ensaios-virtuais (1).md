# Kickoff — Plataforma de Ensaios Elétricos Virtuais em 3D (projeto novo, independente)

## Como usar este prompt
1. Abra o **Claude Code** numa **pasta nova e vazia** (projeto do zero, sem reaproveitar nada de outros softwares).
2. **Anexe apenas 1 arquivo:** `electric_motor.glb` (modelo de exemplo).
3. Cole **todo o texto abaixo** (a partir de "PROMPT") como primeira mensagem.

> Importante: este é um produto **standalone**. Não use convenções, design system ou padrões de projetos anteriores. A identidade e as regras estão todas definidas aqui.

---

# PROMPT

Você é meu parceiro de desenvolvimento sênior em **React + 3D + design de produto**. Vamos criar, do zero, uma **plataforma moderna de ensaios elétricos virtuais em 3D** — um ambiente imersivo de treinamento onde técnicos e engenheiros aprendem a **executar ensaios de campo** em equipamentos elétricos renderizados em 3D, manipulando instrumentos virtuais realistas.

Pense em "simulador/jogo de treinamento profissional", não em formulário com um 3D ao lado. Idioma: **Português Brasileiro**.

## O que estamos construindo (visão)
Uma plataforma web (desktop e celular, via navegador) onde o usuário:
- Entra numa cena 3D imersiva com um equipamento real.
- Pega um instrumento (nesta fase, o **megômetro/megger**) e executa um **ensaio guiado** passo a passo.
- Vê leituras ao vivo num **instrumento calibrado** na tela, com resultado e veredito segundo norma.

**Fase 1 (este build):** ensaio de **resistência de isolamento** em um **motor de indução** (use o `electric_motor.glb` anexado). A arquitetura precisa ser **orientada a dados** para, depois, adicionar novos equipamentos (transformador, painel, disjuntor) e novos ensaios (continuidade, resistência de aterramento, hipot) **só criando definições**, sem reescrever a engine ou a cena.

---

## Identidade visual (siga esta direção — é específica desta plataforma)
Conceito: **"Instrumento Calibrado / HUD de campo"**. Preciso, técnico, imersivo. Nada de visual genérico de SaaS.

**Paleta (defina como tokens):**
| token | hex / valor | uso |
|---|---|---|
| viewport | `#0B0F14` | fundo do palco 3D (escuro, imersivo) |
| surface-glass | `rgba(18,24,33,0.72)` + backdrop-blur | painéis HUD flutuantes (vidro fosco) |
| surface | `#11161D` | módulos sólidos (readout do instrumento) |
| hairline | `rgba(255,255,255,0.08)` | bordas finas |
| text | `#E8EDF2` / muted `#8A97A6` / faint `#5B6675` | textos |
| **accent (assinatura)** | `#F2B705` (âmbar de instrumento) | passo ativo, ação principal, energizado — **usar com parcimônia** |
| accent-cool | `#4CC2FF` | traço de medição / dados |
| status | pass `#34D399`, marginal `#FBBF24`, fail `#F87171` | vereditos de ensaio |

**Tipografia:**
- Display/UI: **Space Grotesk** (grotesca técnica e moderna).
- Texto: **Inter**.
- **Mono em TODA leitura numérica** (valores, MΩ, tensões, tempos, códigos): **JetBrains Mono** — esse "número em mono" é a assinatura de instrumento. Use `@fontsource`.

**Layout:**
- **Viewport 3D em tela cheia** como palco.
- **HUD de vidro fosco** sobreposto: painel de procedimento (passo atual + ação) ancorado num lado/base; barra superior fina com nome do equipamento, estado de segurança e tensão de ensaio.
- Um **módulo "Instrumento"** flutuante (leitura grande em mono + mini-gráfico R×tempo ao vivo).

**Elemento-assinatura (o que a plataforma será lembrada):** o **readout do instrumento ao vivo** — valor grande em mono + uma **curva R×tempo estilo osciloscópio** que se desenha em tempo real durante os 60 s do ensaio, emoldurada como painel calibrado.

**Movimento (sutil, com `prefers-reduced-motion`):** brilho (bloom) nas ponteiras quando energizadas; easing nos valores; câmera que desliza suavemente para a região relevante a cada passo; transições de passo em cross-fade. Menos é mais.

---

## Stack e bibliotecas
- **Vite + React 18 + TypeScript**
- **three**, **@react-three/fiber**, **@react-three/drei** (OrbitControls com pinça/zoom no toque, useGLTF, Environment, Lightformer, ContactShadows/AccumulativeShadows, Html, Bounds)
- **@react-three/postprocessing** (Bloom para o energizado, Vignette, SSAO leve) — polimento "game"
- **zustand** (estado da simulação) · **@react-spring/three** opcional (animações)
- **Tailwind CSS** com tema custom **derivado dos tokens acima** (não use a paleta padrão do Tailwind) + um pouco de CSS para o vidro fosco do HUD
- **@fontsource/space-grotesk**, **@fontsource/inter**, **@fontsource/jetbrains-mono**
- Dev: **@gltf-transform/cli** (otimização de assets), **vitest** (testes da engine), **@types/three**, opcional **leva** e **r3f-perf** para tuning

Comandos esperados:
```
npm create vite@latest . -- --template react-ts
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing zustand
npm i @fontsource/space-grotesk @fontsource/inter @fontsource/jetbrains-mono
npm i -D tailwindcss @tailwindcss/vite @gltf-transform/cli vitest @types/three
```
Node 20+.

---

## Princípios de engenharia (regras deste projeto)
1. **Engine pura e isolada:** toda a física/cálculo vive em `src/engine/` como **funções puras**, sem React, testáveis em Node.
2. **Conteúdo orientado a dados:** equipamentos e ensaios são **definições (dados)**, não código espalhado. Adicionar um novo ensaio = adicionar uma definição.
3. **React = apresentação.** A UI consome engine + estado; não contém regra de cálculo.
4. **Testes na engine antes da UI** (Vitest).
5. **PT-BR** na interface; **normas corretas** (NBR/IEEE/IEC) citadas onde relevante.
6. **Responsivo + toque**: funciona em celular (HUD colapsável; OrbitControls já dá pinça/zoom).
7. **Acessível**: foco visível, contraste AA, `prefers-reduced-motion`.

---

## Arquitetura (proposta — confirme e me explique ajustes)
```
public/models/electric_motor.glb
src/
  design/tokens.ts            # paleta, tipografia, espaçamento (fonte única da identidade)
  engine/
    insulation.ts             # cálculo puro do ensaio de isolamento
    insulation.test.ts        # testes Vitest
    registry.ts               # mapeia id-do-ensaio -> função de engine
  catalog/
    equipment/motor.ts        # definição do equipamento (modelo, âncoras, dados nominais)
    tests/insulation.ts       # definição do ensaio (passos, normas, tensões, engineRef)
    types.ts                  # tipos Equipment, TestProcedure, Step
  scene/
    Stage.tsx                 # palco, luzes (Lightformer), Environment, sombras, postprocessing
    Equipment3D.tsx           # carrega GLB do catálogo, expõe âncoras de conexão
    Megger.tsx                # instrumento 3D (visor, botão TEST, bornes L/E)
    Leads.tsx                 # ponteiras (tubos) que conectam e brilham (bloom)
  sim/
    store.ts                  # zustand: equipamento+ensaio ativos, passo, flags, progresso
    orchestrator.ts           # avança passos, dispara efeitos na cena
  ui/
    Hud.tsx GuidedPanel.tsx Instrument.tsx (readout+curva) Checklist.tsx TopBar.tsx
  App.tsx  main.tsx
```

**Esquema de dados (defina em `catalog/types.ts`):**
```ts
type Anchor = { id: string; pos: [number,number,number]; label: string };
type Equipment = { id; nome; tipo; modelPath; anchors: Anchor[]; dadosNominais };
type Step = { id; titulo; descricao; acao; requer?: string[]; control?: 'voltage' };
type TestProcedure = { id; nome; norma; instrumento:'megger'; engineRef; tensoes:number[]; steps: Step[] };
```
A cena e o HUD renderizam **qualquer** par (equipamento × ensaio) a partir dessas definições.

---

## Especificação da engine de isolamento (`insulation.ts`)
Resistência de isolamento no tempo com **dois tempos de absorção** (MΩ):
```
R(t) = Rinf * (1 - A*exp(-t/τ1) - B*exp(-t/τ2))
```
Perfis didáticos (selecionáveis pelo "modo instrutor"):
| condição | A | τ1 | B | τ2 | Rinf por tensão (V→MΩ) |
|---|---|---|---|---|---|
| bom | 0.40 | 35 | 0.58 | 380 | 250:9000, 500:8000, 1000:7000, 2500:6000 |
| atenção | 0.30 | 20 | 0.30 | 180 | 250:200, 500:150, 1000:110, 2500:80 |
| ruim/úmido | 0.10 | 8 | 0.05 | 100 | 250:6, 500:4, 1000:2.5, 2500:1.5 |

Funções:
- `rIso(perfil, V, t)` → MΩ
- `corrigir40(R, tempC) = R * 2^((tempC-40)/10)` (IEEE 43, referência 40 °C)
- `DAR = R(60)/R(30)` · `PI = R(600)/R(60)`
- `avaliar(dar, pi, r40)`:
  - `r40 < 5` **ou** `pi < 1.0` → **Reprovado**
  - `pi < 2.0` **ou** `dar < 1.25` **ou** `r40 < 100` → **Questionável**
  - `pi < 4.0` → **Aprovado** · senão → **Excelente**

Testes Vitest cobrindo DAR/PI/veredito nas 3 condições.

## Ensaio guiado (definição de dados — 7 passos)
1. **Segurança (LOTO):** confirmar desenergização/bloqueio.
2. **Descarga inicial:** aterrar momentaneamente os terminais.
3. **Tensão de ensaio:** 250/500/1000/2500 V (padrão 500 V p/ motor BT).
4. **Conectar EARTH (preta)** na carcaça aterrada.
5. **Conectar LINE (vermelha)** no terminal do enrolamento.
6. **Aplicar TEST:** 60 s; leitura sobe pela absorção dielétrica; capturar R(30s)/R(60s); calcular DAR, PI e R@40 °C; exibir veredito (cores de status).
7. **Descarga final:** descarregar antes de remover as ponteiras.
Travas: o passo 6 só habilita com 1–5 cumpridos. Modo instrutor troca **condição** e **temperatura**.

## Cena 3D
- Palco escuro com `Environment` + `Lightformer` (estúdio) e sombras de contato; postprocessing com **Bloom** sutil (energizado) e Vignette.
- Carregar GLB do catálogo: centralizar, normalizar escala, assentar no chão, ativar sombras.
- **Âncoras de conexão** vêm da definição do equipamento (começar por heurística da bounding box; deixar fácil ajustar — o GLB não traz a posição real da caixa de bornes).
- Megômetro 3D com visor (leitura ao vivo via Html/textura) e botão TEST que afunda; ponteiras que **aparecem** ao conectar e **brilham** quando energizadas.
- Câmera com OrbitControls (damping) + leve auto-rotação até a 1ª interação; a cada passo, deslizar suavemente para a região relevante (drei `Bounds`).

## Asset pipeline (todo asset entra otimizado por padrão)
**Convenção de pastas:**
```
public/models/raw/     # arquivo bruto (GLB convertido de FBX/OBJ/STEP) — NÃO vai pra produção
public/models/         # GLB otimizado, servido pelo app
```
Fluxo: converta para GLB (conversor online ou Blender) → coloque em `raw/` → rode o script abaixo → use o GLB final em `/public/models`.

**Scripts (adicione ao `package.json`):**
```json
"scripts": {
  "asset": "gltf-transform optimize",
  "asset:inspect": "gltf-transform inspect"
}
```

**Comando padrão (validado — reduz ~75%, ex.: 4,5 MB → 1,1 MB):**
```
npm run asset -- public/models/raw/motor.glb public/models/motor.glb \
  --texture-compress webp --texture-size 1024 --compress quantize
```

**Para modelos pesados / CAD de fabricante (reduz polígonos com meshoptimizer):**
```
npm run asset -- public/models/raw/trafo.glb public/models/trafo.glb \
  --texture-compress webp --texture-size 1024 --compress quantize \
  --simplify true --simplify-ratio 0.5
```

**Conferir antes/depois (tamanho, texturas, vértices):**
```
npm run asset:inspect -- public/models/motor.glb
```

**Regras do pipeline:**
- **Sempre `--compress quantize`** (NÃO o Draco padrão). WebP + quantization carregam **nativo** no three/R3F, sem decoder em runtime. Draco/meshopt geram arquivos menores, mas exigem configurar decoder no `useGLTF` — evite por padrão.
- `--texture-size`: **1024** para o equipamento em foco; **512** para itens de fundo.
- `--simplify-ratio` (0–1): use só em malhas muito densas e **confira visualmente** (pode distorcer geometria).
- GLB sempre servido como **arquivo separado** (sem base64).
- Licença: `electric_motor.glb` é exemplo (origem Sketchfab) — validar licença para uso comercial ou trocar por asset CC0/próprio.

## Entregável desta sessão
- App rodando (`npm run dev`): cena imersiva com o motor, instrumento e ensaio guiado completo, leituras/DAR/PI/veredito corretos, HUD de vidro, **responsivo e com toque** no celular.
- `npm run build` → `dist/` estático pronto para subir num **VPS (nginx + HTTPS Let's Encrypt)**.
- Engine isolada e testada; catálogo orientado a dados.

## Comece assim
1. Proponha o **nome da plataforma** (3 opções curtas, modernas) e confirme a estrutura/stack.
2. Mostre primeiro o **`design/tokens.ts`** e um print/descrição da direção visual.
3. Depois a **engine + testes** (valido os números).
4. Então a cena, o instrumento e o HUD — em incrementos ("ondas"), validando cada etapa. Em decisões de arquitetura, escolha a opção tecnicamente defensável e siga, me explicando.

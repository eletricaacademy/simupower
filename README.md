# Calibra — Ensaios Elétricos Virtuais em 3D

Plataforma web imersiva de treinamento onde técnicos e engenheiros executam
**ensaios elétricos de campo** em equipamentos renderizados em 3D, manipulando
instrumentos virtuais calibrados.

**Fase 1:** ensaio de **resistência de isolamento** com megômetro em um **motor
de indução**. A arquitetura é **orientada a dados** — novos equipamentos e
ensaios entram como definições, sem reescrever a engine ou a cena.

> Conceito visual: *"Instrumento Calibrado / HUD de campo"*. Palco 3D escuro,
> HUD de vidro fosco, e o **readout ao vivo com curva R×tempo** como assinatura.

## Stack

Vite · React 18 · TypeScript · three / @react-three/fiber / drei /
postprocessing · zustand · Tailwind CSS v4 (tema derivado dos tokens) ·
@fontsource (Space Grotesk, Inter, JetBrains Mono) · Vitest.

## Rodar

```bash
npm install
npm run dev          # ambiente de desenvolvimento
npm test             # testes da engine (Vitest)
npm run build        # gera dist/ estático
npm run preview      # serve o build local
```

Node 20+ (testado em Node 24).

## Arquitetura

```
src/
  design/tokens.ts          fonte única da identidade (espelhada em index.css @theme)
  engine/                   física PURA do ensaio + testes (sem React)
    insulation.ts           R(t) com absorção dielétrica; DAR/PI/correção 40°C; veredito
    registry.ts             EngineRef -> módulo de cálculo
  catalog/                  conteúdo orientado a dados
    types.ts                Equipment, TestProcedure, Step, Anchor
    equipment/motor.ts      definição do motor (modelo, âncoras, dados nominais)
    tests/insulation.ts     ensaio guiado (7 passos, normas, tensões)
  sim/                      estado (zustand) + orquestração de passos/efeitos
  scene/                    Stage, Equipment3D, Megger, Leads (three/R3F)
  ui/                       Hud, GuidedPanel, Instrument (readout+curva), Checklist, TopBar
```

**Princípio:** engine pura e testável → catálogo de dados → UI só apresenta.

## Engine de isolamento

Modelo de absorção com dois tempos: `R(t) = Rinf·(1 - A·e^(-t/τ1) - B·e^(-t/τ2))`.
Três perfis didáticos (bom / atenção / ruim) selecionáveis no **modo instrutor**,
com correção de temperatura para 40 °C (IEEE 43). Vereditos por DAR, PI e R@40 °C.
Cobertos por testes Vitest (`src/engine/insulation.test.ts`).

## Pipeline do asset (todo asset entra otimizado por padrão)

**Convenção de pastas:**

```
public/models/raw/     # arquivo bruto (GLB convertido de FBX/OBJ/STEP) — NÃO vai pra produção
public/models/         # GLB otimizado, servido pelo app
```

Fluxo: converta para GLB → coloque em `raw/` → rode o script → use o GLB final
em `/public/models`.

**Scripts (`package.json`):** `asset` (= `gltf-transform optimize`),
`asset:inspect` (= `gltf-transform inspect`) e `asset:motor` (atalho do motor).

**Comando padrão (reduz ~38% aqui: 1,83 MB → 1,13 MB):**

```bash
npm run asset -- public/models/raw/motor.glb public/models/motor.glb \
  --texture-compress webp --texture-size 1024 --compress quantize
```

**Modelos pesados / CAD de fabricante (reduz polígonos com meshoptimizer):**

```bash
npm run asset -- public/models/raw/trafo.glb public/models/trafo.glb \
  --texture-compress webp --texture-size 1024 --compress quantize \
  --simplify true --simplify-ratio 0.5
```

**Conferir antes/depois (tamanho, texturas, vértices):**

```bash
npm run asset:inspect -- public/models/motor.glb
```

**Regras do pipeline:**

- **Sempre `--compress quantize`** (NÃO Draco). WebP + quantization carregam
  **nativo** no three/R3F, sem decoder em runtime. Draco/meshopt geram arquivos
  menores mas exigem configurar decoder no `useGLTF` — evite por padrão.
- `--texture-size`: **1024** para o equipamento em foco; **512** para fundo.
- `--simplify-ratio` (0–1): só em malhas muito densas e **confira visualmente**.
- GLB sempre servido como **arquivo separado** (sem base64).

> **VRAM importa mais que o tamanho do arquivo.** Uma textura 1024² webp ocupa
> ~100 KB em disco mas **~5,6 MB de VRAM** (descomprimida + mipmaps). Por isso o
> app também aplica um **teto de textura em runtime por nível** (ver Desempenho)
> e carrega **um equipamento por vez** (lazy + dispose), em vez de pré-carregar
> todos os ensaios.

> **Licença:** `electric_motor.glb` é exemplo (origem Sketchfab). Validar a
> licença para uso comercial ou substituir por asset CC0/próprio em produção.

## Deploy (VPS · nginx + HTTPS)

`npm run build` gera `dist/` estático. Exemplo de bloco nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name calibra.seu-dominio.com.br;

    ssl_certificate     /etc/letsencrypt/live/calibra.seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/calibra.seu-dominio.com.br/privkey.pem;

    root /var/www/calibra/dist;
    index index.html;

    # SPA fallback
    location / { try_files $uri /index.html; }

    # assets com cache longo (hash no nome)
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    # modelos 3D
    location /models/ { expires 30d; types { model/gltf-binary glb; } }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}

server {
    listen 80;
    server_name calibra.seu-dominio.com.br;
    return 301 https://$host$request_uri;
}
```

Certificado: `sudo certbot --nginx -d calibra.seu-dominio.com.br`.

## Desempenho (rodar em máquinas leves e celular)

A cena adapta o custo gráfico ao dispositivo (`src/scene/quality.ts`). Há três
níveis, detectados automaticamente (GPU/cores/DPR/memória) e ajustáveis no menu
⚙ (Auto / Alto / Médio / Baixo, persistido em `localStorage`):

| nível | DPR | Bloom/postproc. | sombras | teto textura | frameloop |
|---|---|---|---|---|---|
| **alto** | até 2× | sim | dinâmicas 2048 + contato | sem corte | always |
| **médio** | até 1.5× | sim | dinâmicas 1024 + contato | 1024 px | always |
| **baixo** | 1× | **não** | só contato 256 | **512 px** | **demand** |

O que mais pesava e foi domado: **Bloom** (desligado no nível baixo), **DPR**
(limitado por nível em vez de 2× fixo), **sombras** (reduzidas/desligadas), o
**teto de textura em runtime** (reduz a VRAM — ~11 MB → ~3 MB no nível baixo,
sem GLB extra) e o **loop de render** — no nível baixo usa `frameloop="demand"`,
desenhando apenas durante o ensaio e a cada mudança (economiza GPU/bateria
parado). Além disso, `PerformanceMonitor` reduz o DPR sozinho se o FPS cair,
`AdaptiveDpr`/`AdaptiveEvents` aliviam durante interação, e o código 3D
(three/R3F) é **lazy-loaded** num chunk à parte para a casca pintar primeiro.

**Vários ensaios sem inchar a memória:** cada equipamento é carregado **sob
demanda** (lazy) e **liberado** (dispose de geometria/material/textura) ao
trocar — nunca todos de uma vez. Mantenha cada GLB no pipeline acima e use
texturas 512 px para equipamentos de fundo.

### GPU em notebook híbrido (Intel + NVIDIA/AMD)

O maior gargalo de desempenho costuma ser o navegador renderizar na **GPU
integrada** (Intel UHD) em vez da **dedicada** (NVIDIA/AMD). O app:

- pede `powerPreference: 'high-performance'` no contexto WebGL (e no probe de
  detecção), o que **prefere a GPU dedicada**;
- mostra a **GPU em uso** no menu ⚙ (ponto verde = dedicada, âmbar = integrada);
- se cair na integrada, classifica como nível **baixo** automaticamente (sem
  bloom/sombras, 30 FPS, render sob demanda).

Se o ponto continuar âmbar, force pelo Windows: **Configurações → Sistema → Tela
→ Gráficos** → selecione o navegador → **Opções → Alta performance (NVIDIA)** →
reinicie o navegador. No painel da NVIDIA também dá para fixar o navegador na
GPU dedicada.

## Acessibilidade & mobile

Foco visível, contraste AA, `prefers-reduced-motion` (desliga auto-rotação,
bloom pulsante e slides de câmera). OrbitControls dá pinça/zoom no toque; HUD
colapsável em abas no celular.

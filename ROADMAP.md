# SimuPower — Módulo NR-10 · Roadmap & Status

> Plataforma standalone de **ensaios elétricos virtuais em 3D** (PT-BR). Renomeada de "Calibra" → **SimuPower** (2026-06).
> Stack: Vite 5 + React 18 + TypeScript · three r0.169 + @react-three/fiber v8 + drei v9 + postprocessing · zustand v4 · Tailwind v4 (@theme) · @fontsource · Vitest.
> Padrão: **engine pura e testada** → **catálogo orientado a dados** → cena/HUD renderizam qualquer par (equipamento × ensaio).

Estado: **build limpo** (`npm run build`), **45 testes** passam (`npm test`).

---

## 1. Módulos (5 — todos disponíveis no menu)

| # | Módulo | modo | Equipamento | Engine | HUD |
|---|--------|------|-------------|--------|-----|
| 1 | **Teste de Isolamento em Motor** | `guiado-megger` | motor (electric_motor.glb) | `insulation` | `Hud.tsx` |
| 2 | **Análise de Arco Elétrico** | `arcflash` | painel-mt (Armadio MT) | `arcflash` | `ArcFlashHud.tsx` |
| 3 | **Inspeção de Subestação** | `inspecao` | subestacao.glb (walk-in) | `inspecao` | `InspectionHud.tsx` |
| 4 | **Procedimento de Desenergização** | `desenergizacao` | subestacao-limpa.glb | `desenergizacao` | `DesenergizacaoHud.tsx` |
| 5 | **Resistência de Aterramento** | `aterramento` | aterramento.glb (pátio) | `aterramento` | `AterramentoHud.tsx` |

Roteamento por `modo` em `App.tsx`; cena por `cenario` em `scene/Stage.tsx` (bancada-lab / subestacao [arco] / subestacao-3d [walk-in env]).

### Detalhes por módulo

**1. Motor (isolamento) — IEEE 43**
- 7 passos: LOTO → descarga inicial → tensão → EARTH → LINE → TEST(60s) → descarga final.
- `scene/MotorElements.tsx`: cadeado LOTO na caixa de bornes, bastão de descarga c/ faísca+luz (passos descarga), destaque do megômetro com a tensão (Html "500 V").
- Garras jacaré nos cabos (vermelho LINE=borne-u, cinza EARTH=carcaca-terra). Âncoras calibradas em `motor.ts`.
- Pop-up educativo `EnsaioInfo` ao iniciar o TEST (por quê / resultados IEEE43 PI>2 DAR>1.4 / o que observar).
- Megômetro Minipa MI-2705 (CanvasTexture). Som de fundo: oficina.mp3 (10%).

**2. Arco Elétrico — IEEE 1584 / NR-10**
- `ArcIntro.tsx` (abertura 3 fases): pergunta "situação real / NR-10 2026 — prosseguir? Sim/Não" (voz arco-intro) → **vídeo** `public/videos/arco-intro.mp4` → objetivo "dimensionar vestimenta" (voz arco-vestimenta) → entra na sim.
- Passos: segurança → tensão → corrente → tempo → config/distância → calcular energia → definir EPI/etiqueta.
- `Colaborador.tsx`: operador (homem com viseira) de frente p/ painel (escala 1.45, pos [0.7,0,1.9]).
- Etiqueta de arco (ArcPlate, Html ~A5) na frente do painel. Som de fundo: cabine.mp3 (15%). Sala branca de alvenaria.
- Voz: arco-energia (ao calcular) · arco-resultado (etapa af-epi).

**3. Inspeção de Subestação — NR-10 / NBR 14039**
- 7 pontos: acesso → trafo → cubículos → aterramento → cabos → ambiente → laudo. Veredito de conformidade.
- Tour guiado com **vistas de câmera calibradas** (baked em `tests/inspecao.ts`). Toggles Grade/Paredes no topo. Alpha cutout nas telas/grades.
- Locução por ponto (voz insp-*). Zumbido da subestação (20%, ducking 10% na fala).

**4. Desenergização / Reenergização — NR-10 10.5/10.6**
- 16 passos (8 desen. + 8 reen., ordem inversa), **navegação MANUAL** (marcarPasso + Voltar/Próximo); manobras do disjuntor pedem **"Preparado? Sim/Não"** (store `confirmando`).
- `scene/DesElements.tsx`: marcador clicável; props por estado (LOTO `Loto`, aterramento trifásico `Aterramento` c/ 3 grampos calibrados, barreira, placa "PROIBIDO OPERAR A CHAVE"); luz do disjuntor vermelho=fechado/verde=aberto (IEC 60073); botão+luva de vaqueta `LuvaVaqueta`; **VaraDeteccao** (sobe e encosta no barramento) no teste de tensão.
- Câmera dá **zoom de frente (+Z)** em cada ponto (arco "afasta e reaproxima").
- Pop-up **BemVindo** (voz bem-vindo) na entrada; **palmas** + pop-up de comemoração ao concluir desen. ("Prosseguir p/ reenergização") e reen. ("Voltar ao menu").
- Caixa de diálogo por etapa (Procedimento/Cuidados/Erros). Sons por ação (disjuntor, mola, fechadura/LOTO, catraca/aterramento, proteção, sinalização sintetizados).
- Modelo limpo próprio (`subestacao-limpa.glb`); âncoras calibradas (disjuntor/bloqueio/teste/aterramento/protecao/sinalizacao).

**5. Resistência de Aterramento — queda de potencial (62%) · NBR 5419 / IEEE 81**
- Engine `aterramento.ts`: curva R×distância com platô em 62%; perfis solo (RTERRA bom 4.6 / atenção 17.5 / ruim 41 Ω); veredito ≤10 ok / ≤25 atenção / >25 ruim.
- `aterStore.ts` (perfil, posP, medições, resultado). HUD: terrômetro c/ leitura ao vivo + **curva SVG R×% com linha 62%** + slider da estaca P + Registrar/Calcular + veredito. PerfilPicker no ⚙.
- Reusa EnvScene (cenario subestacao-3d); HUD força mostrarGrade+mostrarParedes=true (senão o corte RX_TELA esconde a malha).
- **Ambiente externo ensolarado** (2026-06-22): `scene/Outdoor.tsx` (drei `Sky` + chão de grama por CanvasTexture procedural, com dispose) renderizado no `Stage` só quando `ehAter = ehEnv && modo==='aterramento'`. Luz quente de sol (`SUN_POS [14,20,9]`, dir #fff3df) + hemisférica céu/grama; `toneMappingExposure` 1.05, bg sky-blue, `envIntensity` do modelo 0.7. Não afeta inspeção/desenergização (continuam internas).
  - **Brilho do horizonte reduzido (2026-06-22):** `Sky` com turbidity 1 / rayleigh 0.55 / mie 0.002 / mieG 0.7 e `toneMappingExposure` do aterramento 1.05→0.92 (estava lavando o sistema).
  - **Terrômetro Minipa MTR-1522** (`scene/Terrometro.tsx`): modelo real importado de backup → `public/models/raw/terrometro-minipa.glb` + otimizado 512² (`public/models/terrometro-minipa.glb`, 209KB). 1 mesh / 1 material PBR. Colocado na cena via `{ehAter && <Terrometro3D/>}` (`scene/Terrometro.tsx`, export `Terrometro3D` — não confundir com o componente `Terrometro` interno do HUD). **Escala REAL ~10 cm** (`COMPRIMENTO_M=0.1`, `UNIDADES_POR_METRO=1` — ajustar se o mundo não for 1u=1m); deitado na grama (`POS=[0.6,0.8,3.2]`). **Visor interativo** = plano CanvasTexture sobre o LCD (`desenharVisor`, lê `resultado.r62 || resistenciaAparente` do aterStore) — posição `VISOR_POS/ROT/SIZE` ainda em placeholder, CALIBRAR olhando a cena. **Cabos (norma):** E=verde(5m), P=amarelo(10m), C=vermelho(20m) — roteamento às estacas PENDENTE. **Ponto de medição (base do trafo) = `[2.51, 0.79, -0.14]`** (calibrado por Pablo) — marcado na cena por um eletrodo (haste latão + ponta âmbar) em `Terrometro.tsx`; é onde conecta o cabo E/verde. **Calibração MULTI-PONTO** (`IdentificarPonto` no ⚙): seletor de alvo (medição/terrômetro/direção) + `pickMode`; clique no modelo OU no **chão** (plano invisível em `EnvScene` quando `ehAter && pickMode`, reporta `e.point` em world≈frame das âncoras). "Copiar tudo" junta os 3 pontos. **Tapete** BRANCO (borda âmbar) sob o terrômetro sinaliza a posição. **Gramado clareado** (base #9ab47e, baixo contraste). **CALIBRADO (2026-06-22):** terrômetro `POS=[2.6,0.8,0.61]`, medição `[2.51,0.79,-0.14]`, direção `[4.48,0.8,1.7]`. Tamanho real **20 cm** (`COMPRIMENTO_M=0.2`). Visor encaixado no TOPO real do aparelho via **raycast** (o bbox tinha saliência → flutuava). Cabos E(verde→trafo)/P(amarelo)/C(vermelho) como TubeGeometry com flecha; 2 hastes (P na metade, C no ponto clicado, razão 1:2 comprimida) — tudo em `scene/Terrometro.tsx`.
  - **Altura do gramado (`ATER_GROUND_Y=0.8`):** o modelo `aterramento.glb` tem geometria enterrada (pontas de postes/eletrodos abaixo da superfície), então o assentamento padrão (`box.min.y→y=0` em Equipment3D) deixava a base visível flutuando. A superfície real do pátio foi medida por histograma das bases dos meshes (maior cluster em world Y≈0.8) e o `Outdoor` recebe `groundY` para alinhar a grama/blob nesse nível. Recalibrar se o GLB mudar.
  - **CUSTO ESCALADO POR TIER (otimização):** o que pesava era o **passe de shadow map por quadro** (modelo grande + frameloop 'always' no médio/alto). Solução: sombra real do sol **só no `alto`** (`castShadow` gated por `cfg.tier==='alto'`); médio/baixo usam um **blob estático** (gradiente radial, custo de render zero). `Sky` (shader de atmosfera) só em médio/alto; no baixo o fundo azul do Canvas basta. Grama em **`meshLambertMaterial`** (cobre muita tela = fill-rate; Lambert << PBR). Texturas reduzidas no baixo (128²/anisotropia 1).

---

## 2. Áudio (`ui/sons.ts` + `sim/audioStore.ts`)
- **Volume mestre + mudo** global (`audioStore`), widget `SoundControl` fixo no topo-direito de TODOS os HUDs.
- Auto-silêncio por **inatividade 3 min** (App.tsx); reativa ao interagir (se mudo foi automático).
- **Ducking**: ambiente/efeitos caem p/ 10% enquanto o locutor fala.
- Dica "aumente o som" no menu (1×/sessão).
- Ambientes em loop: subestação (20%, insp/desen), oficina (10%, motor), cabine MT (15%, arco).
- Efeitos (arquivo): disjuntor, mola, fechadura, catraca, palmas. Efeitos sintetizados (Web Audio) p/ proteção, sinalização, descarga, sucesso, passo.
- **Locução (voz)** em `public/sounds/voz/`: bem-vindo + 16 desen (`des-*`/`reen-*`) + 7 insp (`insp-*`) + 4 arco (`arco-*`). Tocam por id de passo. Avatar `Apresentador.tsx` (técnico SVG anima a boca) na inspeção e desenergização.

## 3. Marca / identidade
- Logos em `public/brand/` (otimizadas com sharp): `logo-horizontal.png` (escuro, usada no header do menu + splash), `icone.png`, variantes `-claro`, `favicon.png`. Selo **"Módulo NR-10"** ao lado do logo no menu.
- **Marca d'água** SimuPower (`Watermark.tsx`) discreta em todos os ensaios (18vw, opacidade 0.045).
- Créditos: "Desenvolvido por Elétrica Tools · Eng. Pablo Guimarães" (sem ícones ⚡, removidos a pedido).

## 4. Convenções técnicas
- **Assets de `public/` em runtime → SEMPRE `asset(path)`** (`src/lib/asset.ts`, prefixa `import.meta.env.BASE_URL`). Caminhos absolutos (`/sounds/...`, `/models/...`) quebram sob subcaminho de deploy (GitHub Pages = `usuario.github.io/repo/` → 404). Foi a causa da **locução do narrador não carregar** no deploy. Aplicado em `sons.ts` (3× `new Audio`), `Equipment3D`/`Colaborador` (`useGLTF` + preload), e `<img>/<video>` (App/Watermark/MainMenu/ArcIntro). `index.html` o Vite já reescreve no build (base `./`). **Todos os assets estão dentro de `public/`** — nenhuma referência externa (verificado). `vite.config` fixa `server.port=5173 strictPort` (evita servidores órfãos).
- Otimização de GLB: `gltf-transform optimize ... --texture-compress webp --texture-size 512/1024 --compress quantize --palette false` (palette false preserva nomes de material). Originais em `public/models/raw/`.
- **Recolorir material por nome**: `Equipment.recolor?: Record<nome, hex>` aplicado em `Equipment3D` (mecanismo pronto — ver pendência do transformador).
- Calibração por clique: ⚙ → "Identificar ponto" (pickMode) → reporta `x,y,z [material]` no frame da âncora → colar no catálogo.
- Qualidade adaptativa (`scene/quality.ts`): tiers baixo/médio/alto, DPR cap, bloom/shadows, frameloop demand, fpsCap, GPU high-performance.

---

## 5. PENDÊNCIAS / PRÓXIMOS PASSOS

1. **[EM ABERTO] Transformador cinza (inspeção):** mecanismo `recolor` pronto. Falta o **nome do material** do transformador — usar ⚙ → Identificar → clicar no tanque → gravar em `subestacao.ts`: `recolor: { 'NomeMaterial': '#9aa3ad' }`. Cabos vermelho/azul têm material próprio (não afetar).
2. **Aterramento — calibrar câmera/escala:** modelo grande (escalaAlvo 8, cenario subestacao-3d). Conferir enquadramento/`vistaInicial`; opcional: estacas 3D (C e P) + trena posicionadas por clique; locução dos passos.
3. **Locução opcional:** motor e arco poderiam ter pop-up de boas-vindas + voz (textos a definir). Arco tem 2 áudios livres se quiser (já usados arco-energia/arco-resultado).
4. **Deploy:** EXCLUIR `public/models/raw/` do build de produção (originais pesados).
5. Ideias futuras do menu (cards "em breve"): Ensaios em Disjuntor (IEC 62271).

## 5b. Notas de sessão (2026-06-22)

**Decisão — Culling (frustum/occlusion): NÃO implementar.**
- *Frustum culling* já está ativo (padrão do Three.js, `frustumCulled=true`); nenhum override no código. Custo zero, nada a fazer.
- *Occlusion culling* não compensa: cenas pequenas de sala única (dezenas de objetos, não milhares); sem suporte nativo (exigiria queries WebGL2 / ray-cast manual, com popping de 1 frame e custo de CPU nos aparelhos fracos). O gargalo real já é **fill-rate/VRAM**, não draw calls — e o `quality.ts` já ataca isso (DPR<1, bloom/sombras off, teto de textura, frameloop demand).
- Pegadinha conhecida: as malhas-casca fundidas (parede `G-Object.596` = bbox da sala inteira) **nunca são descartadas** pelo frustum culling, mas não vale dividir — é mesh barata.
- **Próxima alavanca de perf, se quiser FPS extra**: LOD no equipamento principal (drei `<Detailed>`) no motor/painel; e fazer *throttle* do `texture.needsUpdate` do megômetro (CanvasTexture 540×680 hoje re-sobe a cada mudança de leitura → limitar a ~10 fps).

**Preview no navegador — como rodar e atritos encontrados.**
- `npm run dev` subiu na **5206** (portas 5173–5205 ocupadas por servidores node órfãos — convém matá-los). App responde 200, menu = React puro; three.js/3D só carrega ao entrar num ensaio.
- App **não tem rota de URL** (estado no zustand) → não dá deep-link; preview exige dirigir cliques.
- Validado end-to-end via Chrome headless + DevTools Protocol (WebGL por SwiftShader): menu → motor 3D → 7 passos do ensaio → TEST energizado com leitura subindo 661 MΩ → 1,54 GΩ (absorção dielétrica, coerente com IEEE 43). Sem erro de runtime no caminho principal.
- **Sugestão p/ agilizar (TODO opcional):** (1) `npm i -D playwright` + script `preview.mjs` reutilizável; (2) `server: { port: 5173, strictPort: true }` no `vite.config.ts`; (3) deep-link por querystring (`?ensaio=motor`) no `App.tsx` p/ pular o menu em testes.
- Pasta `.sim-shots/` (scripts CDP + screenshots) é **descartável e tem caminhos absolutos desta máquina** — não usar no PC novo; pode apagar.

## 5c. Sessão 2026-06-23 — aterramento (UX/cena) + layout global

**Fluxo de medição (NBR 15749, não NBR 5419):** método trocado p/ **NBR 15749** em todo o aterramento (catálogo/engine/HUD/menu); ≤10 Ω agora é "recomendação da concessionária", não limite de norma. Passos reestruturados (5): Segurança → **Posicionar terrômetro** → Cravar estaca C → **Medir movendo P** → Resultado. A cena ACOMPANHA os passos (elementos aparecem por `cumpridos`): terrômetro+tapete+eletrodo+cabo E ao posicionar; estaca C ao cravar; estaca **P MÓVEL** (entre E e C conforme o slider) na medição.
- **Medição:** painel do terrômetro só aparece na etapa 4 (`mostrarPainel`); slider só após **"▶ Iniciar medição"** (`medicaoIniciada`); registro MANUAL (mín. **3 pontos** p/ habilitar Calcular, com tutorial); ao **Calcular** desenha a **curva traçada** (`resultado.curva`) + **zona de patamar** (faixa verde no gráfico). `analisarPatamar()` dá a variação % e se está no platô.
- **Laudo:** modal `ResumoLaudo` ao "Emitir resultado" com R a 62% + veredito + variação + **parecer** redigido + norma (NBR 15749/IEEE 81) + recomendação ≤10 Ω. Botões: Fechar / **Nova medição** (reinicia) / Voltar ao menu. `reiniciar()` reseta useAter+useSim e religa a câmera guiada.
- **Terrômetro 3D:** tamanho **2×** (`COMPRIMENTO_M=0.2`); **VISOR VIRTUAL REMOVIDO** (usa o LCD do próprio modelo; leitura fica no painel do HUD). Eletrodos C/P **mais afastados** (`DIST_FATOR=1.9`). Pórtico = postes de concreto = material **`DefaultMaterial`** (RX_PORTICO em Equipment3D).
- **Submenu:** clicar "Resistência de Aterramento" no MainMenu abre escolha **Terrômetro de haste (estaca)** [esta sim] vs **tipo alicate** [Em breve].
- **Cenas por etapa (câmera):** vistas calibradas por Pablo e **gravadas no código** (`Step.vista` em `tests/aterramento.ts` — at-terrometro/at-estaca-c/at-medir/at-laudo + overview no at-seguranca); câmera guiada LIGADA por padrão (`setTour(true)` no mount do HUD); `maxDistance` do aterramento = **55** (ver paisagem).
- **Paisagem (`scene/Outdoor.tsx`, leve):** **brita** granito (CanvasTexture cinza) num pátio **8,5×7** sob a subestação; **edificações de fundo** (caixas) com **3 fachadas procedurais** tileáveis (predio=janelas / galpao=chapa / bloco=painéis) variadas por prédio; árvores+postes distantes (só médio/alto). Tudo `meshLambertMaterial`, sem sombra, `dispose` no unmount. FORA da área de trabalho (frente-direita).

**Layout GLOBAL (protótipo no aterramento, aplicado a todos):** componente compartilhado **`ui/HudTopBar.tsx`** = barra superior única (‹ Menu + **logo SimuPower** + título + controles à direita: `ViewControls compact` + som + ⚙). Aplicado em motor/arco/inspeção/desenergização/aterramento. **Logo agora aparece nas sims** (antes só na marca d'água). `ViewControls` ganhou prop `compact` (horizontal). Aterramento: cartão guiado COMPACTO com **dots de progresso clicáveis** (substituem a caixa "Procedimento"); **funções de calibração REMOVIDAS** (IdentificarPonto + CenaCalibrar apagados, ~160 linhas); toggles Grade/Pórtico removidos do aterramento (componente ToggleBar apagado).

**Pendências/recomendações:**
1. **`public/sounds/campo.mp3`** — áudio de campo aberto (já ligado a 30% + idle 2 min no AterramentoHud); falta o arquivo (Pablo envia).
2. **Replicar o layout completo** nas outras 4 sims: a barra superior + logo já foram; falta **encolher os cards de baixo** (caixa "Procedimento" grande, GuidedPanel) como no aterramento (dots de progresso). Cada HUD tem layout próprio — fazer um a um.
3. **Remover a calibração do `InstructorPanel`** (motor/arco ainda têm "Identificar ponto"/garras) — coerente com o pedido de apagar calibração.
4. **Bugs reportados (reiniciar + animação do motor)** NÃO reproduziram em teste fresh (funcionam); provável **HMR inconsistente** após muitas edições → resolver com hard-refresh. Se recorrer numa aba limpa, investigar.
5. **Commit + deploy** quando Pablo aprovar (fluxo local, sob demanda — Pablo controla quando publica).

## 6. Comandos
```
npm install      # PC novo: instalar deps (node_modules NÃO deve ir no zip — tem binários win-x64: @img/sharp, lightningcss)
npm run dev      # dev server (porta 5173, ou a próxima livre)
npm run build    # typecheck + build
npm test         # vitest (45 testes)
```

> **Migrar para outro PC:** copie o projeto **sem** `node_modules/` (pesado e específico de plataforma) e rode `npm install` no destino. Pode descartar `.sim-shots/` (artefatos locais). Requer Node 18+ (testado no 24).

## 7. Estrutura-chave
```
src/engine/        insulation, arcflash, inspection, aterramento (+ .test.ts) — lógica pura
src/catalog/       types.ts · equipment/* · tests/* · index.ts (EQUIPAMENTOS, ENSAIOS, PAR_*)
src/sim/           store (useSim) · arcStore · inspStore · aterStore · audioStore · poseStore · viewStore · orchestrator
src/scene/         Stage · Equipment3D · Megger · Leads · MotorElements · DesElements · Colaborador · Room · Substation · quality
src/ui/            *Hud.tsx · GuidedPanel · Checklist · Instrument · sons.ts · SoundControl · Apresentador · BemVindo · ArcIntro · Watermark · Creditos · MainMenu
public/            models/ (+raw/) · sounds/ (+voz/) · videos/ · brand/ · favicon.png
```

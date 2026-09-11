# Módulo 9 — Aterramento em Usina Fotovoltaica de solo (100 kW)

## Contrato Claude × Codex — 11/09/2026

Pedido do Pablo em 11/09/2026: nova simulação "aterramento em usina fotovoltaica",
usina de solo de **100 kW** (o pedido citou 300 e corrigiu para 100) com **skid**,
**transformador**, **subestação** e **painéis fotovoltaicos**. Claude monta toda a
estrutura (ferramenta, dados e cenário procedural). **O ambiente 3D definitivo é do
Codex**, que troca o placeholder pelo GLB sem mexer na ferramenta.

Branch: `feat/aterramento-usina-fv` (sai de `feat/spda-continuidade`, que ainda não
foi para o `main`). Módulo no menu: card "Aterramento em Usina Fotovoltaica".

## Estado

| Parte | Dono | Estado |
|---|---|---|
| Engine `src/engine/usinaFv.ts` + testes | Claude | ✅ pronta, 23 testes |
| Dados `src/catalog/usinaFvPontos.ts` (planta, malha, pontos) | Claude | ✅ pronto |
| Procedimento `src/catalog/tests/usinaFv.ts` (6 passos) | Claude | ✅ pronto |
| Equipment `src/catalog/equipment/usinaFv.ts` | Claude | ✅ `modelPath: ''` (procedural) |
| Store `src/sim/usinaFvStore.ts` + testes | Claude | ✅ pronto, 6 testes |
| HUD `src/ui/UsinaFvHud.tsx` (desktop + MobileSheet) | Claude | ✅ pronto |
| Cena `src/scene/UsinaFvElements.tsx` | **Claude (placeholder)** → **Codex** | 🟡 procedural provisório |
| Ramo em `src/scene/Stage.tsx` | Claude (mínimo) | ✅ ver "Mudanças fora da área" |
| GLB `public/models/usina-fv.glb` | **Codex** | ⬜ pendente |
| Calibração `pos`/`vista` (`CALIBRAR (CODEX)`) | **Codex** | ⬜ pendente |

## A planta (fonte: `catalog/usinaFvPontos.ts`)

Mundo em metros, +Y para cima, solo em y = 0. **Norte = −Z**: módulos voltados para
o norte (hemisfério sul), borda baixa ao norte. Acesso, portão e estrada ao **sul (+Z)**.

- **Arranjo**: 180 módulos de 555 Wp (2,278 × 1,134 m) = 99,9 kWp; 6 mesas fixas
  2P×15 (duas fileiras em retrato, 15 módulos cada), inclinação 20°, borda baixa a
  0,8 m. Mesas em 3 fileiras × 2 colunas: x = ±10,15; z = −10, −2,5, 5. Corredor
  central de 3 m; passo entre fileiras 7,5 m.
- **Skid** (contêiner 20 pés, 6,06 × 2,6 × 2,44 m) em (−6, 0, 13,5): 2 inversores de
  50 kW + QGBT CA. Portas na face norte. **BEP do skid** em (−4,2; 0,55; 12,2).
- **Transformador** elevador 112,5 kVA 380 V / 13,8 kV, a óleo, em (2,5; 0; 13,5),
  sobre base de concreto; buchas MT a leste, BT a oeste.
- **Subestação**: cabine de medição e proteção em alvenaria, 4 × 3 × 3 m, em
  (13; 0; 16). **Poste da concessionária** fora da cerca em (16; 0; 22), com a
  derivação em MT até a bucha da cabine.
- **Brita** em x −10,5…5,5 / z 10,8…16,4 (skid + trafo).
- **Cerca** alambrado 2,1 m: x −22…22, z −16…19. **Portão** na face sul, centro x = −16,
  4 m de vão. Estrada de terra saindo do portão para o sul (é por ela que as estacas
  da queda de potencial são levadas, até 300 m).
- **Malha enterrada** (0,5 m, Cu 50 mm²): anel interno x ±21 / z −15…18,
  transversais sob cada fileira e sob skid/trafo/SE, longitudinal no corredor, anel da
  SE e **anel externo de equalização** a 1 m da cerca. 12 hastes de 3 m. Área 1 702 m²,
  571 m enterrados, diagonal 59 m.

## Ensaios e critérios

1. **Continuidade da equipotencialização** (NBR 16274 · NBR 16690) — do BEP do skid
   até 11 pontos: 6 mesas, inversores, trafo, SE, portão e mourão da cerca.
   Pontas precisam ser zeradas. ⚠ Critério adotado (a norma não fixa número):
   ≤ 0,5 Ω conforme · 0,5–1,0 Ω atenção · > 1,0 Ω ou OL não conforme.
   Defeitos didáticos: **M4** grampo sobre perfil anodizado (+3,4 Ω), **M6**
   conector corroído (+0,62 Ω), **portão** sem cordoalha flexível (OL).
2. **Resistência da malha — queda de potencial** (NBR 15749). Resistência verdadeira
   por **Sverak (IEEE 80)**; curva pelo potencial de um **disco equivalente** com o
   ponto E na borda da malha. Distâncias da estaca C: 60/120/180/300 m (1, 2, 3 e 5×
   a diagonal). O aluno registra P a 52, 62 e 72 %; **patamar estável se variar
   ≤ 10 %** (⚠). Só a 300 m há patamar — é a lição central do ensaio numa malha grande.
   Critério da malha: ≤ 10 Ω (⚠, igual ao módulo de aterramento).
3. **Toque e passo** (medição NBR 15749, limites NBR 15751/IEEE 80, corpo 50 kg ⚠):
   injeção de 10 A, extrapolada para 500 A de falta que escoa pela malha, t = 0,5 s
   (⚠ valores didáticos). Brita 3 000 Ω·m × 10 cm eleva os limites. 6 pontos: tanque
   do trafo, porta do QGBT, mesa M1, portão (lado externo), passo junto ao trafo e no
   perímetro externo. A fração do GPR em cada ponto é parâmetro do cenário (⚠).
   Com defeito, o portão sem cordoalha vai de 7 % para 30 % do GPR e reprova.
4. **Laudo** consolidado: aprovados por ensaio, malha com patamar, achados e ações.

Solos (instrutor): úmido 100 Ω·m (Rg 1,23 Ω) · arenoso 500 Ω·m (6,16 Ω, padrão) ·
rochoso 1 200 Ω·m (14,8 Ω — toque no trafo reprova mesmo com brita).

## ⚠ Pendências com o Pablo (números e escopo)

- Confirmar **100 kW** (e não 300 kW), módulo 555 Wp, 2 × 50 kW, trafo 112,5 kVA e
  ligação em 13,8 kV.
- Edições vigentes e itens exatos da **NBR 16690**, **NBR 16274**, **NBR 15749** e
  **NBR 15751** citados nos passos (hoje citados só pelo número).
- Critério da continuidade (0,5 / 1,0 Ω) — decisão dele, a norma exige o ensaio sem
  fixar valor. Não reaproveitar os limites do SPDA.
- Critério da malha (≤ 10 Ω da concessionária) e do patamar (≤ 10 %).
- Distância recomendada da estaca C (hoje 5× a diagonal).
- Corrente de falta pela malha (500 A), tempo de eliminação (0,5 s) e peso de
  referência do corpo (50 kg × 70 kg) nas expressões da NBR 15751.
- SPDA da usina fica **fora** deste módulo; se entrar, usar ABNT NBR 5419:2026
  (convenção do projeto), conferindo a parte aplicável.

## Mudanças fora da área do Claude (mínimas, avisadas)

- `src/scene/UsinaFvElements.tsx` — **arquivo novo**, placeholder procedural. O
  Codex passa a ser dono dele a partir do handoff.
- `src/scene/Stage.tsx` — só o ramo do cenário `usina-fv`: flag `ehUsina`, câmera e
  limites (80 m, altura 70 m, distância máx. 160 m), sol ao norte (`SUN_USINA`),
  frustum de sombra ±32 m, `tourMode`, sem bloom e sem `Outdoor` (terreno próprio).
- `src/design/tokens.ts` — paleta `color.usinaFv`.

## Checklist de handoff para o Codex

- [ ] Modelar a usina respeitando as posições acima (mesas, skid, trafo, SE, poste,
      cerca, portão, brita, estrada). Se precisar mover algo, alinhar antes: as
      distâncias elétricas e a malha derivam dessas posições.
- [ ] Bruto em `assets-raw/models/`, otimizado em `public/models/usina-fv.glb`; sem
      Draco/meshopt; conferir que o `optimize` não rotacionou o modelo (AGENTS.md).
- [ ] 180 módulos: preferir instâncias ou malha única; respeitar `cfg.tier`.
- [ ] `usinaFv.modelPath = 'models/usina-fv.glb'` e `escalaAlvo`.
- [ ] `USINA_PROCEDURAL = false` em `UsinaFvElements.tsx` (a malha enterrada, as
      estacas e os marcadores dos ensaios continuam vindo do mesmo arquivo).
- [ ] Recapturar com ⚙ → Calibração: `BEP_SKID`, `pos`/`vista` dos 11 pontos de
      continuidade e dos 6 de toque/passo, `ESTACAS_FV.e`, `VISTAS_FV` e
      `vistaInicial`. Não renomear ids.
- [ ] Opcional: modelos do miliohmímetro/terrômetro na cena (hoje o instrumento é só
      o painel do HUD; na queda de potencial há uma caixa simples junto ao ponto E).
- [ ] `npm run build`, `npm test`, conferir desktop e 390 × 844, commit.

## Briefing para colar no Codex

> Leia `AGENTS.md` e `docs/modulos/aterramento-usina-fv.md` (este arquivo). Na
> branch `feat/aterramento-usina-fv`, o módulo "Aterramento em Usina Fotovoltaica"
> já roda com cenário procedural em `src/scene/UsinaFvElements.tsx`. Sua tarefa é o
> ambiente 3D definitivo: modelar a usina de solo de 100 kW (180 módulos em 6 mesas
> 2P×15 a 20° voltadas para o norte = −Z, skid contêiner com inversores e QGBT,
> transformador 112,5 kVA a óleo sobre base, cabine de medição e proteção, poste da
> concessionária com a derivação MT, cerca alambrado com portão ao sul, brita e
> estrada de acesso), respeitando as posições de `src/catalog/usinaFvPontos.ts`.
> Entregar em `public/models/usina-fv.glb`, preencher `modelPath` em
> `src/catalog/equipment/usinaFv.ts`, desligar `USINA_PROCEDURAL` e recalibrar só os
> campos `CALIBRAR (CODEX)`. Não mexer em engine, store, HUD nem nos dados elétricos.
> Seguir o checklist de handoff do contrato e registrar o que fez nele.

## Validação — 11/09/2026

- `npm run build` aprovado; `npm test` 120/120 (91 anteriores + 29 do módulo).
- Navegador (desktop, servidor local 5173): fluxo completo dos 6 passos no cenário
  com defeitos e solo arenoso — continuidade 8/11 (M4 3,41 Ω, M6 0,630 Ω, portão OL),
  queda de potencial inconclusiva a 120 m (18,4 %) e adequada a 300 m (6,22 Ω,
  8,1 %), toque/passo 5/6 (portão reprova), laudo com achados. Sem erros no console.
- Celular: layout 390 px conferido num iframe (aviso "Melhor no computador", abas
  Procedimento/Medição, miliohmímetro medindo). A janela do navegador de automação
  não redimensiona, então a checagem em aparelho real ainda não foi feita.
- Ajustes após a inspeção visual: rótulos com tamanho fixo e abaixo do HUD, visão
  geral pelo norte (face dos módulos), vista das estacas a partir da planta, vista
  dos terminais das mesas pelo corredor central.

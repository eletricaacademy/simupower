# Prompt para o Codex — Usina FV 300 kW: modelo 3D + relevo de potencial

> Cole o texto abaixo no Codex. Escrito pelo Claude em 11/09/2026, a pedido do Pablo.

---

Você vai trabalhar no **SimuPower**, na branch `feat/aterramento-usina-fv`, módulo
"Aterramento em Usina Fotovoltaica" (300 kW).

**Antes de começar, leia:**
- `AGENTS.md`: divisão Claude × Codex, pipeline de assets e convenções. Tudo em PT-BR e
  nenhuma cor em hex solto (cores em `src/design/tokens.ts`).
- `docs/modulos/aterramento-usina-fv.md`: o contrato do módulo.

Rode `git status` e confirme a branch. O módulo já funciona com um cenário procedural
em `src/scene/UsinaFvElements.tsx`. A partir de agora esse arquivo é seu.

São duas tarefas.

## Tarefa 1 — Modelo 3D definitivo da usina

Modele a usina de solo respeitando as posições de `src/catalog/usinaFvPontos.ts`
(metros, +Y para cima, solo em y = 0, **norte = −Z**, acesso ao sul = +Z):

- **Arranjo:** 540 módulos de 555 Wp (2,278 × 1,134 m, moldura de alumínio, células
  visíveis) em **10 mesas fixas 2P×27** a 20°, voltadas para −Z, com a borda baixa a
  0,8 m.
  - Posições: 5 fileiras × 2 colunas, centros em x = ±17,07 e z = −22,5 / −15 / −7,5 /
    0 / 7,5. Corredor central de 3 m.
  - Estrutura galvanizada: 7 estacas cravadas por linha, duas linhas por mesa (use
    `pilarMesa()` e `PILARES_POR_FILA`), terças e trilhos.
  - Cabos CC presos nos trilhos; caixa de junção em cada mesa.
  - Terminal de aterramento no pé da estrutura voltado ao corredor: os pontos
    `m1`…`m10` de `PONTOS_CONTINUIDADE_FV`.
- **Skid** em (−8; 0; 16,5): contêiner de 6,06 × 2,6 × 2,44 m sobre base, portas na face
  norte, **uma porta aberta mostrando 3 inversores de 100 kW e o QGBT**. BEP (barra de
  cobre) em `BEP_SKID`.
- **Transformador de 300 kVA** a óleo em (0; 0; 16,5), sobre base de concreto:
  radiadores, buchas de MT a leste, de BT a oeste, tanque de expansão e placa de
  identificação.
- **Cabine de medição e proteção** em alvenaria, em (14; 0; 19,5), com 4,5 × 3 × 3,5 m:
  porta metálica na face oeste, ventilação e placas de advertência NR-10.
- **Poste da concessionária** em (18; 0; 26), fora da cerca: cruzeta, chaves e
  para-raios, com a derivação MT até a cabine.
- **Cerca alambrado** de 2,1 m (x −38…38, z −29…23), com arame farpado no topo,
  mourões a cada ~3 m e placas "Perigo — eletricidade". **Portão** de duas folhas na
  face sul, centro em x = −26, 4 m de vão, **com a cordoalha de cobre entre a folha e o
  mourão**.
- **Brita** em x −12…3,5 / z 13,6…19,8. Estrada de terra saindo do portão para o sul
  (até ~550 m). Gramado com relevo muito leve, sem mudar a cota da planta.

**Regras:**
1. **Módulos por instância:** modele um módulo e repita 540 vezes (`InstancedMesh`, ou
   um nó único instanciado no carregamento). Nada de 540 malhas separadas.
2. Bruto em `assets-raw/models/`, otimizado em `public/models/usina-fv.glb`, **sem
   Draco/meshopt** (convenção do projeto).
   - Confira se o `optimize` não rotacionou o modelo (armadilha registrada no
     AGENTS.md).
   - Meta: **≤ 8 MB**. O maior GLB atual, `painel-mt.glb`, tem 7,1 MB.
3. Em `src/catalog/equipment/usinaFv.ts`: `modelPath: 'models/usina-fv.glb'` e
   `escalaAlvo` correto. Em `UsinaFvElements.tsx`: `USINA_PROCEDURAL = false`.
4. **Não mova nada da planta sem alinhar com o Claude.** A malha de aterramento e os
   **resultados pré-calculados** (`src/catalog/usinaFvResultados.ts`, arquivo gerado)
   dependem dessas posições. Não edite esse arquivo, nem a malha (`MALHA_FV`), nem os
   dados elétricos.
5. Recalibre com ⚙ → Calibração (identificar ponto + capturar câmera) **só** os campos
   `CALIBRAR (CODEX)`:
   - `BEP_SKID`;
   - `pos`, `vista` e `alvo` dos pontos de continuidade e de toque/passo;
   - `ESTACAS_FV.e`;
   - `VISTAS_FV` e `vistaInicial`.
   
   Não renomeie ids.
6. Os defeitos visuais continuam no cenário "com defeitos":
   - a cordoalha do portão some;
   - o conector da M6 fica oxidado.
   
   Hoje os dois são desenhados em `Derivacoes` e `CordoalhaPortao`. Se o GLB tiver
   essas peças, deixe-as como nós nomeados que dá para esconder ou recolorir.
7. A **camada didática** do mesmo arquivo continua funcionando por cima do GLB:
   - malha enterrada, derivações, marcadores e rótulos;
   - miliohmímetro, terrômetro e estacas;
   - zona de influência, setas de corrente;
   - pessoa de toque/passo e mapa de potencial.
8. Qualidade gráfica: respeite `cfg.tier` (`scene/quality.ts`). No `baixo`, sem
   detalhes finos.
9. **Kit de peças reaproveitável.** Este modelo será reaproveitado depois em outro
   produto, onde cada usina tem um layout diferente (número de mesas, fileiras, skids,
   tamanho da cerca). Por isso, além da usina montada, deixe no GLB (ou num
   `usina-fv-kit.glb` separado) as **peças como nós nomeados e independentes**, com a
   origem na base de cada peça, em escala real e sem transformação acumulada:
   - `kit_modulo`
   - `kit_mesa_estaca` e `kit_mesa_terca` (ou uma mesa 2P×27 parametrizável)
   - `kit_skid`, `kit_trafo`, `kit_cabine`, `kit_poste_mt`
   - `kit_cerca_painel`, `kit_cerca_mourao`, `kit_portao`, `kit_caixa_inspecao`
   
   A usina montada deve ser feita com essas mesmas peças. Registre no contrato os nomes
   e as dimensões de cada peça.

## Tarefa 2 — "Montanha de potencial" (modo Relevo 3D)

O HUD já tem o botão **"Relevo 3D"** no painel de toque e passo:
`useUsinaFv(s => s.mapaPotencial) === 'relevo'`. Hoje ele desenha o mapa plano. Faça o
relevo em `MapaPotencial`, dentro de `UsinaFvElements.tsx`:

- **Dados:** `mapaDoCenario(cenario)` (em `src/sim/usinaFvStore.ts`) devolve a grade
  `rel` (V/GPR de 0 a 1) com `nx × nz`, origem (`x0`, `z0`) e `passo` de 2 m.
  - Cobre a cerca com 40 m de margem.
  - Há dois cenários, `conforme` e `com-defeitos`. No cenário com defeitos falta o
    trecho do anel de equalização em frente ao portão, e o relevo mostra a "brecha".
  - Não recalcule nada: só leia e desenhe.
- **Superfície:** altura = `rel × H` (sugestão: H ≈ 12 m, com um controle simples de
  exagero, se quiser). Cores pela mesma escala de `color.usinaFv.escalaPotencial` (16
  paradas do GroundPRO, já usadas no modo plano). Interpole a grade para ficar suave
  (bilinear ou subdivisão).
  - O "platô" é a malha no GPR; a "encosta" fora da cerca é onde o passo e o toque
    crescem.
- **Linhas equipotenciais** a cada 10 % do GPR sobre o relevo (marching squares na
  grade), com rótulo discreto de algumas linhas em volts:
  `gpr = malhaDoSolo(solo, cenario).rg * I_MALHA_A`.
- **Legibilidade:**
  - semitransparente, para não esconder mesas e equipamentos;
  - a pessoa de toque/passo e as placas de pé continuam visíveis por cima;
  - uma linha vertical do pé da pessoa até a superfície mostra o potencial "sob os pés".
- **Transição suave** entre plano e relevo (a altura cresce em ~0,6 s). Respeite
  `useSim(s => s.reducedMotion)`.
- Desempenho: uma malha só, com cores por vértice; nada de um objeto por célula.
  Descarte (`dispose`) geometrias ao trocar de cenário ou solo.

## Ao terminar

- `npm run build` e `npm test` limpos. Os 123 testes precisam continuar passando.
- Confira no navegador, no desktop e em 390 × 844:
  - os 6 passos do procedimento;
  - o mapa nos 4 modos;
  - o portão no cenário com defeitos.
- Registre no contrato `docs/modulos/aterramento-usina-fv.md`: o que fez, as
  coordenadas recapturadas e o tamanho do GLB. **Faça commit.** Não publique (deploy)
  sem o Pablo pedir.

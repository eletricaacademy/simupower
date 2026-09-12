# Módulo 9 — Aterramento em Usina Fotovoltaica de solo (300 kW)

## Contrato Claude × Codex — revisão de 11/09/2026

Pedido do Pablo em 11/09/2026: simulação "aterramento em usina fotovoltaica" de solo
com **skid**, **transformador**, **subestação** e **painéis**. Começou com 100 kW e,
no mesmo dia, Pablo pediu **300 kW** "conforme a recomendação" do Claude. Claude monta a
ferramenta, os dados e o cenário procedural. **O ambiente 3D definitivo é do Codex**,
que troca o placeholder pelo GLB sem mexer na ferramenta.

Branch: `feat/aterramento-usina-fv` (sai de `feat/spda-continuidade`, que ainda não foi
para o `main`). Card no menu: "Aterramento em Usina Fotovoltaica".

### Decisões do Pablo a preservar

- **300 kW**, com a configuração recomendada pelo Claude (abaixo).
- **Potenciais de solo e malha mostrados no 3D**, com a visualização do GroundPRO
  como referência.
- **Só os RESULTADOS vêm para o SimuPower, não o método de cálculo.** A usina é um
  exemplo fixo: os potenciais são calculados fora (pelo método do GroundPRO, em solo
  homogêneo) e gravados em `src/catalog/usinaFvResultados.ts`. O solver **não** entra
  neste repositório, que é **público** no GitHub, nem no navegador. Motivo: proteger a
  lógica do GroundPRO. Não documentar aqui detalhes internos do GroundPRO.
- **O modelo final do Codex será reaproveitado no GroundPRO** (layouts variáveis): por
  isso o GLB precisa das peças como nós nomeados. O plano fica numa pasta local e
  privada (`privado/`, fora do git) e começa só depois que o Codex terminar.

## Estado

| Parte | Dono | Estado |
|---|---|---|
| Engine `src/engine/usinaFv.ts` + testes | Claude | ✅ critérios + interpolação dos resultados |
| Dados `src/catalog/usinaFvPontos.ts` | Claude | ✅ planta 300 kW, malha, pontos |
| Resultados `src/catalog/usinaFvResultados.ts` | Claude (gerado) | ✅ Rg, curvas, frações, mapas |
| Procedimento `src/catalog/tests/usinaFv.ts` | Claude | ✅ textos derivados dos dados |
| Store `src/sim/usinaFvStore.ts` + testes | Claude | ✅ |
| HUD `src/ui/UsinaFvHud.tsx` (desktop + mobile) | Claude | ✅ + legenda do mapa |
| Cena `src/scene/UsinaFvElements.tsx` | Claude (placeholder) → **Codex** | 🟡 procedural + camada didática |
| GLB `public/models/usina-fv.glb` | **Codex** | ⬜ pendente |
| Calibração (`CALIBRAR (CODEX)`) | **Codex** | ⬜ pendente |

## A planta (fonte: `catalog/usinaFvPontos.ts`)

Mundo em metros, +Y para cima, solo em y = 0. **Norte = −Z**: módulos voltados para o
norte, borda baixa ao norte. Portão, estrada e acesso ao **sul (+Z)**.

- **Arranjo:** 540 módulos de 555 Wp (2,278 × 1,134 m) = 299,7 kWp. São 10 mesas fixas
  2P×27 (31,1 m de comprimento, 20°, borda baixa a 0,8 m) em 5 fileiras × 2 colunas.
  - x = ±17,07; z = −22,5 / −15 / −7,5 / 0 / 7,5.
  - Corredor central de 3 m e passo entre fileiras de 7,5 m.
  - 7 pilares por linha, duas linhas por mesa.
- **Skid** (contêiner 6,06 × 2,6 × 2,44 m) em (−8; 0; 16,5): 3 inversores de 100 kW e
  o QGBT. Portas na face norte. **BEP do skid** em (−6,2; 0,55; 15,2).
- **Transformador** de 300 kVA, 380 V / 13,8 kV, em (0; 0; 16,5), sobre base.
- **Subestação:** cabine de medição e proteção de 4,5 × 3 × 3,5 m em (14; 0; 19,5).
  **Poste MT** fora da cerca, em (18; 0; 26).
- **Brita:** x −12…3,5 / z 13,6…19,8.
- **Cerca** de 2,1 m: x −38…38, z −29…23. Portão ao sul em x = −26, com 4 m.
- **Estrada** saindo do portão para o sul, até ~550 m (a estaca C vai a 470 m).
- **Malha** a 0,5 m, Cu 50 mm² (1 405 m de cabo e 14 hastes de 3 m):
  - anel interno;
  - **um condutor em cada linha de pilares** de cada mesa;
  - transversal sob skid/trafo/SE e longitudinal no corredor;
  - anel da SE;
  - **anel de equalização** a 1 m da cerca, interligado nos cantos. O trecho de 12 m
    em frente ao portão falta no cenário com defeitos.
  - Área 4 212 m², diagonal 95 m.

## Ensaios e critérios

1. **Continuidade** (NBR 16274 · NBR 16690), do BEP do skid a 15 pontos: 10 mesas,
   inversores, trafo, SE, portão e cerca. ⚠ Critério adotado: ≤ 0,5 Ω / 0,5–1,0 Ω / > 1,0 Ω.
   - Defeitos: **M4** anodização (3,41 Ω), **M6** corrosão (0,63 Ω, oxidação visível no
     3D) e **portão sem cordoalha** (OL; a cordoalha some no 3D).
2. **Queda de potencial** (NBR 15749), com a curva R(x) pré-calculada:
   - estaca C em 90 / 190 / 280 / 470 m (1, 2, 3 e 5× a diagonal);
   - P a 52, 62 e 72 %; patamar ≤ 10 % (⚠);
   - só a 470 m há patamar (9,3 %). Nas outras distâncias a variação é de 14,8 %,
     20,7 % e 35,4 %;
   - **zona de influência** (V > 10 % do GPR pela estrada): ~198 m de E.
3. **Toque e passo** (NBR 15749 / NBR 15751, corpo de 50 kg confirmado por Pablo em
   11/09/2026, 500 A ⚠, 0,5 s ⚠):
   - toque = GPR − V(pés); passo = |V(pé 1) − V(pé 2)|, frações dos resultados;
   - o defeito é físico: sem o trecho do anel no portão, o toque ali vai de 10 % para
     22 % do GPR. No solo arenoso isso reprova (392 V > 287 V);
   - no solo rochoso, o portão reprova mesmo com a instalação íntegra.
4. **Laudo:** achados, ação e Rg calculada.

Rg calculada = 0,006983 Ω por Ω·m (6,5 % abaixo de Sverak, checado em teste):

| Solo | Resistividade | Rg | Veredito |
|---|---|---|---|
| Úmido | 100 Ω·m | 0,70 Ω | — |
| Arenoso | 500 Ω·m | 3,49 Ω | — |
| Rochoso | 2 000 Ω·m | 13,97 Ω | atenção |

## Resultados pré-calculados (`usinaFvResultados.ts`)

- Tudo **unitário** (ρ = 1 Ω·m, 1 A). A engine escala por ρ (solo) e por I (falta ou
  ensaio). Dois cenários: `conforme` e `com-defeitos`.
- Conteúdo:
  - `rg`;
  - `curvas[d]`: 101 pontos de R(x) por distância;
  - `fracoes[id]`: toque ou passo de cada ponto;
  - `influenciaEstradaM` e `centro`;
  - `MAPAS_FV`: V/GPR numa grade de 2 m com 40 m de margem, 79 × 67 valores de 0 a
    255 em base64.
- `GEOMETRIA_CALCULADA` guarda a assinatura da malha. **Se a malha ou as distâncias
  mudarem, o teste falha até recalcular.**
- **Recalcular:** o gerador **não fica neste repositório**. Está numa pasta local à
  parte, sem git: `C:\Users\Pablo\Documents\Meus projetos\SimuPower-gerador-usina-fv\`
  (decisão do Pablo, 11/09/2026). O `README.md` de lá explica quando e como rodar
  (`npx vite-node …\gerar.ts`, a partir da pasta do SimuPower). O gerador reproduz este
  arquivo byte a byte. O GroundPRO **não** foi alterado.
- Limitações:
  - só os cabos entram no mapa, como no GroundPRO;
  - solo homogêneo;
  - a estaca C é tratada como fonte pontual.

## O que existe no 3D (placeholder do Claude)

**Ambiente:**
- gramado, estrada, brita;
- 540 módulos instanciados;
- pilares e longarinas;
- skid, trafo com radiadores e buchas, cabine, poste com a derivação MT;
- cerca alambrado e portão;
- rótulos.

**Camada didática** (lida do store; **fica mesmo depois do GLB**):
- **Malha enterrada** vista através do solo (com o vão do anel no cenário com defeitos),
  hastes e derivações das mesas.
- **Continuidade:**
  - maleta do miliohmímetro no BEP, com a leitura em rótulo;
  - cabo até o ponto ativo;
  - marcadores coloridos pelo resultado.
- **Queda de potencial:**
  - terrômetro junto a E;
  - estacas P e C com farol;
  - cabos e setas de corrente animadas (C → solo → malha → E);
  - marcos a cada 50 m;
  - **faixa âmbar da zona de influência** e **faixa da janela do patamar** (verde fora
    da zona, vermelha dentro).
- **Toque e passo:**
  - placas de pé coloridas;
  - **pessoa** no ponto ativo (mão na massa ou pernas abertas 1 m);
  - **mapa de potencial no solo** com a escala de 16 cores do GroundPRO, ou **modo
    áreas seguras** (verde, âmbar para toque e vermelho para passo acima do limite),
    com legenda no HUD.

## ⚠ Pendências com o Pablo

1. Configuração da usina de 300 kW: 555 Wp, 10 mesas 2P×27, 3 × 100 kW, 300 kVA,
   13,8 kV.
2. Edições e itens exatos das NBR 16690, 16274, 15749 e 15751.
3. Critérios adotados:
   - continuidade: 0,5 / 1,0 Ω;
   - malha: ≤ 10 Ω;
   - patamar: ≤ 10 %;
   - estaca C a 5× a diagonal;
   - falta: 500 A e 0,5 s;
   - brita: 3 000 Ω·m × 10 cm.
4. Solo em 2 camadas (o GroundPRO tem; aqui é homogêneo). SPDA da usina fora do escopo;
   se entrar, NBR 5419:2026.

## Mudanças fora da área do Claude (mínimas, avisadas)

- `src/scene/UsinaFvElements.tsx`: arquivo novo. O Codex passa a ser dono no handoff.
- `src/scene/Stage.tsx`: só o ramo `usina-fv` (flag `ehUsina`, câmera e limites para a
  planta de 300 kW, sol ao norte, frustum de sombra ±50 m, `tourMode`, sem bloom e sem
  `Outdoor`).
- `src/design/tokens.ts`: paleta `color.usinaFv`, incluindo `escalaPotencial` (16
  paradas do GroundPRO) e as cores da pessoa.
- Reuso de `SetasCorrente` (de `scene/SpdaFluxo.tsx`) sem alterá-lo.

## Checklist de handoff para o Codex

### Terrômetro compartilhado — Codex, 11/09/2026

Pedido do Pablo: usar o terrômetro do módulo de queda de potencial na FV.
Extraído `ModeloTerrometro` de `scene/Terrometro.tsx`, reutilizando o mesmo GLB
`models/terrometro-minipa.glb` (Minipa MTR-1522), escala, orientação e tapete.
O módulo original continua usando o mesmo componente. Na FV substitui apenas a
caixa provisória, mantendo a posição junto a E e ajustando a saída visual dos
cabos à altura do aparelho. Estacas, distâncias, leituras, mapa e critérios
preservados. Leitura no HUD, como no módulo original. Sem deploy.

### Operador com modelo do arco — Codex, 11/09/2026

Pedido do Pablo: substituir a figura simplificada por um operador mais detalhado.
`OperadorFv.tsx` reutiliza `models/colaborador.glb` (capacete, viseira, uniforme,
luvas e botas), normalizado para 1,75 m. O original estático do arco permanece
intacto; a cópia da FV adapta a postura aos pontos existentes, com geometria e
materiais próprios. Posições quantizadas do asset são convertidas para Float32
antes da adaptação; transição suave das pernas evita descontinuidades no uniforme.
Centros das solas no passo em X = ±0,5 m, Z = 0; mão alinhada ao alvo catalogado.
Mantém anéis/placas de pé e renderiza depois do relevo, com teste de profundidade
para impedir que faces do próprio uniforme se sobreponham incorretamente.
Buffers próprios descartados ao trocar de ponto. Nenhuma alteração na física,
no modelo de corpo de 50 kg, nos pontos ou nos resultados pré-calculados.
Navegador conferiu toque e passo; console sem erros. Build e 138 testes aprovados,
incluindo testes geométricos de altura, contato, pés e preservação do GLB original.

### Aula rápida, Inbrat e menu — Codex, 11/09/2026

- Pedido do Pablo: botão opcional “Executar todos os testes da etapa”. Em
  continuidade, compensa as pontas e mede 15 massas; em resistência, crava e
  registra 52/62/72% na distância C escolhida, calculando o patamar; em toque e
  passo, mede os seis pontos. Marca a etapa concluída, sem avançar para outro
  ensaio nem emitir o laudo da usina automaticamente. Preparação/inspeção continuam
  pré-requisitos. Resultado inconclusivo/reprovado não é convertido em aprovação.
- `sim/testesEmLote.ts` orquestra as ações manuais existentes; sete testes de
  equivalência/travas cobrem FV e ambos os SPDA. Mudanças autorizadas fora da área
  exclusiva: novo orquestrador/testes e controles nos HUDs, inclusive mobile.
  Engine, critérios, resultados pré-calculados e stores existentes preservados.
- Continuidade FV agora reutiliza `scene/Inbrat.tsx`: maleta ampliada, duas garras,
  dois PP com P1/C1 e P2/C2. Entrada externa reduzida a coordenadas, sem inventar
  parâmetros elétricos de SPDA para FV. Posição original da maleta mantida;
  “Ver Inbrat” usa a câmera calibrada do skid apontando para essa posição.
- Menu: filtros superiores Todos os ensaios, Aterramento e usina FV, SPDA.
  Texto da usina atualizado para mencionar mapa/relevo e Inbrat.
- Validação: build e 136/136 testes. Navegador confirmou 15/15 continuidades,
  resistência a 190 m inconclusiva por ausência de patamar, 6/6 toque/passo,
  Inbrat com cabos e filtros 2+2 no menu. Sem deploy.
- Potenciais continuam na etapa 5, botões Potencial, Relevo 3D e Seguras. A malha
  enterrada mostra condutores; é uma visualização distinta do potencial do solo.

### Painéis recolhíveis e oclusão do subsolo — Codex, 11/09/2026

- Pedido do Pablo: minimizar os painéis laterais em todas as simulações.
  `ui/PainelRecolhivel.tsx` aplicado aos 17 painéis desktop dos nove HUDs.
  Controles independentes, acessíveis por teclado, mantêm os filhos montados;
  ocultar não reinicia entradas nem medições. MobileSheet existente preservado.
  Alterações fora da área exclusiva do Codex limitadas aos contêineres dos HUDs.
- Malha FV: retirado o desenho sobre todos os objetos (`depthTest=false`).
  Solo, acesso, estrada e brita desenhados primeiro sem escrever profundidade;
  condutores mantêm as coordenadas enterradas, teste de profundidade e opacidade
  de 55%. Equipamentos e módulos ocultam os condutores que ficam atrás deles.
  Nenhuma alteração de geometria elétrica, engine, store ou resultados.
- Navegador: malha sem sobreposição às mesas, ambos os painéis minimizados e
  reabertos com opções preservadas; console sem erros. Build e 129 testes aprovados.

### Controle dos nomes — Codex, 11/09/2026

Pedido do Pablo: opção “Mostrar nomes dos itens” nas configurações e no painel
da usina, compartilhados por desktop/mobile. Oculta os rótulos gerais das mesas,
skid, trafo, subestação e portão; indicações do ensaio e valores do mapa continuam
visíveis. Ativada ao iniciar um ensaio. Alterações mínimas autorizadas pelo pedido
em `src/ui/UsinaFvHud.tsx` e `src/sim/usinaFvStore.ts`: controle e estado visual;
sem mudanças nos cálculos, dados elétricos ou resultados.

- [x] Modelar a usina de 300 kW respeitando as posições acima. Mover algo muda a malha
      e **exige recalcular os resultados**: alinhar antes.
- [x] 540 módulos por instância (um módulo modelado uma vez), respeitando `cfg.tier`.
- [x] Bruto em `assets-raw/models/`, otimizado em `public/models/usina-fv.glb`, sem
      Draco/meshopt; conferir se não houve rotação (AGENTS.md).
- [x] `usinaFv.modelPath = 'models/usina-fv.glb'`, `escalaAlvo` e
      `USINA_PROCEDURAL = false`. A camada didática continua.
- [ ] Recapturar `BEP_SKID`, `pos`/`vista`/`alvo` dos pontos, `ESTACAS_FV.e`,
      `VISTAS_FV` e `vistaInicial`. Não renomear ids.
- [ ] Opcional:
  - trocar a pessoa procedural por um personagem;
  - modelos do miliohmímetro e do terrômetro;
  - estacas e carretéis de cabo.
- [ ] `npm run build`, `npm test`, desktop e 390 × 844; commit.

## Prompt atual do Codex (11/09/2026)

### Entrega Codex — ambiente definitivo e relevo (11/09/2026)

- `public/models/usina-fv.glb`: **2.132.108 bytes**. Kit separado:
  `public/models/usina-fv-kit.glb`, **1.227.132 bytes**. Sem texturas externas,
  Draco, meshopt ou quantize. Geometrias compartilhadas e materiais reutilizados.
- Fonte reproduzível: `scripts/gerar-usina-fv.ts`. Executar
  `node node_modules/vite-node/vite-node.mjs scripts/gerar-usina-fv.ts`.
  Também grava os brutos em `assets-raw/models/` (ignorados pelo Git) e o manifesto
  `public/models/usina-fv-kit.json`, com dimensões completas e pivôs.
- Mesmas peças usadas no kit e na usina: 540 módulos a 20° para norte, 140 pilares,
  terças, células e caixas de junção; skid aberto com três inversores numerados,
  QGBT e porta; trafo com radiadores, buchas e conservador; cabine ventilada,
  poste com equipamentos MT, alambrado e portão. Solo com grama, estrada e brita;
  ondulação externa suave, mantendo a planta e o corredor das estacas planos.
- `UsinaFvModelo.tsx` preserva origem e escala métrica sem a normalização do
  `Equipment3D`. Agrupa matrizes em `InstancedMesh`; detalhes finos saem no perfil
  baixo, e linhas das células desaparecem gradualmente à distância. Fallback
  procedural em carregamento/erro. `USINA_PROCEDURAL = false`.
- BEP, derivações, oxidação da M6 e cordoalha removível permanecem na camada
  didática. Nenhum arquivo de engine, store, HUD ou resultados foi alterado.

Dimensões máximas X × Y × Z em metros, incluindo bases, ferragens e portas abertas
quando presentes. Todos os nós raiz do kit têm transformação identidade e pivô
no solo; módulos usam a base local da peça. Folgas inferiores da cerca são intencionais.

| Nó | Dimensões (m) |
|---|---|
| `kit_modulo` | 1,134 × 0,039 × 2,278 |
| `kit_mesa_estaca` | 0,090 × 1,000 × 0,055; altura parametrizada na montagem |
| `kit_mesa_terca` | 1,000 × 0,065 × 0,035; comprimento parametrizado |
| `kit_skid` | 6,660 × 2,910 × 4,698; contêiner 6,06 × 2,60 × 2,44 |
| `kit_trafo` | 3,000 × 2,640 × 2,500 |
| `kit_cabine` | 4,900 × 3,200 × 3,900 |
| `kit_poste_mt` | 2,500 × 11,000 × 0,835 |
| `kit_cerca_mourao` | 0,061 × 2,313 × 0,176 |
| `kit_cerca_painel` | 3,005 × 2,222 × 0,088 |
| `kit_portao` | 3,992 × 2,002 × 0,060; vão nominal 4 m |
| `kit_caixa_inspecao` | 0,400 × 0,095 × 0,400 |

**Relevo:** uma malha com cores por vértice, altura `rel × 12 m`, subdivisão
bilinear nos perfis médio/alto e grade original no baixo. Equipotenciais de 10%
a 90%, sem desenhar a área constante do platô; rótulos em volts nas curvas pares
existentes dentro da grade. Transparência, pessoa visível e linha vertical sob os
pés. Transição de 0,6 s e respeito a movimento reduzido. Buffers visuais descartados
na substituição. Apenas leitura dos resultados existentes; nenhum solver incluído.

**Calibração:** modelo construído nas coordenadas originais, sem mover planta,
contatos, E ou câmeras catalogadas. Captura real da câmera do skid confirmou
`pos: [-3, 7, 7]`, `alvo: [-7, 1, 15.5]`. Um pick da saia do skid retornou
`[-6.26, 0.40, 15.40]`; não foi usado como contato. Não houve recaptura individual
de todos os contatos: o checklist correspondente continua aberto, sem inventar
coordenadas. Os testes conferem as 140 posições de pilares e a orientação dos
540 módulos. No retrato, a cena afasta a vista geral mantendo sua direção e alvo.

**Conferência no navegador:** desktop 1440 × 900 percorreu os seis passos até
emitir laudo, com 15 continuidades, curva de queda de potencial a 470 m e seis
medições de toque/passo. Quatro modos do mapa exercitados. Em 390 × 844, navegação
pelas seis etapas e quatro modos, enquadramento geral do relevo e pessoa no portão
conferidos; não repetida toda a sequência de medições mobile. Perfil baixo e
cenário com defeitos conferidos: portão 392 V / limite 287 V. Console sem erros
ou avisos nessa conferência. O texto antigo “ambiente provisório” no menu permanece
porque o HUD foi expressamente excluído do escopo. Sem deploy.

**Validação automatizada:** build e 129 testes (123 existentes + 6 geométricos)
aprovados. Os novos testes cobrem kit, instâncias, coordenadas, interpolação e
equipotenciais. O aviso de tamanho do chunk Three no build já existia.

Pablo escolheu duas frentes para o Codex: **modelo 3D definitivo** e **"montanha de
potencial"** (modo Relevo 3D, com linhas equipotenciais). O texto completo para colar
está em `docs/modulos/PROMPT-CODEX-usina-fv.md`. O modo `relevo` já existe no store e
no HUD (`ModoMapaFv`); falta só desenhar em `MapaPotencial`.

## Revisão das pernas do operador — Codex, 11/09/2026

- Corrigida a torção causada pelo deslocamento dos vértices das pernas do GLB,
  cuja pose original tinha um pé adiantado. O tronco e os EPIs são preservados;
  quadril, pernas e botas são construídos separadamente para a postura FV.
- Cada joelho permanece do mesmo lado do respectivo pé. Botas paralelas, solas
  no piso e marcadores centralizados: 0,24 m entre os centros no toque e 1 m no
  passo. Modelo original do arco e coordenadas elétricas permanecem intactos.
- Conferência visual desktop no navegador: toque no tanque e passo junto ao
  transformador, com painéis recolhidos. Mobile não repetido nesta correção.
- Testes geométricos verificam pernas sem cruzamento, botas com orientação
  idêntica, apoio no piso e ausência de deformação acumulada ao alternar modos.
  Build aprovado, 141/141 testes; aviso preexistente de tamanho do chunk Three.
  Sem deploy.

## Briefing para colar no Codex (versão curta anterior)

> Leia `AGENTS.md` e `docs/modulos/aterramento-usina-fv.md`. Na branch
> `feat/aterramento-usina-fv`, o módulo "Aterramento em Usina Fotovoltaica" (300 kW)
> já roda com cenário procedural em `src/scene/UsinaFvElements.tsx`, incluindo a camada
> didática (malha enterrada, estacas, mapa de potencial, pessoa de toque/passo). Sua
> tarefa é o ambiente definitivo: modelar a usina de solo respeitando as posições de
> `src/catalog/usinaFvPontos.ts`:
> - 540 módulos em 10 mesas 2P×27 a 20°, voltadas para −Z;
> - skid contêiner, transformador de 300 kVA sobre base;
> - cabine de medição e proteção, poste MT;
> - cerca com portão ao sul, brita e estrada.
>
> Entregue em `public/models/usina-fv.glb`, preencha `modelPath`, desligue
> `USINA_PROCEDURAL` e recalibre só os campos `CALIBRAR (CODEX)`. Não mova a planta sem
> alinhar: a malha e os resultados pré-calculados (`usinaFvResultados.ts`) dependem das
> posições. Não mexa em engine, store, HUD, resultados nem nos dados elétricos.
> Registre o que fez neste contrato.

## Validação — 11/09/2026 (revisão 300 kW)

- `npm run build` aprovado; `npm test` 123/123.
- Navegador desktop (localhost:5174):
  - planta de 300 kW e mapa de potencial no toque/passo;
  - toque no trafo 100 V / 711 V, com a pessoa;
  - portão com o anel interrompido: 392 V / 287 V, reprovado;
  - modo "Áreas seguras";
  - queda de potencial com a zona de influência de ~198 m e o aviso a 280 m.
  - Sem erros no console.
- O fluxo completo da versão de 100 kW foi validado antes; nesta revisão não refiz os
  6 passos do início ao fim no navegador. Celular ainda não conferido nesta revisão.

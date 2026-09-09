# SimuPower — instruções para o Claude Code

O contexto do projeto (stack, arquitetura, convenções e a **divisão de trabalho com o
Codex**) está em `AGENTS.md` — arquivo único, lido pelos dois agentes:

@AGENTS.md

## Específico do Claude nesta base

- **Minha área**: `src/engine/**`, `src/sim/**`, `src/ui/**`, `src/catalog/tests/**`,
  testes e o wiring (`App.tsx`, `catalog/index.ts`, `MainMenu.tsx`).
  **Cena e modelos 3D (`src/scene/**`, `public/models/**`) são do Codex** — só encosto
  neles para criar o placeholder/o ramo no `Stage.tsx` de um módulo novo, e aviso.
- Antes de entregar: `npm run build` **e** `npm test` (ambos limpos) e uma linha nova no
  `ROADMAP.md`.
- Antes de escrever um módulo, ler o `TestProcedure` e o HUD do módulo mais parecido —
  o padrão de passos/travas/laudo é copiado de propósito, não reinventado.
- Números de norma que eu não tenho certeza: implemento como constante nomeada no topo
  da engine, com comentário `⚠ REVISAR COM O PABLO`, e aviso na resposta.
- Contratos dos módulos em construção: `docs/modulos/`.

/**
 * recursos.ts — Todos os textos de interface, descobertos pelos arquivos.
 *
 * Cada `locales/<idioma>/<namespace>.json` vira um namespace sozinho: módulo novo
 * só cria os três JSON, sem registrar nada aqui nem no teste (que lê esta mesma
 * lista). Separado de `config.ts` para os testes não carregarem o i18next.
 */
import { IDIOMAS, type Idioma } from './idiomas'

type Pacote = Record<string, unknown>

const arquivos = import.meta.glob<Pacote>('./locales/*/*.json', { eager: true, import: 'default' })

export const RECURSOS = Object.fromEntries(IDIOMAS.map((l) => [l, {} as Record<string, Pacote>])) as Record<
  Idioma,
  Record<string, Pacote>
>

for (const [caminho, pacote] of Object.entries(arquivos)) {
  const m = caminho.match(/\.\/locales\/(\w+)\/([\w-]+)\.json$/)
  if (!m) continue
  const [, idioma, ns] = m
  if (idioma in RECURSOS) RECURSOS[idioma as Idioma][ns] = pacote
}

/** Namespaces do português (a referência: os outros idiomas têm que ter os mesmos). */
export const NAMESPACES = Object.keys(RECURSOS.pt)

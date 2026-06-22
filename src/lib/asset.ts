/**
 * asset.ts — Resolve o caminho de um arquivo de `public/` respeitando o base
 * do deploy (`import.meta.env.BASE_URL`).
 *
 * POR QUÊ: caminhos absolutos como `/sounds/voz/x.mp3` apontam para a RAIZ do
 * domínio. Quando o app é servido sob um subcaminho (ex.: GitHub Pages em
 * `usuario.github.io/repo/`), a raiz não é o app → 404 (foi o caso da locução
 * do narrador não carregar). Prefixar com BASE_URL torna o caminho relativo ao
 * app, funcionando tanto em `/` quanto em `/repo/` quanto em `./`.
 *
 * Use SEMPRE isto para montar URLs de assets em runtime: `new Audio(asset(...))`,
 * `useGLTF(asset(...))`, `<img src={asset(...)} />`.
 */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}

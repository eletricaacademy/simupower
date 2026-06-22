/**
 * Watermark — marca d'água discreta do SimuPower, exibida em todos os ensaios.
 * Fica atrás do HUD, sem capturar cliques.
 */
export function Watermark() {
  return (
    <div
      className="absolute inset-0 grid place-items-center pointer-events-none select-none"
      style={{ zIndex: 1 }}
      aria-hidden
    >
      <img
        src="brand/logo-horizontal.png"
        alt=""
        style={{ width: '18vw', maxWidth: 240, opacity: 0.045 }}
      />
    </div>
  )
}

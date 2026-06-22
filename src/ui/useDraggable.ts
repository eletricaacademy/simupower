import { useRef, useState } from 'react'

/**
 * useDraggable — torna um painel arrastável por um "handle" (cabeçalho).
 * `style` vai no container; `handlers` no elemento do cabeçalho.
 */
export function useDraggable() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      drag.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y }
      ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current
      if (!d) return
      setPos({ x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) })
    },
    onPointerUp: () => {
      drag.current = null
    },
    onPointerCancel: () => {
      drag.current = null
    },
  }

  /** estilo do container (posição) */
  const style: React.CSSProperties = { transform: `translate(${pos.x}px, ${pos.y}px)` }
  /** estilo do cabeçalho (cursor/touch) — mescle com o seu */
  const handleStyle: React.CSSProperties = { touchAction: 'none', cursor: 'move' }
  return { style, handlers, handleStyle }
}

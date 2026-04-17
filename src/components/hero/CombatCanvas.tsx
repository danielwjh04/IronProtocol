import { useEffect, useRef } from 'react'
import { useUIMode } from '../../context/UIModeContext'

const FRAME_COUNT = 8
const FRAME_MS = 80
const CANVAS_SIZE = 96

function drawPixelFist(
  ctx: CanvasRenderingContext2D,
  frame: number,
  intensity: number,
) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  const scale = 1 + intensity * 0.4
  ctx.save()
  ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2)
  ctx.scale(scale, scale)
  ctx.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2)

  const phase = frame / FRAME_COUNT
  const offsetY = Math.sin(phase * Math.PI * 2) * 6

  const px = 6
  const grid: [number, number, string][] = [
    [3, 2 + offsetY / px, '#facc15'],
    [4, 2 + offsetY / px, '#facc15'],
    [5, 2 + offsetY / px, '#facc15'],
    [3, 3 + offsetY / px, '#fbbf24'],
    [4, 3 + offsetY / px, '#fbbf24'],
    [5, 3 + offsetY / px, '#fbbf24'],
    [2, 4 + offsetY / px, '#f59e0b'],
    [3, 4 + offsetY / px, '#f59e0b'],
    [4, 4 + offsetY / px, '#f59e0b'],
    [5, 4 + offsetY / px, '#f59e0b'],
    [6, 4 + offsetY / px, '#f59e0b'],
    [2, 5 + offsetY / px, '#d97706'],
    [3, 5 + offsetY / px, '#d97706'],
    [4, 5 + offsetY / px, '#d97706'],
    [5, 5 + offsetY / px, '#d97706'],
    [6, 5 + offsetY / px, '#d97706'],
    [3, 6 + offsetY / px, '#d97706'],
    [4, 6 + offsetY / px, '#d97706'],
    [5, 6 + offsetY / px, '#d97706'],
    [3, 7 + offsetY / px, '#92400e'],
    [4, 7 + offsetY / px, '#92400e'],
    [5, 7 + offsetY / px, '#92400e'],
  ]

  for (const [col, row, color] of grid) {
    ctx.fillStyle = color
    ctx.fillRect(
      Math.round(col * px + (CANVAS_SIZE - 9 * px) / 2),
      Math.round(row * px),
      px,
      px,
    )
  }

  ctx.restore()
}

export function CombatCanvas() {
  const { pendingBash } = useUIMode()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (!pendingBash) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let last = 0

    function step(ts: number) {
      if (ts - last >= FRAME_MS) {
        drawPixelFist(ctx!, frame % FRAME_COUNT, pendingBash!.intensity)
        frame++
        last = ts
      }
      if (frame < FRAME_COUNT * 2) {
        animRef.current = requestAnimationFrame(step)
      } else {
        ctx!.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      }
    }

    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    }
  }, [pendingBash?.id])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{
        imageRendering: 'pixelated',
        position: 'fixed',
        bottom: 80,
        right: 24,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  )
}

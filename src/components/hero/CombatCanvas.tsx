import { useEffect, useRef } from 'react'
import { useUIMode } from '../../context/UIModeContext'

const CANVAS_W   = 220
const CANVAS_H   = 80
const FRAME_MS   = 65
const ATTACKER_X = 35
const MOB_X      = 170
const BASE_Y     = 38
const STRIKE_FRAME = 4

interface SequenceFrame {
  attackerOffsetX: number
  mobOffsetX:      number
  flashAlpha:      number
  shakeX:          number
}

export function buildSequence(intensity: number): SequenceFrame[] {
  const strike = 20 + intensity * 50
  const recoil = intensity * 28
  const flash  = intensity * 0.8
  const shake  = intensity * 6

  return [
    { attackerOffsetX: -5,          mobOffsetX: 0,          flashAlpha: 0,     shakeX: 0      },
    { attackerOffsetX: -10,         mobOffsetX: 0,          flashAlpha: 0,     shakeX: 0      },
    { attackerOffsetX: -10,         mobOffsetX: 0,          flashAlpha: 0,     shakeX: 0      },
    { attackerOffsetX: strike,      mobOffsetX: 0,          flashAlpha: 0,     shakeX: 0      },
    { attackerOffsetX: strike,      mobOffsetX: 0,          flashAlpha: flash, shakeX: shake  },
    { attackerOffsetX: strike,      mobOffsetX: 0,          flashAlpha: flash, shakeX: -shake },
    { attackerOffsetX: 5,           mobOffsetX: recoil,     flashAlpha: 0,     shakeX: 0      },
    { attackerOffsetX: 0,           mobOffsetX: recoil,     flashAlpha: 0,     shakeX: 0      },
    { attackerOffsetX: 0,           mobOffsetX: recoil / 2, flashAlpha: 0,     shakeX: 0      },
    { attackerOffsetX: 0,           mobOffsetX: 0,          flashAlpha: 0,     shakeX: 0      },
  ]
}

function drawAttacker(ctx: CanvasRenderingContext2D, offsetX: number): void {
  const px = 6
  const ox = ATTACKER_X + offsetX
  const oy = BASE_Y - 22

  const pixels: [number, number, string][] = [
    [0, 0, '#facc15'], [1, 0, '#facc15'], [2, 0, '#facc15'],
    [0, 1, '#fbbf24'], [1, 1, '#fbbf24'], [2, 1, '#fbbf24'],
    [-1, 2, '#f59e0b'], [0, 2, '#f59e0b'], [1, 2, '#f59e0b'], [2, 2, '#f59e0b'], [3, 2, '#f59e0b'],
    [-1, 3, '#d97706'], [0, 3, '#d97706'], [1, 3, '#d97706'], [2, 3, '#d97706'], [3, 3, '#d97706'],
    [0, 4, '#d97706'], [1, 4, '#d97706'], [2, 4, '#d97706'],
    [0, 5, '#92400e'], [1, 5, '#92400e'], [2, 5, '#92400e'],
  ]

  for (const [col, row, color] of pixels) {
    ctx.fillStyle = color
    ctx.fillRect(ox + col * px, oy + row * px, px, px)
  }
}

function drawMob(ctx: CanvasRenderingContext2D, offsetX: number): void {
  const px = 5
  const ox = MOB_X + offsetX - 8
  const oy = BASE_Y - 22

  const pixels: [number, number, string][] = [
    [0, 0, '#94a3b8'], [1, 0, '#94a3b8'], [2, 0, '#94a3b8'],
    [0, 1, '#cbd5e1'], [1, 1, '#e2e8f0'], [2, 1, '#cbd5e1'],
    [0, 2, '#94a3b8'], [1, 2, '#94a3b8'], [2, 2, '#94a3b8'],
    [-1, 3, '#ef4444'], [0, 3, '#ef4444'], [1, 3, '#ef4444'], [2, 3, '#ef4444'], [3, 3, '#ef4444'],
    [-1, 4, '#dc2626'], [0, 4, '#dc2626'], [1, 4, '#dc2626'], [2, 4, '#dc2626'], [3, 4, '#dc2626'],
    [-1, 5, '#dc2626'], [0, 5, '#dc2626'], [1, 5, '#dc2626'], [2, 5, '#dc2626'], [3, 5, '#dc2626'],
    [0, 6, '#b91c1c'], [1, 6, '#b91c1c'], [2, 6, '#b91c1c'],
    [0, 7, '#7f1d1d'], [2, 7, '#7f1d1d'],
    [0, 8, '#7f1d1d'], [2, 8, '#7f1d1d'],
  ]

  for (const [col, row, color] of pixels) {
    ctx.fillStyle = color
    ctx.fillRect(ox + col * px, oy + row * px, px, px)
  }
}

function drawFrame(ctx: CanvasRenderingContext2D, frame: SequenceFrame): void {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.save()
  if (frame.shakeX !== 0) ctx.translate(frame.shakeX, 0)
  drawAttacker(ctx, frame.attackerOffsetX)
  drawMob(ctx, frame.mobOffsetX)
  if (frame.flashAlpha > 0) {
    ctx.fillStyle = `rgba(255,255,255,${frame.flashAlpha})`
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }
  ctx.restore()
}

interface CombatCanvasProps {
  onStrike?: (intensity: number) => void
}

export function CombatCanvas({ onStrike }: CombatCanvasProps) {
  const { pendingBash } = useUIMode()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number | null>(null)

  useEffect(() => {
    if (!pendingBash) return
    const { intensity } = pendingBash
    const canvas = canvasRef.current
    if (!canvas) return
    const rawCtx = canvas.getContext('2d')
    if (!rawCtx) return
    const ctx: CanvasRenderingContext2D = rawCtx

    const sequence = buildSequence(intensity)
    let frameIdx = 0
    let last = 0

    function step(ts: number) {
      try {
        if (ts - last >= FRAME_MS) {
          if (frameIdx < sequence.length) {
            drawFrame(ctx, sequence[frameIdx])
            if (frameIdx === STRIKE_FRAME) onStrike?.(intensity)
            frameIdx++
            last = ts
          }
        }
      } catch (e) {
        if (animRef.current !== null) cancelAnimationFrame(animRef.current)
        throw e
      }
      if (frameIdx < sequence.length) {
        animRef.current = requestAnimationFrame(step)
      } else {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
        animRef.current = null
      }
    }

    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current)
        animRef.current = null
      }
    }
  }, [pendingBash?.id, onStrike])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        imageRendering: 'pixelated',
        position:       'fixed',
        bottom:          80,
        right:           24,
        pointerEvents:  'none',
        zIndex:          9998,
      }}
    />
  )
}

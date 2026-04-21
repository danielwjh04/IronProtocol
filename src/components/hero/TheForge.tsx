import { useEffect, useRef } from 'react'
import { useHeroProgress } from '../../hooks/useHeroProgress'

interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
  decay: number
  hue: number
}

const W = 280
const H = 200

// eslint-disable-next-line react-refresh/only-export-components -- pure helper co-located with its sole consumer
export function spawnEmber(progress: number): Ember {
  const speed = 0.6 + progress * 2.8
  return {
    x: W / 2 + (Math.random() - 0.5) * (40 + 60 * progress),
    y: H - 8,
    vx: (Math.random() - 0.5) * 1.4,
    vy: -(speed + Math.random() * speed),
    radius: 0.8 + Math.random() * 2.2 * progress,
    alpha: 0.5 + Math.random() * 0.5,
    decay: 0.007 + Math.random() * 0.014,
    hue: Math.random() < 0.65 ? 15 : 38,
  }
}

export function TheForge() {
  const { progress } = useHeroProgress()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const embersRef = useRef<Ember[]>([])
  const rafRef = useRef<number | null>(null)
  const progressRef = useRef(progress)
  const frameRef = useRef(0)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function tick() {
      try {
        const p = progressRef.current
        frameRef.current++

        const spawnInterval = Math.max(1, Math.round(12 / (1 + p * 9)))
        if (frameRef.current % spawnInterval === 0) {
          embersRef.current.push(spawnEmber(p))
        }

        if (embersRef.current.length > 150) {
          embersRef.current.splice(0, embersRef.current.length - 150)
        }

        ctx!.clearRect(0, 0, W, H)

        const glowAlpha = 0.08 + p * 0.52
        const grad = ctx!.createRadialGradient(W / 2, H, 5, W / 2, H, H * 0.85)
        grad.addColorStop(0, `rgba(255, 90, 10, ${glowAlpha})`)
        grad.addColorStop(0.45, `rgba(200, 35, 5, ${glowAlpha * 0.55})`)
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx!.fillStyle = grad
        ctx!.fillRect(0, 0, W, H)

        embersRef.current = embersRef.current.filter(e => e.alpha > 0)
        for (const e of embersRef.current) {
          e.x += e.vx
          e.y += e.vy
          e.alpha -= e.decay
          e.vx += (Math.random() - 0.5) * 0.12

          ctx!.beginPath()
          ctx!.arc(e.x, e.y, Math.max(0.4, e.radius), 0, Math.PI * 2)
          ctx!.fillStyle = `hsla(${e.hue}, 100%, 62%, ${Math.max(0, e.alpha)})`
          ctx!.fill()
        }
      } catch (e) {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        throw e
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        position: 'fixed',
        bottom: 80,
        left: 24,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  )
}

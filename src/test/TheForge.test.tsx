// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { spawnEmber, TheForge } from '../components/hero/TheForge'

describe('spawnEmber', () => {
  it('spawn at progress 0 has slower vy than at progress 1', () => {
    const dim = spawnEmber(0)
    const bright = spawnEmber(1)
    expect(Math.abs(bright.vy)).toBeGreaterThan(Math.abs(dim.vy))
  })

  it('spawn at progress 1 has larger radius than at progress 0', () => {
    const dim = spawnEmber(0)
    const bright = spawnEmber(1)
    expect(bright.radius).toBeGreaterThan(dim.radius)
  })

  it('alpha is always between 0 and 1', () => {
    for (let p = 0; p <= 1; p += 0.25) {
      const e = spawnEmber(p)
      expect(e.alpha).toBeGreaterThanOrEqual(0)
      expect(e.alpha).toBeLessThanOrEqual(1)
    }
  })

  it('hue is either 15 (orange) or 38 (amber)', () => {
    for (let i = 0; i < 20; i++) {
      const e = spawnEmber(0.5)
      expect([15, 38]).toContain(e.hue)
    }
  })
})

describe('TheForge', () => {
  it('renders a canvas element', () => {
    const { container } = render(<TheForge />)
    expect(container.querySelector('canvas')).not.toBeNull()
  })

  it('canvas has fixed position style', () => {
    const { container } = render(<TheForge />)
    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    expect(canvas.style.position).toBe('fixed')
    expect(canvas.style.pointerEvents).toBe('none')
  })
})

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('framer-motion', async (importOriginal) => {
  const mod = await importOriginal<typeof import('framer-motion')>()
  return { ...mod, motion: new Proxy({}, { get: (_t, _prop) => (props: React.HTMLAttributes<HTMLElement>) => <div {...props} /> }) }
})

import { ObsidianStairs } from '../components/hero/ObsidianStairs'

describe('ObsidianStairs', () => {
  it('renders three parallax layers', () => {
    render(<ObsidianStairs progress={0.5} />)
    expect(screen.getByTestId('layer-fog')).toBeTruthy()
    expect(screen.getByTestId('layer-stairs')).toBeTruthy()
    expect(screen.getByTestId('layer-void')).toBeTruthy()
  })

  it('dims stairs at progress 0.0', () => {
    render(<ObsidianStairs progress={0} />)
    const stairs = screen.getByTestId('layer-stairs')
    expect(stairs.getAttribute('style') ?? '').toContain('opacity')
  })
})

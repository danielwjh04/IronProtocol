// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ImpactStars } from '../components/hero/ImpactStars'

describe('ImpactStars', () => {
  it('renders exactly 4 stars at intensity 0', () => {
    const { container } = render(
      <ImpactStars originX={0} originY={0} intensity={0} onDone={vi.fn()} />,
    )
    expect(container.querySelectorAll('div').length).toBe(4)
  })

  it('renders exactly 12 stars at intensity 1', () => {
    const { container } = render(
      <ImpactStars originX={0} originY={0} intensity={1} onDone={vi.fn()} />,
    )
    expect(container.querySelectorAll('div').length).toBe(12)
  })

  it('renders more stars at intensity 1 than at intensity 0.1', () => {
    const { container: low } = render(
      <ImpactStars originX={0} originY={0} intensity={0.1} onDone={vi.fn()} />,
    )
    const { container: high } = render(
      <ImpactStars originX={0} originY={0} intensity={1} onDone={vi.fn()} />,
    )
    expect(high.querySelectorAll('div').length).toBeGreaterThan(
      low.querySelectorAll('div').length,
    )
  })

  it('calls onDone after animation timeout', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<ImpactStars originX={0} originY={0} intensity={0.5} onDone={onDone} />)
    vi.advanceTimersByTime(1029)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDone).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

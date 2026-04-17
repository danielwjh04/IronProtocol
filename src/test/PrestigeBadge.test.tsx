// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PrestigeBadge } from '../components/PrestigeBadge'

describe('PrestigeBadge', () => {
  it('renders nothing when completedAscensions is 0', () => {
    const { container } = render(<PrestigeBadge ascensions={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders I for 1 ascension', () => {
    render(<PrestigeBadge ascensions={1} />)
    expect(screen.getByText('I')).toBeTruthy()
  })

  it('renders XIV for 14 ascensions', () => {
    render(<PrestigeBadge ascensions={14} />)
    expect(screen.getByText('XIV')).toBeTruthy()
  })

  it('renders V for 5 ascensions', () => {
    render(<PrestigeBadge ascensions={5} />)
    expect(screen.getByText('V')).toBeTruthy()
  })
})

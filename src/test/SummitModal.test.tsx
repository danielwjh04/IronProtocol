// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../hooks/useTrackProgress', () => ({
  useTrackProgress: vi.fn(() => ({ power: 0.5, hypertrophy: 0.5, active: 'power' })),
}))
vi.mock('../services/heroMathService', () => ({ ascend: vi.fn().mockResolvedValue(undefined) }))
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
             button: ({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...p}>{children}</button> },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { SummitModal } from '../components/hero/SummitModal'
import { useTrackProgress } from '../hooks/useTrackProgress'

const mockTrack = useTrackProgress as ReturnType<typeof vi.fn>

describe('SummitModal', () => {
  it('renders nothing when power < 1.0', () => {
    mockTrack.mockReturnValue({ power: 0.9, hypertrophy: 0, active: 'power' })
    const { container } = render(<SummitModal />)
    expect(container.firstChild).toBeNull()
  })

  it('renders when power >= 1.0', () => {
    mockTrack.mockReturnValue({ power: 1.0, hypertrophy: 0, active: 'power' })
    render(<SummitModal />)
    expect(screen.getByText(/The Summit is Attained/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Ascend/i })).toBeTruthy()
  })

  it('hides after Ascend is clicked', async () => {
    mockTrack.mockReturnValue({ power: 1.0, hypertrophy: 0, active: 'power' })
    render(<SummitModal />)
    fireEvent.click(screen.getByRole('button', { name: /Ascend/i }))
    expect(screen.queryByText(/The Summit is Attained/i)).toBeNull()
  })
})

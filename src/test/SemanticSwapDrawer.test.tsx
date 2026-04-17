// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SemanticSwapDrawer from '../components/SemanticSwapDrawer'

vi.mock('../hooks/useSemanticSwap', () => ({
  useSemanticSwap: vi.fn(),
}))

import { useSemanticSwap } from '../hooks/useSemanticSwap'
const mockUseSemanticSwap = vi.mocked(useSemanticSwap)

function baseHookState(overrides = {}) {
  return {
    status: 'idle' as const,
    swapResult: null,
    error: null,
    isLabAvailable: true,
    submit: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  }
}

const BASE_EXERCISE = { name: 'Back Squat', tier: 1 as const, muscleGroup: 'legs' }

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SemanticSwapDrawer', () => {
  it('renders Lab-only locked state when isLabAvailable is false', () => {
    mockUseSemanticSwap.mockReturnValue(baseHookState({ isLabAvailable: false }))
    render(
      <SemanticSwapDrawer
        exercise={BASE_EXERCISE}
        exerciseDB={[]}
        v11Contract={null}
        onSwapConfirmed={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/Lab Connection Required/i)).toBeInTheDocument()
  })

  it('disables submit button while status is loading', () => {
    mockUseSemanticSwap.mockReturnValue(baseHookState({ status: 'loading' }))
    render(
      <SemanticSwapDrawer
        exercise={BASE_EXERCISE}
        exerciseDB={[]}
        v11Contract={null}
        onSwapConfirmed={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
  })

  it('calls onSwapConfirmed with exercise name when Confirm is clicked', () => {
    const onSwapConfirmed = vi.fn()
    mockUseSemanticSwap.mockReturnValue(
      baseHookState({
        status: 'result',
        swapResult: {
          name: 'Leg Press',
          muscleGroup: 'legs',
          tier: 1 as const,
          reason: 'Good swap.',
          confidence: 'high' as const,
        },
      }),
    )
    render(
      <SemanticSwapDrawer
        exercise={BASE_EXERCISE}
        exerciseDB={[]}
        v11Contract={null}
        onSwapConfirmed={onSwapConfirmed}
        onClose={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /confirm swap/i }))
    expect(onSwapConfirmed).toHaveBeenCalledWith('Leg Press')
  })

  it('shows high confidence chip when confidence is high', () => {
    mockUseSemanticSwap.mockReturnValue(
      baseHookState({
        status: 'result',
        swapResult: {
          name: 'Leg Press',
          muscleGroup: 'legs',
          tier: 1 as const,
          reason: 'Good.',
          confidence: 'high' as const,
        },
      }),
    )
    render(
      <SemanticSwapDrawer
        exercise={BASE_EXERCISE}
        exerciseDB={[]}
        v11Contract={null}
        onSwapConfirmed={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument()
  })
})

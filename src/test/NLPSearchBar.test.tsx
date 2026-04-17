// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/localAIService', () => ({ subscribeToModelLoading: vi.fn(() => () => {}) }))
vi.mock('../services/exerciseSearchService', () => ({ searchExercises: vi.fn().mockResolvedValue([]) }))
vi.mock('../hooks/useDebouncedValue', () => ({ useDebouncedValue: (v: string) => v }))

import { NLPSearchBar } from '../components/Search/NLPSearchBar'

describe('NLPSearchBar', () => {
  it('renders with placeholder', () => {
    render(<NLPSearchBar onSelect={vi.fn()} placeholder="Search exercises..." />)
    expect(screen.getByPlaceholderText('Search exercises...')).toBeTruthy()
  })

  it('updates value on change', () => {
    render(<NLPSearchBar onSelect={vi.fn()} placeholder="Search" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'bench' } })
    expect((input as HTMLInputElement).value).toBe('bench')
  })
})

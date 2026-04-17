// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('dexie-react-hooks', () => ({ useLiveQuery: vi.fn(() => []) }))
vi.mock('../db/db', () => ({ db: { personalBests: {} } }))

import { useLightningOnPR } from '../hooks/useLightningOnPR'

describe('useLightningOnPR', () => {
  it('starts with no strike', () => {
    const { result } = renderHook(() => useLightningOnPR())
    expect(result.current.striking).toBe(false)
  })
})

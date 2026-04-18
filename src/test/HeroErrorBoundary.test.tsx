// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HeroErrorBoundary } from '../components/UI/HeroErrorBoundary'

const Boom = () => { throw new Error('canvas crash') }

describe('HeroErrorBoundary', () => {
  it('renders nothing and calls onFallback when child throws', () => {
    const onFallback = vi.fn()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(
      <HeroErrorBoundary onFallback={onFallback}><Boom /></HeroErrorBoundary>
    )
    expect(container.firstChild).toBeNull()
    expect(onFallback).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('renders children when no error', () => {
    render(<HeroErrorBoundary onFallback={vi.fn()}><span>ok</span></HeroErrorBoundary>)
    expect(screen.getByText('ok')).toBeTruthy()
  })
})

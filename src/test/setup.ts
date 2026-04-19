import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

class InMemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

const memoryStorage = new InMemoryStorage()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: memoryStorage,
})
if (typeof (globalThis as { window?: unknown }).window === 'object' && (globalThis as { window?: Record<string, unknown> }).window) {
  Object.defineProperty((globalThis as { window: Record<string, unknown> }).window, 'localStorage', {
    configurable: true,
    writable: true,
    value: memoryStorage,
  })
}

afterEach(() => cleanup())
afterEach(() => {
  memoryStorage.clear()
})

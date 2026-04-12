import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
  },
})
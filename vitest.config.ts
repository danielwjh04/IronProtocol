import { defineConfig, configDefaults } from 'vitest/config'
import os from 'os'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
    execArgv: [
      '--localstorage-file',
      path.join(os.tmpdir(), 'vitest-localstorage.json'),
    ],
  },
})

import { defineConfig, configDefaults } from 'vitest/config'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      vitest: path.resolve(__dirname, 'src/test/vitest-shim.ts'),
    },
  },
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
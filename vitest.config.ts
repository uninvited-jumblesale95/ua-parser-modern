import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    benchmark: {
      include: ['bench/**/*.bench.ts'],
    },
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['test/**/*.test-d.ts'],
      tsconfig: './tsconfig.json',
    },
  },
})

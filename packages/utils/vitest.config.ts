import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    root: __dirname,
    globals: true,
    mockReset: true,
    setupFiles: [
      './mock-math-random.ts',
    ],
    resolveSnapshotPath(path, extension) {
      return path.replace('.spec', extension)
    },
  },
})

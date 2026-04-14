import { defineConfig } from 'tsup'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { version } = require('./package.json')

export default defineConfig({
  entry: [
    'src/todo-index.ts',
    'src/cli.ts',
    'src/create-mcp-config.ts',
    'src/auth-server.ts',
    'src/setup.ts',
    'src/token-manager.ts'
  ],
  outDir: 'dist',
  format: ['esm'],
  target: 'node16',
  shims: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  external: ['dotenv'],
  define: {
    __VERSION__: JSON.stringify(version),
  },
  esbuildOptions(options) {
    options.platform = 'node'
  }
})
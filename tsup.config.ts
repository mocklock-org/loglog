import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'client': 'src/client.ts',
    'server': 'src/server.ts',
    'react': 'src/react.tsx'
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  sourcemap: true,
  minify: true,
  target: 'es2020',
  external: ['react', 'rotating-file-stream'],
  esbuildOptions(options) {
    options.conditions = ['import', 'module', 'require', 'default'];
  },
}); 
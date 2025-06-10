import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/client.ts',
    'src/server.ts',
    'src/react.ts',
    'src/cli.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  treeshake: true,
  minify: true,
  target: 'es2020',
  external: ['react', 'rotating-file-stream'],
  esbuildOptions(options) {
    options.conditions = ['import', 'module', 'require', 'default'];
  },
}); 
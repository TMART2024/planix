import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts', 'src/migrate.ts'],
  format: ['esm'],
  outDir: 'dist',
  target: 'node20',
  clean: true,
  sourcemap: true,
  // Bundle the workspace package (its main points at TypeScript source) so the
  // compiled output is runnable by plain `node` with no path aliasing.
  noExternal: [/@planix\/shared/],
});

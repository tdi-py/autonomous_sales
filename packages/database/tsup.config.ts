import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  outDir: 'dist',
  external: ['drizzle-orm', 'postgres', 'drizzle-orm/postgres-js', 'drizzle-orm/pg-core'],
});

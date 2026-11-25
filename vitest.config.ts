import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@jobops/shared-types': path.resolve(__dirname, 'packages/shared-types/src/index.ts'),
      '@jobops/validation': path.resolve(__dirname, 'packages/validation/src/index.ts'),
      '@jobops/scoring': path.resolve(__dirname, 'packages/scoring/src/index.ts'),
      '@jobops/source-connectors': path.resolve(__dirname, 'packages/source-connectors/src/index.ts'),
      '@jobops/ai-prompts': path.resolve(__dirname, 'packages/ai-prompts/src/index.ts'),
      '@jobops/worker-pipeline': path.resolve(__dirname, 'workers/pipeline/src/index.ts'),
    },
  },
});

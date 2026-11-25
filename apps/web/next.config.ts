import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@jobops/shared-types',
    '@jobops/validation',
    '@jobops/scoring',
    '@jobops/source-connectors',
    '@jobops/ai-prompts',
    '@jobops/worker-pipeline',
  ],
};

export default nextConfig;

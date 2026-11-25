import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: 'export',
        basePath: '/JobOps',
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
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

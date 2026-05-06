import createNextIntlPlugin from 'next-intl/plugin';
import { execSync } from 'child_process';

// Build-time version info
const commitHash = (() => {
  try {
    return (process.env.CF_PAGES_COMMIT_SHA || execSync('git rev-parse HEAD').toString().trim()).slice(0, 7);
  } catch {
    return 'unknown';
  }
})();
const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_VERSION: commitHash,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-web": false,
        "onnxruntime-web/webgpu": false,
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);

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
  // L2: 安全响应头配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // 只允许自身域名调用 API（防止第三方跨域请求）
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_SITE_URL || 'https://nemoclaw-web.pages.dev' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
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

import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    runtime: 'experimental-edge',
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

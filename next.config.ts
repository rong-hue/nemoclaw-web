import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
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

export default nextConfig;

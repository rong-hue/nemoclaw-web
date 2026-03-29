import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // onnxruntime-web 只在浏览器运行，服务端/edge 构建时忽略
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

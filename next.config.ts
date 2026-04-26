import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      }
    ],
  },

  async headers() {
    const xmtpHeaders = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
    ];
    return [
      {
        source: "/chat/:path*",
        headers: xmtpHeaders,
      },
      {
        source: "/home",
        headers: xmtpHeaders,
      }
    ];
  },

  webpack(config, { isServer }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    // XMTP browser SDK loads WASM files via workers
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;

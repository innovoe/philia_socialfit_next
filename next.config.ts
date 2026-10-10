import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/signal", destination: "/demo", permanent: false },
      { source: "/demo/enter", destination: "/demo", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/assets/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;

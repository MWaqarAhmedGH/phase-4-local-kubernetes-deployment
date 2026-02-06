import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://todo-backend:8000";

const nextConfig: NextConfig = {
  /* Hide dev indicator */
  devIndicators: false,

  /* Enable standalone output for Docker deployment */
  output: "standalone",

  /* Proxy /api requests to the backend service inside K8s */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

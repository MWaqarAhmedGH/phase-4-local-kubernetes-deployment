import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Hide dev indicator */
  devIndicators: false,

  /* Enable standalone output for Docker deployment */
  output: "standalone",
};

export default nextConfig;

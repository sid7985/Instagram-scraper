import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8000";

const nextConfig: NextConfig = {
  // In production the browser calls the Render API directly via
  // NEXT_PUBLIC_API_URL; the rewrite is only for local development.
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

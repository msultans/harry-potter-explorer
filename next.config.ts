import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Dockerfile (Vercel ignores this).
  output: "standalone",
  images: {
    remotePatterns: [
      // hp-api character portraits
      { protocol: "https", hostname: "ik.imagekit.io", pathname: "/hpapi/**" },
    ],
  },
};

export default nextConfig;

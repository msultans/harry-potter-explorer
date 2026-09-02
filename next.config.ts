import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // hp-api character portraits
      { protocol: "https", hostname: "ik.imagekit.io", pathname: "/hpapi/**" },
    ],
  },
};

export default nextConfig;

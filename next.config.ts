import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server bundle is only wanted for the container image, which
  // runs `node .next/standalone/server.js`. Enabling it unconditionally would
  // make plain `npm start` print "next start does not work with output:
  // standalone", so the Dockerfile opts in with BUILD_STANDALONE=1.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      // hp-api character portraits
      { protocol: "https", hostname: "ik.imagekit.io", pathname: "/hpapi/**" },
    ],
  },
};

export default nextConfig;

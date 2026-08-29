import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@wedding-univers/config",
    "@wedding-univers/matching",
    "@wedding-univers/types",
    "@wedding-univers/ui",
    "@wedding-univers/validation",
  ],
};

export default nextConfig;

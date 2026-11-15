import type { NextConfig } from "next";
import { HOME_PATH } from "./src/lib/routes";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  trailingSlash: true,
  transpilePackages: ["@kenrou/shared-ui"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  basePath,
  assetPrefix: basePath || undefined,
  async redirects() {
    return [{ source: "/", destination: `${HOME_PATH}/`, permanent: false }];
  },
};

export default nextConfig;

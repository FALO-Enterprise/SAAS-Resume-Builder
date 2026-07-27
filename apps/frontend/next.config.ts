import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
    turbopack: {
    root: path.join(__dirname, "../.."),
  },
   images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3001" },
    ],
  },
};

export default withNextIntl(nextConfig);
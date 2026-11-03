import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js"],
  allowedDevOrigins: [
    "localhost",
    "lvh.me",
    "*.lvh.me",
    "localhost:3000",
    "lvh.me:3000",
    "*.lvh.me:3000"
  ],
  async redirects() {
    return [
      {
        source: "/services",
        destination: "/treatments",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "lvh.me",
    "*.lvh.me",
    "localhost:3000",
    "lvh.me:3000",
    "*.lvh.me:3000"
  ]
};

export default nextConfig;

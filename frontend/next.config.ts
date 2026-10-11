import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  // The root build runs strict `tsc --noEmit` before Next.js compilation.
  // Avoid Next spawning a duplicate TypeScript process in restricted runtimes.
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    workerThreads: true,
  },
};

export default nextConfig;

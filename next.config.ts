import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the workspace root to silence the lockfile detection warning
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

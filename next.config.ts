import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Mark firebase-admin and its dependencies as external to avoid ESM/CommonJS conflicts
  serverExternalPackages: [
    "firebase-admin",
    "jose",
    "jwks-rsa",
    "@google-cloud/firestore",
  ],
  turbopack: {
    // Explicitly set the workspace root to silence the lockfile detection warning
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

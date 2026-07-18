import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Mark firebase-admin and its dependencies as external to avoid ESM/CommonJS conflicts
  serverExternalPackages: [
    "firebase-admin",
    "firebase-admin/app",
    "firebase-admin/auth",
    "firebase-admin/firestore",
    "firebase-admin/messaging",
    "jose",
    "jwks-rsa",
    "@google-cloud/firestore",
    "@google-cloud/common",
    "@google-cloud/projectify",
  ],
  turbopack: {
    // Explicitly set the workspace root to silence the lockfile detection warning
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

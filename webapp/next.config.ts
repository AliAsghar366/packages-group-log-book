import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root carries its own package.json/package-lock.json (the build shim
  // for hosts that build from the root), so Next.js otherwise infers the wrong
  // workspace root. Pin tracing to this app directory to keep the server bundle
  // scoped here and silence the "multiple lockfiles" warning.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;

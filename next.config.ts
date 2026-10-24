import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import path from "node:path";

export default function config(phase: string): NextConfig {
  return {
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },
    reactStrictMode: true,
    outputFileTracingRoot: path.join(__dirname),
    // `next dev` gets its own folder so a production build (e.g. from `npm run test:e2e`)
    // can run at the same time without corrupting the dev server's files.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}

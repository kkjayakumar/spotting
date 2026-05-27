import type { NextConfig } from "next"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..")

/** Where Hono runs; used only server-side to proxy `/v1/*` (widget/extension often reuse the web origin by mistake). */
function apiInternalOrigin(): string {
  const raw =
    process.env.SPOTTING_API_INTERNAL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    (process.env.NODE_ENV === "production"
      ? "http://api:3000"
      : "http://127.0.0.1:3000")
  return raw.replace(/\/$/, "")
}

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  typedRoutes: true,
  transpilePackages: ["@spotting/ui"],
  turbopack: {
    resolveAlias: {
      nuqs: "./node_modules/nuqs",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      nuqs: path.join(__dirname, "node_modules/nuqs"),
    }
    return config
  },
  images: {
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
  async rewrites() {
    const api = apiInternalOrigin()
    return [
      {
        source: "/v1/:path*",
        destination: `${api}/v1/:path*`,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/settings",
        destination: "/dashboard/settings",
        permanent: false,
      },
      {
        source: "/settings/:path*",
        destination: "/dashboard/settings/:path*",
        permanent: false,
      },
    ]
  },
}

export default nextConfig

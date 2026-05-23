import type { NextConfig } from "next"

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
  typedRoutes: true,
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

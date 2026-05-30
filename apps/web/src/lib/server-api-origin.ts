/** Hono API origin for server-side calls (Docker network or local). */
export function getServerApiOrigin(): string {
  const internal = process.env.SPOTTING_API_INTERNAL_URL?.trim()
  if (internal) return internal.replace(/\/$/, "")
  return "http://api:3000"
}

/** Loopback URL for this Next.js process (SSR self-requests with Cookie forwarding). */
export function getServerWebOrigin(): string {
  const port = process.env.PORT?.trim() || "3001"
  return `http://127.0.0.1:${port}`
}

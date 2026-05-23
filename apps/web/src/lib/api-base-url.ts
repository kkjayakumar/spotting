/** Hono API origin; must match root `API_PORT` (not `PORT` / Next.js). */
function pickApiOrigin(): string {
  const a = process.env.NEXT_PUBLIC_API_URL?.trim()
  const b = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  return (a || b || "http://localhost:3000").replace(/\/$/, "")
}

export const API_BASE_URL = pickApiOrigin()

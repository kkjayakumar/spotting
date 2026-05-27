/** Hono API origin; must match root `API_PORT` (not `PORT` / Next.js). */
function pickApiOrigin(): string {
  if (typeof window === "undefined") {
    // Server-side (SSR / RSC): connect to the Hono API over the internal Docker network
    const internal = process.env.SPOTTING_API_INTERNAL_URL?.trim();
    if (internal) return internal.replace(/\/$/, "");
    return "http://api:3000";
  }

  // Client-side (Browser)
  const a = process.env.NEXT_PUBLIC_API_URL?.trim();
  const b = process.env.NEXT_PUBLIC_SERVER_URL?.trim();
  return (a || b || "http://localhost:3000").replace(/\/$/, "");
}

export const API_BASE_URL = pickApiOrigin();

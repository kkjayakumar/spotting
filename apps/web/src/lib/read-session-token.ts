import { cookies, headers } from "next/headers"

export function readTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/(?:^|;\s*)spotting_token=([^;]+)/)
  return match?.[1] ?? null
}

/** Resolve session token from cookies(), Cookie header, or middleware Authorization. */
export async function readSessionToken(): Promise<string | null> {
  const requestHeaders = await headers()
  const cookieStore = await cookies()

  return (
    cookieStore.get("spotting_token")?.value ??
    readTokenFromCookieHeader(requestHeaders.get("cookie")) ??
    requestHeaders.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null
  )
}

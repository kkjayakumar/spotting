import { cookies, headers } from "next/headers"

function readTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/(?:^|;\s*)spotting_token=([^;]+)/)
  return match?.[1] ?? null
}

/** Headers for server-side API calls; forwards session from the spotting_token cookie. */
export async function getServerAuthHeaders(): Promise<Headers> {
  const requestHeaders = await headers()
  const cookieStore = await cookies()
  const authHeaders = new Headers()

  requestHeaders.forEach((value, key) => {
    authHeaders.set(key, value)
  })

  const token =
    cookieStore.get("spotting_token")?.value ??
    readTokenFromCookieHeader(requestHeaders.get("cookie")) ??
    requestHeaders.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (token) {
    authHeaders.set("Authorization", `Bearer ${token}`)
  }

  return authHeaders
}

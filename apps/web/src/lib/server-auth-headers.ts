import { cookies, headers } from "next/headers"

/** Headers for server-side API calls; forwards session from the spotting_token cookie. */
export async function getServerAuthHeaders(): Promise<Headers> {
  const requestHeaders = await headers()
  const cookieStore = await cookies()
  const authHeaders = new Headers()

  requestHeaders.forEach((value, key) => {
    authHeaders.set(key, value)
  })

  const token = cookieStore.get("spotting_token")?.value
  const bearerFromHeader = requestHeaders.get("authorization")?.replace(/^Bearer\s+/i, "")
  const sessionToken = token ?? bearerFromHeader

  if (sessionToken) {
    authHeaders.set("Authorization", `Bearer ${sessionToken}`)
  }

  return authHeaders
}

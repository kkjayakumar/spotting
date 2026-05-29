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
  if (token) {
    authHeaders.set("Authorization", `Bearer ${token}`)
  }

  return authHeaders
}

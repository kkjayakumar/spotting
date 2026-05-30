import "server-only"

import { headers } from "next/headers"

import { readSessionToken } from "@/lib/read-session-token"

/** Minimal headers for server-side API calls (do not forward Host / browser headers). */
export async function getServerAuthHeaders(): Promise<Headers> {
  const authHeaders = new Headers()
  authHeaders.set("Content-Type", "application/json")

  const token = await readSessionToken()
  if (token) {
    authHeaders.set("Authorization", `Bearer ${token}`)
  }

  const cookie = (await headers()).get("cookie")
  if (cookie) {
    authHeaders.set("Cookie", cookie)
  }

  return authHeaders
}

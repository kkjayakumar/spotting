import { headers } from "next/headers"
import { cache } from "react"

import { getServerWebOrigin } from "@/lib/server-api-origin"

export type ProtectedOrganization = {
  id: string
  name: string
  slug: string
  logo: string
}

type ApiUser = {
  id: string
  email: string
  name: string
  emailVerified?: boolean
}

type ApiOrg = {
  id: string
  name: string
  slug?: string
  logo?: string
}

async function fetchInternalJson<T>(path: string): Promise<T | null> {
  const requestHeaders = await headers()
  const cookie = requestHeaders.get("cookie") ?? ""
  const origin = getServerWebOrigin()

  const res = await fetch(`${origin}${path}`, {
    headers: cookie ? { cookie } : {},
    cache: "no-store",
  })

  if (!res.ok) {
    return null
  }

  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

export const getProtectedAuthData = cache(async () => {
  const user = await fetchInternalJson<ApiUser>("/api/internal/session")

  if (!user?.id) {
    return {
      organizations: [] as ProtectedOrganization[],
      session: null,
    }
  }

  const orgs = await fetchInternalJson<ApiOrg[]>("/api/internal/orgs")
  const raw = Array.isArray(orgs) ? orgs : []

  const normalized: ProtectedOrganization[] = raw.map((entry) => ({
    id: entry.id,
    name: entry.name,
    slug: entry.slug ?? "",
    logo: entry.logo ?? "",
  }))

  return {
    organizations: normalized,
    session: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: "",
        emailVerified: Boolean(user.emailVerified),
      },
      session: { activeOrganizationId: null as string | null },
    },
  }
})

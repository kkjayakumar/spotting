import { authClient } from "@spotting/auth/client"
import { headers } from "next/headers"
import { cache } from "react"

export type ProtectedOrganization = {
  id: string
  name: string
  slug: string
  logo: string
}

export const getProtectedAuthData = cache(async () => {
  const requestHeaders = await headers()

  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: requestHeaders,
    },
  })

  if (!session) {
    return {
      organizations: [] as ProtectedOrganization[],
      session: null,
    }
  }

  const { data: organizations } = await authClient.organization.list({
    fetchOptions: {
      headers: requestHeaders,
    },
  })

  const raw = organizations ?? []
  const normalized: ProtectedOrganization[] = raw.map(
    (entry: { id: string; name: string; slug?: string; logo?: string }) => ({
      id: entry.id,
      name: entry.name,
      slug: entry.slug ?? "",
      logo: entry.logo ?? "",
    })
  )

  return {
    organizations: normalized,
    session,
  }
})

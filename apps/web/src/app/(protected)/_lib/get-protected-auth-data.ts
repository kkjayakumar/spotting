import { authClient } from "@spotting/auth/client"
import { cache } from "react"

import { getServerAuthHeaders } from "@/lib/server-auth-headers"

export type ProtectedOrganization = {
  id: string
  name: string
  slug: string
  logo: string
}

export const getProtectedAuthData = cache(async () => {
  const authHeaders = await getServerAuthHeaders()

  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: authHeaders,
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
      headers: authHeaders,
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

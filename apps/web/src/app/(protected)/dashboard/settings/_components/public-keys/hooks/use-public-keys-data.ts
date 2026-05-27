"use client"

import { useQuery } from "@tanstack/react-query"

import { reportQueries } from "@/lib/api"
import type { PublicKeysSnapshot } from "../types"

export function usePublicKeysData(
  initialKeys: PublicKeysSnapshot,
  organizationId: string
) {
  return useQuery({
    ...reportQueries.captureKey.list.queryOptions(organizationId),
    initialData: initialKeys,
    // Keep SSR HTML aligned with the first client render; refetch after stale window.
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { authClient } from "@/lib/api/auth";

export function useActiveOrganizationId() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const orgsQuery = useQuery({
    queryKey: ["spotting.orgs"],
    queryFn: async () => {
      const result = await authClient.organization.list();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return (result.data ?? []) as Array<{ id: string; role?: string }>;
    },
    enabled: Boolean(session?.user),
  });

  const organizationId = useMemo(() => {
    const preferredId = session?.session?.activeOrganizationId;
    const organizations = orgsQuery.data ?? [];
    if (
      preferredId &&
      organizations.some((organization) => organization.id === preferredId)
    ) {
      return preferredId;
    }
    return organizations[0]?.id ?? null;
  }, [orgsQuery.data, session?.session?.activeOrganizationId]);

  const memberRole = useMemo(() => {
    const organizations = orgsQuery.data ?? [];
    if (!organizationId) {
      return null;
    }
    return (
      organizations.find((organization) => organization.id === organizationId)
        ?.role ?? null
    );
  }, [organizationId, orgsQuery.data]);

  return {
    organizationId,
    memberRole,
    isPending: isSessionPending || orgsQuery.isPending,
  };
}

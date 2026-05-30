import "server-only";

import { fetchServerApi } from "@/lib/server-api-fetch";

type MembersListQuery = {
  organizationId: string;
  limit?: number;
  offset?: number;
};

async function orgFetchApi(path: string, options: RequestInit = {}) {
  try {
    const data = await fetchServerApi(path, options);
    return { data, error: null as null };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Network error";
    return { data: null, error: { message } };
  }
}

export const serverOrgClient = {
  listMembers: async (payload: { query: MembersListQuery }) => {
    const q = payload.query;
    const orgId = q.organizationId;
    const res = await orgFetchApi(`/v1/orgs/${orgId}/members`);
    if (res.error) {
      return { data: null, error: res.error };
    }
    const raw = Array.isArray(res.data) ? res.data : [];
    const sorted = [...raw].sort(
      (a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const total = sorted.length;
    const offset = q.offset ?? 0;
    const limit = q.limit ?? 50;
    const members = sorted.slice(offset, offset + limit).map((m: any) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: {
        name: m.user?.name ?? "",
        email: m.user?.email ?? "",
      },
    }));
    return { data: { members, total }, error: null };
  },
  listInvitations: async (payload: { query: { organizationId: string } }) => {
    const orgId = payload.query.organizationId;
    const res = await orgFetchApi(`/v1/orgs/${orgId}/invites`);
    if (res.error) {
      return { data: null, error: res.error };
    }
    const raw = Array.isArray(res.data) ? res.data : [];
    const invitations = raw.map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));
    return { data: invitations, error: null };
  },
  getActiveMemberRole: async (payload: {
    query: { organizationId: string };
  }) => {
    const orgId = payload.query.organizationId;
    const res = await orgFetchApi(`/v1/orgs/${orgId}/membership`);
    if (res.error) {
      return { data: null, error: res.error };
    }
    return {
      data: { role: (res.data as { role?: string } | null)?.role ?? null },
      error: null,
    };
  },
};

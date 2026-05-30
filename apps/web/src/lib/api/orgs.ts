import { API_BASE_URL } from "@/lib/api-base-url";
import { buildAuthHeaders } from "@/lib/api-fetch";

async function orgFetchApi(path: string, options: RequestInit = {}) {
  const headers = await buildAuthHeaders(options.headers);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      body: options.body,
      headers,
      ...(typeof window === "undefined" ? { cache: "no-store" as const } : {}),
    });

    if (!response.ok) {
      let message = "Request failed";
      try {
        const data = await response.json();
        message = data.error?.message || data.message || message;
      } catch {
        /* ignore */
      }
      return { data: null, error: { message } };
    }

    const text = await response.text();
    try {
      return { data: JSON.parse(text), error: null };
    } catch {
      return { data: null, error: null };
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Network error";
    return { data: null, error: { message } };
  }
}

export const orgClient = {
  listMembers: async (payload: any) => {
    const q = payload?.query;
    const orgId = q?.organizationId;
    if (!orgId) {
      return { data: null, error: { message: "organizationId is required" } };
    }
    const res = await orgFetchApi(`/v1/orgs/${orgId}/members`);
    if (res.error) {
      return { data: null, error: res.error };
    }
    const raw = Array.isArray(res.data) ? res.data : [];
    const sorted = [...raw].sort(
      (a: any, b: any) =>
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
  listInvitations: async (payload: any) => {
    const orgId = payload?.query?.organizationId;
    if (!orgId) {
      return { data: null, error: { message: "organizationId is required" } };
    }
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
  inviteMember: async (payload: {
    organizationId: string;
    email: string;
    role: "admin" | "member";
  }) =>
    orgFetchApi(`/v1/orgs/${payload.organizationId}/invites`, {
      method: "POST",
      body: JSON.stringify({ email: payload.email, role: payload.role }),
    }),
  cancelInvitation: async (payload: { invitationId: string }) =>
    orgFetchApi(`/v1/orgs/invites/${payload.invitationId}`, {
      method: "DELETE",
    }),
  updateMemberRole: async (payload: {
    organizationId: string;
    memberId: string;
    role: "admin" | "member";
  }) =>
    orgFetchApi(
      `/v1/orgs/${payload.organizationId}/members/${payload.memberId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role: payload.role }),
      },
    ),
  removeMember: async (payload: {
    organizationId: string;
    memberIdOrEmail: string;
  }) =>
    orgFetchApi(
      `/v1/orgs/${payload.organizationId}/members/${encodeURIComponent(payload.memberIdOrEmail)}`,
      { method: "DELETE" },
    ),
};

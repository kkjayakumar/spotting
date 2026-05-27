import { API_BASE_URL } from "@/lib/api-base-url";

async function orgFetchApi(path: string, options: any = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  let token = null;
  if (typeof window !== "undefined") {
    try {
      token = localStorage.getItem("spotting_token");
    } catch (e) {}
  }

  if (!token && headers.has("Authorization")) {
    token = headers.get("Authorization")?.replace("Bearer ", "");
  }

  if (!token) {
    let cookieString = "";
    if (typeof window !== "undefined") {
      cookieString = document.cookie;
    } else if (options.headers) {
      const h = new Headers(options.headers);
      cookieString = h.get("cookie") || "";
    }
    const match = cookieString.match(/spotting_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = "Request failed";
      try {
        const data = await response.json();
        message = data.error?.message || data.message || message;
      } catch {}
      return { data: null, error: { message } };
    }

    const text = await response.text();
    try {
      return { data: JSON.parse(text), error: null };
    } catch {
      return { data: null, error: null };
    }
  } catch (error: any) {
    return { data: null, error: { message: error.message || "Network error" } };
  }
}

export const orgClient = {
  listMembers: async (payload: any) => {
    const q = payload?.query;
    const orgId = q?.organizationId;
    if (!orgId) {
      return { data: null, error: { message: "organizationId is required" } };
    }
    const res = await orgFetchApi(`/v1/orgs/${orgId}/members`, {
      ...(payload?.fetchOptions ?? {}),
    });
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
    const res = await orgFetchApi(`/v1/orgs/${orgId}/invites`, {
      ...(payload?.fetchOptions ?? {}),
    });
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

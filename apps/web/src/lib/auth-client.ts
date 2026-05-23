import { useQuery } from "@tanstack/react-query";

import { API_BASE_URL } from "@/lib/api-base-url";

async function fetchApi(path: string, options: any = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  let token = null;
  if (typeof window !== "undefined") {
    try { token = localStorage.getItem("spotting_token"); } catch (e) {}
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

export const authClient = {
  useSession: () => {
    const { data, isLoading } = useQuery({
      queryKey: ["session"],
      queryFn: async () => {
        const res = await fetchApi("/v1/auth/me");
        if (res.error) throw new Error(res.error.message);
        return res.data;
      },
      retry: false
    });
    const activeOrgId = typeof window !== "undefined" ? localStorage.getItem("spotting_active_org") : null;
    return { 
      data: (data && data.id) ? { 
        user: data, 
        session: { activeOrganizationId: activeOrgId } 
      } : null, 
      isPending: isLoading 
    };
  },
  getSession: async (options?: any) => {
    const res = await fetchApi("/v1/auth/me", options?.fetchOptions);
    const activeOrgId = typeof window !== "undefined" ? localStorage.getItem("spotting_active_org") : null;
    return { 
      data: (res.data && res.data.id) ? { 
        user: res.data, 
        session: { activeOrganizationId: activeOrgId } 
      } : null, 
      error: res.error 
    };
  },
  signIn: {
    email: async ({ email, password }: any) => {
      const res = await fetchApi("/v1/auth/signin", { method: "POST", body: JSON.stringify({ email, password }) });
      if (res.data?.sessionToken) {
        localStorage.setItem("spotting_token", res.data.sessionToken);
        document.cookie = `spotting_token=${res.data.sessionToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      return res;
    },
    social: async ({ provider }: any) => {
      return { data: { url: "/login" }, error: null };
    }
  },
  signUp: {
    email: async (payload: any) => {
      const res = await fetchApi("/v1/auth/signup", { method: "POST", body: JSON.stringify(payload) });
      if (res.data?.sessionToken) {
        localStorage.setItem("spotting_token", res.data.sessionToken);
        document.cookie = `spotting_token=${res.data.sessionToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      return res;
    }
  },
  signOut: async (opts?: any) => {
    await fetchApi("/v1/auth/signout", {
      method: "POST",
      ...(opts?.fetchOptions ?? {}),
    });
    try {
      localStorage.removeItem("spotting_token");
      localStorage.removeItem("spotting_active_org");
    } catch {
      /* ignore */
    }
    document.cookie =
      "spotting_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    return { data: { ok: true }, error: null };
  },
  emailOtp: {
    verifyEmail: async ({ email, otp }: any) =>
      fetchApi("/v1/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      }),
    sendVerificationOtp: async ({ email }: any) =>
      fetchApi("/v1/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    requestPasswordReset: async (_payload: { email: string }) => ({
      data: true,
      error: null,
    }),
    resetPassword: async (_payload: {
      email: string
      otp: string
      password: string
    }) => ({ data: true, error: null }),
  },
  forgotPassword: {
    requestPasswordReset: async (payload: any) => ({ data: true, error: null }),
    resetPassword: async (payload: any) => ({ data: true, error: null }),
  },
  updateUser: async (payload: { name: string }) =>
    fetchApi("/v1/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ name: payload.name }),
    }),
  changePassword: async (payload: {
    currentPassword: string
    newPassword: string
  }) =>
    fetchApi("/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  organization: {
    create: async (payload: any) => fetchApi("/v1/orgs", { method: "POST", body: JSON.stringify(payload) }),
    update: async (payload: any) => fetchApi(`/v1/orgs/${payload.id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    delete: async (payload: any) => fetchApi(`/v1/orgs/${payload.id}`, { method: "DELETE" }),
    setActive: async (payload: { organizationId: string }) => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("spotting_active_org", payload.organizationId);
        }
        return { data: true as const, error: null };
      } catch {
        return {
          data: null,
          error: { message: "Failed to persist active organization" },
        };
      }
    },
    acceptInvitation: async (payload: any) => fetchApi(`/v1/orgs/invites/${payload.invitationId}/accept`, { method: "POST" }),
    rejectInvitation: async (payload: any) => fetchApi(`/v1/orgs/invites/${payload.invitationId}/reject`, { method: "POST" }),
    list: async (options?: any) => fetchApi("/v1/orgs", options?.fetchOptions),
    getActiveMemberRole: async (payload: any) => {
      return { data: { role: "owner" }, error: null };
    },
    listMembers: async (payload: any) => {
      const q = payload?.query;
      const orgId = q?.organizationId;
      if (!orgId) {
        return { data: null, error: { message: "organizationId is required" } };
      }
      const res = await fetchApi(`/v1/orgs/${orgId}/members`, {
        ...(payload?.fetchOptions ?? {}),
      });
      if (res.error) {
        return { data: null, error: res.error };
      }
      const raw = Array.isArray(res.data) ? res.data : [];
      const sorted = [...raw].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      const res = await fetchApi(`/v1/orgs/${orgId}/invites`, {
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
      organizationId: string
      email: string
      role: "admin" | "member"
    }) =>
      fetchApi(`/v1/orgs/${payload.organizationId}/invites`, {
        method: "POST",
        body: JSON.stringify({ email: payload.email, role: payload.role }),
      }),
    cancelInvitation: async (payload: { invitationId: string }) =>
      fetchApi(`/v1/orgs/invites/${payload.invitationId}`, { method: "DELETE" }),
    updateMemberRole: async (payload: {
      organizationId: string
      memberId: string
      role: "admin" | "member"
    }) =>
      fetchApi(`/v1/orgs/${payload.organizationId}/members/${payload.memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: payload.role }),
      }),
    removeMember: async (payload: {
      organizationId: string
      memberIdOrEmail: string
    }) =>
      fetchApi(
        `/v1/orgs/${payload.organizationId}/members/${encodeURIComponent(payload.memberIdOrEmail)}`,
        { method: "DELETE" },
      ),
  },
  $Infer: {
    Session: { user: { id: "1", email: "", name: "", image: "" } },
    Organization: { id: "1", name: "Org", slug: "org", logo: "" },
    Invitation: { id: "1", email: "", role: "member" }
  }
};

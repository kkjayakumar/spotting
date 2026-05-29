import { useQuery } from "@tanstack/react-query";

import { API_BASE_URL } from "@/lib/api-base-url";
import { finishAuthRedirect, syncSessionCookie } from "@/lib/auth-redirect";

import { orgClient } from "./orgs";

function readCookieToken(cookieString: string): string | null {
  const match = cookieString.match(/(?:^|;\s*)spotting_token=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

async function persistSessionToken(token: string): Promise<void> {
  try {
    localStorage.setItem("spotting_token", token);
  } catch {
    /* ignore */
  }

  const synced = await syncSessionCookie(token);

  // Fallback readable cookie if the HttpOnly route failed (e.g. route not deployed yet).
  if (!synced && typeof document !== "undefined") {
    const secure =
      window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `spotting_token=${token}; path=/; max-age=604800; SameSite=Lax${secure}`;
  }
}

async function clearSessionToken(): Promise<void> {
  try {
    localStorage.removeItem("spotting_token");
    localStorage.removeItem("spotting_active_org");
  } catch {
    /* ignore */
  }

  try {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    /* ignore */
  }

  if (typeof document !== "undefined") {
    document.cookie =
      "spotting_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

async function fetchApi(path: string, options: any = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  let token = null;
  if (typeof window !== "undefined") {
    try {
      token = localStorage.getItem("spotting_token");
    } catch (e) {}
  }

  if (!token && headers.has("Authorization")) {
    token = headers.get("Authorization")?.replace("Bearer ", "") ?? null;
  }

  if (!token) {
    let cookieString = "";
    if (typeof window !== "undefined") {
      cookieString = document.cookie;
    } else if (options.headers) {
      const h = new Headers(options.headers);
      cookieString = h.get("cookie") || "";
    }
    token = readCookieToken(cookieString);
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

export const spottingAuthClient = {
  useSession: () => {
    const { data, isLoading } = useQuery({
      queryKey: ["session"],
      queryFn: async () => {
        const res = await fetchApi("/v1/auth/me");
        if (res.error) throw new Error(res.error.message);
        return res.data;
      },
      retry: false,
      staleTime: 0,
      refetchOnWindowFocus: true,
    });
    const activeOrgId =
      typeof window !== "undefined"
        ? localStorage.getItem("spotting_active_org")
        : null;
    return {
      data:
        data && data.id
          ? {
              user: data,
              session: { activeOrganizationId: activeOrgId },
            }
          : null,
      isPending: isLoading,
    };
  },
  getSession: async (options?: any) => {
    const res = await fetchApi("/v1/auth/me", options?.fetchOptions);
    const activeOrgId =
      typeof window !== "undefined"
        ? localStorage.getItem("spotting_active_org")
        : null;
    return {
      data:
        res.data && res.data.id
          ? {
              user: res.data,
              session: { activeOrganizationId: activeOrgId },
            }
          : null,
      error: res.error,
    };
  },
  signIn: {
    email: async ({ email, password }: any) => {
      const res = await fetchApi("/v1/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.data?.sessionToken) {
        await persistSessionToken(res.data.sessionToken);
      }
      return res;
    },
    social: async ({ provider }: any) => {
      return { data: { url: "/login" }, error: null };
    },
  },
  signUp: {
    email: async (payload: any) => {
      const res = await fetchApi("/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.data?.sessionToken) {
        await persistSessionToken(res.data.sessionToken);
      }
      return res;
    },
  },
  signOut: async (opts?: any) => {
    await fetchApi("/v1/auth/signout", {
      method: "POST",
      ...(opts?.fetchOptions ?? {}),
    });
    await clearSessionToken();
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
    requestPasswordReset: async ({ email }: { email: string }) =>
      fetchApi("/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: async ({
      email,
      otp,
      password,
    }: {
      email: string;
      otp: string;
      password: string;
    }) =>
      fetchApi("/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, password }),
      }),
  },
  forgotPassword: {
    requestPasswordReset: async ({ email }: { email: string }) =>
      fetchApi("/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: async ({
      email,
      otp,
      password,
    }: {
      email: string;
      otp: string;
      password: string;
    }) =>
      fetchApi("/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, password }),
      }),
  },
  updateUser: async (payload: { name: string }) =>
    fetchApi("/v1/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ name: payload.name }),
    }),
  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
  }) =>
    fetchApi("/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  organization: {
    create: async (payload: { name: string; slug: string }) =>
      fetchApi("/v1/orgs", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: async (payload: {
      organizationId?: string;
      id?: string;
      data?: { name?: string; slug?: string };
      name?: string;
      slug?: string;
      fetchOptions?: RequestInit;
    }) => {
      const organizationId = payload.organizationId ?? payload.id;
      if (!organizationId) {
        return { data: null, error: { message: "organizationId is required" } };
      }
      const body =
        payload.data ??
        (payload.name !== undefined || payload.slug !== undefined
          ? { name: payload.name, slug: payload.slug }
          : {});
      return fetchApi(`/v1/orgs/${organizationId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        ...(payload.fetchOptions ?? {}),
      });
    },
    delete: async (payload: {
      organizationId?: string;
      id?: string;
      fetchOptions?: RequestInit;
    }) => {
      const organizationId = payload.organizationId ?? payload.id;
      if (!organizationId) {
        return { data: null, error: { message: "organizationId is required" } };
      }
      return fetchApi(`/v1/orgs/${organizationId}`, {
        method: "DELETE",
        ...(payload.fetchOptions ?? {}),
      });
    },
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
    acceptInvitation: async (payload: any) =>
      fetchApi(`/v1/orgs/invites/${payload.invitationId}/accept`, {
        method: "POST",
      }),
    rejectInvitation: async (payload: any) =>
      fetchApi(`/v1/orgs/invites/${payload.invitationId}/reject`, {
        method: "POST",
      }),
    list: async (options?: any) => fetchApi("/v1/orgs", options?.fetchOptions),
    getActiveMemberRole: async (payload?: {
      query?: { organizationId?: string };
      organizationId?: string;
      fetchOptions?: RequestInit;
    }) => {
      const organizationId =
        payload?.query?.organizationId ?? payload?.organizationId;
      if (!organizationId) {
        return { data: null, error: { message: "organizationId is required" } };
      }
      const res = await fetchApi(
        `/v1/orgs/${organizationId}/membership`,
        payload?.fetchOptions ?? {},
      );
      if (res.error) {
        return { data: null, error: res.error };
      }
      return {
        data: { role: (res.data as { role?: string } | null)?.role ?? null },
        error: null,
      };
    },
    listMembers: orgClient.listMembers,
    listInvitations: orgClient.listInvitations,
    inviteMember: orgClient.inviteMember,
    cancelInvitation: orgClient.cancelInvitation,
    updateMemberRole: orgClient.updateMemberRole,
    removeMember: orgClient.removeMember,
  },
  $Infer: {
    Session: { user: { id: "1", email: "", name: "", image: "" } },
    Organization: { id: "1", name: "Org", slug: "org", logo: "" },
    Invitation: { id: "1", email: "", role: "member" },
  },
};

/** @deprecated Use `spottingAuthClient`. Kept for backward compatibility. */
export const authClient = spottingAuthClient;

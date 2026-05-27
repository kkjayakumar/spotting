import { fetchApi, fetchApiWithRequestHeaders } from "@/lib/api-fetch";

type IncomingRequestHeaders = Pick<Headers, "get">;

export type CaptureKeyListItem = {
  id: string;
  label: string;
  key: string;
  allowedOrigins: string[];
  status: string;
  createdAt: string;
};

export function normalizeCaptureKeyList(data: unknown): CaptureKeyListItem[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    label: String(row.label ?? row.name ?? "Key"),
    key: String(row.key ?? row.publicKey ?? row.token ?? ""),
    allowedOrigins: Array.isArray(row.allowedOrigins)
      ? (row.allowedOrigins as string[])
      : [],
    status: String(row.status ?? "active"),
    createdAt: String(row.createdAt ?? new Date().toISOString()),
  }));
}

export const captureKeyClient = {
  list: async (init?: {
    headers?: IncomingRequestHeaders;
    organizationId: string;
  }) => {
    const orgId = init?.organizationId;
    if (!orgId) {
      throw new Error("captureKey.list requires organizationId");
    }
    try {
      const data = await fetchApiWithRequestHeaders(
        `/v1/orgs/${orgId}/capture-keys`,
        {
          headers: init?.headers,
        },
      );
      return normalizeCaptureKeyList(data);
    } catch {
      return [];
    }
  },
  create: async (input: {
    organizationId: string;
    label: string;
    allowedOrigins: string[];
  }) => {
    return fetchApi(`/v1/orgs/${input.organizationId}/capture-keys`, {
      method: "POST",
      body: JSON.stringify({
        label: input.label,
        allowedOrigins: input.allowedOrigins,
      }),
    });
  },
  update: async (input: {
    organizationId: string;
    keyId: string;
    label: string;
    allowedOrigins: string[];
  }) => {
    return fetchApi(
      `/v1/orgs/${input.organizationId}/capture-keys/${input.keyId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          label: input.label,
          allowedOrigins: input.allowedOrigins,
        }),
      },
    );
  },
  delete: async (input: { organizationId: string; keyId: string }) => {
    return fetchApi(
      `/v1/orgs/${input.organizationId}/capture-keys/${input.keyId}`,
      { method: "DELETE" },
    );
  },
  revoke: async (input: { organizationId: string; keyId: string }) => {
    return fetchApi(
      `/v1/orgs/${input.organizationId}/capture-keys/${input.keyId}/revoke`,
      { method: "POST" },
    );
  },
  rotate: async (input: { organizationId: string; keyId: string }) => {
    return fetchApi(
      `/v1/orgs/${input.organizationId}/capture-keys/${input.keyId}/rotate`,
      { method: "POST" },
    );
  },
};

export const captureKeyQueries = {
  captureKey: {
    list: {
      queryOptions: (organizationId: string) => ({
        queryKey: ["captureKey.list", organizationId],
        queryFn: async () =>
          normalizeCaptureKeyList(
            await fetchApi(`/v1/orgs/${organizationId}/capture-keys`),
          ),
      }),
    },
  },
};

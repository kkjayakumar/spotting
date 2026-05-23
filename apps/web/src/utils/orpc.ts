import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SharedBugReport } from "@/app/s/[id]/_components/types";
import { fetchApi, fetchApiWithRequestHeaders } from "@/lib/api-fetch";
import {
  deleteBugReport,
  deleteBugReportsBulk,
  retryBugReportDebuggerIngestion,
  updateBugReport,
  updateBugReportsBulk,
} from "@/lib/bug-report-api";
import { BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS } from "@spotting/shared/constants/bug-report";

export { fetchApi, fetchApiWithRequestHeaders };
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        toast.error(`Error: ${error.message || "An error occurred"}`);
      },
    },
  },
});

type IncomingRequestHeaders = Pick<Headers, "get">;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null
}

export type CaptureKeyListItem = {
  id: string
  label: string
  key: string
  allowedOrigins: string[]
  status: string
  createdAt: string
}

export function normalizeCaptureKeyList(data: unknown): CaptureKeyListItem[] {
  if (!Array.isArray(data)) {
    return []
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
  }))
}

/** Map Prisma `GET /v1/reports/:id` JSON into the shape the `/s/[id]` UI expects. */
export function normalizeBugReportDto(raw: unknown): SharedBugReport {
  const row = asRecord(raw)
  if (!row) {
    throw new Error("Invalid report payload")
  }

  const meta = asRecord(row.metadataJson) ?? {}
  const orgRow = asRecord(row.organization)
  const reporterRow = asRecord(row.reporterUser)

  const viewportObj = asRecord(meta.viewport)
  const viewportStr =
    viewportObj &&
    typeof viewportObj.w === "number" &&
    typeof viewportObj.h === "number"
      ? `${viewportObj.w}x${viewportObj.h}`
      : undefined

  const organization =
    orgRow && typeof orgRow.name === "string"
      ? {
          id: String(orgRow.id ?? row.organizationId ?? ""),
          name: String(orgRow.name),
          slug: typeof orgRow.slug === "string" ? orgRow.slug : "",
        }
      : {
          id: String(row.organizationId ?? ""),
          name: "Organization",
          slug: "",
        }

  const reporter =
    reporterRow && typeof reporterRow.name === "string"
      ? {
          id: String(reporterRow.id ?? ""),
          name: String(reporterRow.name),
          email:
            typeof reporterRow.email === "string" ? reporterRow.email : "",
        }
      : undefined

  return {
    ...row,
    id: String(row.id ?? ""),
    status: String(row.status ?? "open"),
    priority: String(row.priority ?? "medium"),
    createdAt: row.createdAt as string | Date,
    url: typeof row.pageUrl === "string" ? row.pageUrl : "",
    metadata: row.metadataJson ?? null,
    deviceInfo: {
      browser: typeof meta.userAgent === "string" ? meta.userAgent : undefined,
      os: undefined,
      viewport: viewportStr,
    },
    reporter,
    organization,
    attachmentUrl:
      typeof row.attachmentUrl === "string"
        ? row.attachmentUrl
        : typeof meta.attachmentUrl === "string"
          ? meta.attachmentUrl
          : undefined,
    attachmentType:
      typeof row.attachmentType === "string"
        ? row.attachmentType
        : typeof meta.attachmentType === "string"
          ? meta.attachmentType
          : undefined,
    submissionStatus:
      typeof row.submissionStatus === "string"
        ? row.submissionStatus
        : typeof meta.submissionStatus === "string"
          ? meta.submissionStatus
          : "ready",
    canEdit: typeof row.canEdit === "boolean" ? row.canEdit : false,
    tags: Array.isArray(row.tags)
      ? (row.tags as unknown[]).filter((t): t is string => typeof t === "string")
      : Array.isArray(meta.tags)
        ? (meta.tags as unknown[]).filter((t): t is string => typeof t === "string")
        : [],
    visibility: String(row.visibility ?? "private"),
    debuggerIngestionError:
      typeof meta.debuggerIngestionError === "string"
        ? meta.debuggerIngestionError
        : typeof row.debuggerIngestionError === "string"
          ? row.debuggerIngestionError
          : null,
    debuggerIngestionStatus:
      typeof meta.debuggerIngestionStatus === "string"
        ? meta.debuggerIngestionStatus
        : typeof row.debuggerIngestionStatus === "string"
          ? row.debuggerIngestionStatus
          : BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS.notUploaded,
  } as SharedBugReport
}

// Map Spotting's ORPC structure to Spotting's endpoints
export const orpc = {
  bugReport: {
    list: {
      infiniteOptions: (input: unknown) => ({
        queryKey: ["bugReport.list", input],
        queryFn: ({ pageParam = 1 }: { pageParam?: number }) =>
          fetchApi(`/v1/reports?page=${pageParam}`),
        initialPageParam: 1,
        getNextPageParam: (lastPage: {
          page?: number
          totalPages?: number
        }) => {
          const page = lastPage?.page
          const totalPages = lastPage?.totalPages
          if (
            typeof page !== "number" ||
            typeof totalPages !== "number" ||
            page >= totalPages
          ) {
            return undefined
          }
          return page + 1
        },
      }),
    },
    getDashboardStats: {
      queryOptions: () => ({
        queryKey: ["bugReport.getDashboardStats"],
        queryFn: () => fetchApi("/v1/reports/stats"),
      }),
    },
    getById: {
      queryOptions: (opts: {
        input: { id: string }
        enabled?: boolean
        [key: string]: unknown
      }) => {
        const { input, ...rest } = opts
        return {
          queryKey: ["bugReport.getById", input.id],
          queryFn: async () => {
            const raw = await fetchApi(`/v1/reports/${input.id}`)
            return normalizeBugReportDto(raw)
          },
          ...rest,
        }
      },
    },
    getNetworkRequests: {
      infiniteOptions: (opts: {
        initialPageParam?: number
        input: (pageParam: number) => {
          id: string
          page?: number
          perPage: number
          search?: string | undefined
        }
        queryKey?: readonly unknown[]
        getNextPageParam?: (lastPage: {
          pagination: { hasNextPage: boolean; page: number }
          items: unknown[]
        }) => number | undefined
        enabled?: boolean
      }) => {
        const initial = opts.initialPageParam ?? 1
        const first = opts.input(initial)
        return {
          queryKey: opts.queryKey ?? [
            "bugReport.getNetworkRequests",
            first.id,
          ],
          initialPageParam: initial,
          queryFn: async ({ pageParam = initial }: { pageParam?: number }) => {
            const params = opts.input(pageParam ?? initial)
            const searchQ =
              params.search !== undefined && params.search !== ""
                ? `&search=${encodeURIComponent(params.search)}`
                : ""
            const raw = await fetchApi(
              `/v1/reports/${params.id}/network?page=${pageParam}&pageSize=${params.perPage}${searchQ}`
            )
            if (
              raw &&
              typeof raw === "object" &&
              "items" in raw &&
              "pagination" in raw
            ) {
              return raw as {
                items: unknown[]
                pagination: { hasNextPage: boolean; page: number }
              }
            }
            return {
              items: [] as unknown[],
              pagination: {
                hasNextPage: false,
                page: pageParam ?? initial,
              },
            }
          },
          getNextPageParam:
            opts.getNextPageParam ??
            ((lastPage: {
              pagination: { hasNextPage: boolean; page: number }
            }) =>
              lastPage.pagination.hasNextPage
                ? lastPage.pagination.page + 1
                : undefined),
          enabled: opts.enabled,
        }
      },
    },
    getDebuggerEvents: {
      queryOptions: (opts: {
        input: { id: string }
        enabled?: boolean
        [key: string]: unknown
      }) => {
        const { input, ...rest } = opts
        return {
          queryKey: ["bugReport.getDebuggerEvents", input.id],
          queryFn: () => fetchApi(`/v1/reports/${input.id}/events`),
          ...rest,
        }
      },
    },
    getNetworkRequestPayload: {
      queryOptions: (opts: {
        input: { id: string; requestId: string }
        enabled?: boolean
        staleTime?: number
        [key: string]: unknown
      }) => {
        const { input, ...rest } = opts
        return {
          queryKey: [
            "bugReport.getNetworkRequestPayload",
            input.id,
            input.requestId,
          ],
          queryFn: () =>
            fetchApi(`/v1/reports/${input.id}/network/${input.requestId}`),
          ...rest,
        }
      },
    },
    updateStatus: {
      useMutation: () => ({
        mutationFn: (input: { id: string, status: string }) => fetchApi(`/v1/reports/${input.id}/status`, { method: "PATCH", body: JSON.stringify({ status: input.status }) }),
      })
    },
    updatePriority: {
      useMutation: () => ({
        mutationFn: (input: { id: string, priority: string }) => fetchApi(`/v1/reports/${input.id}/priority`, { method: "PATCH", body: JSON.stringify({ priority: input.priority }) }),
      })
    },
    updateTags: {
      useMutation: () => ({
        mutationFn: (input: { id: string, tags: string[] }) => fetchApi(`/v1/reports/${input.id}/tags`, { method: "PATCH", body: JSON.stringify({ tags: input.tags }) }),
      })
    },
    updateAssignee: {
      useMutation: () => ({
        mutationFn: (input: { id: string, assigneeId: string }) => fetchApi(`/v1/reports/${input.id}/assignee`, { method: "PATCH", body: JSON.stringify({ assigneeId: input.assigneeId }) }),
      })
    },
    delete: {
      useMutation: () => ({
        mutationFn: (input: { id: string }) => fetchApi(`/v1/reports/${input.id}`, { method: "DELETE" }),
      })
    },
    bulkDelete: {
      useMutation: () => ({
        mutationFn: (input: { ids: string[] }) => fetchApi(`/v1/reports/bulk`, { method: "DELETE", body: JSON.stringify({ ids: input.ids }) }),
      })
    },
    bulkUpdateStatus: {
      useMutation: () => ({
        mutationFn: (input: { ids: string[], status: string }) => fetchApi(`/v1/reports/bulk/status`, { method: "PATCH", body: JSON.stringify({ ids: input.ids, status: input.status }) }),
      })
    },
    bulkUpdatePriority: {
      useMutation: () => ({
        mutationFn: (input: { ids: string[], priority: string }) => fetchApi(`/v1/reports/bulk/priority`, { method: "PATCH", body: JSON.stringify({ ids: input.ids, priority: input.priority }) }),
      })
    },
    bulkUpdateTags: {
      useMutation: () => ({
        mutationFn: (input: { ids: string[], tags: string[] }) => fetchApi(`/v1/reports/bulk/tags`, { method: "PATCH", body: JSON.stringify({ ids: input.ids, tags: input.tags }) }),
      })
    },
    bulkUpdateAssignee: {
      useMutation: () => ({
        mutationFn: (input: { ids: string[], assigneeId: string }) => fetchApi(`/v1/reports/bulk/assignee`, { method: "PATCH", body: JSON.stringify({ ids: input.ids, assigneeId: input.assigneeId }) }),
      })
    },
    retryIngestion: {
      useMutation: () => ({
        mutationFn: (input: { id: string }) => fetchApi(`/v1/reports/${input.id}/retry`, { method: "POST" }),
      })
    }
  },
  captureKey: {
    list: {
      queryOptions: (organizationId: string) => ({
        queryKey: ["captureKey.list", organizationId],
        queryFn: async () =>
          normalizeCaptureKeyList(
            await fetchApi(`/v1/orgs/${organizationId}/capture-keys`)
          ),
      }),
    },
  },
};
const DEFAULT_PLAN_LIMITS = {
  free: {
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    canUploadVideo: false,
    maxVideoDurationMs: null as number | null,
    memberCap: 3,
  },
  pro: {
    monthlyPriceUsd: 29,
    yearlyPriceUsd: 290,
    canUploadVideo: true,
    maxVideoDurationMs: 600_000,
    memberCap: 25,
  },
  studio: {
    monthlyPriceUsd: 99,
    yearlyPriceUsd: 990,
    canUploadVideo: true,
    maxVideoDurationMs: null as number | null,
    memberCap: null as number | null,
  },
};

export const client: any = {
  bugReport: {
    getById: async (input: { id: string }) =>
      normalizeBugReportDto(await fetchApi(`/v1/reports/${input.id}`)),
    getDebuggerEvents: async (input: { id: string }) =>
      fetchApi(`/v1/reports/${input.id}/events`),
    getNetworkRequests: async (_input: { id: string; page?: number }) => ({
      items: [] as unknown[],
      pagination: { hasNextPage: false, page: 1 },
    }),
    update: updateBugReport,
    updateBulk: updateBugReportsBulk,
    delete: deleteBugReport,
    deleteBulk: deleteBugReportsBulk,
    retryDebuggerIngestion: retryBugReportDebuggerIngestion,
  },
  billing: {
    getCurrentOrganizationPlan: async (_input?: {
      organizationId?: string;
    }) => ({
      plan: "pro" as const,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null as string | null,
      currentPeriodStart: null as string | null,
      entitlements: { memberCap: null as number | null },
      memberCount: 0,
      subscriptionStatus: "active",
    }),
    getPlanLimits: async () => DEFAULT_PLAN_LIMITS,
    listPlans: async () => [],
    createCheckoutSession: async () => ({ url: "" }),
  },
  captureKey: {
    list: async (init?: {
      headers?: IncomingRequestHeaders
      organizationId: string
    }) => {
      const orgId = init?.organizationId
      if (!orgId) {
        throw new Error("captureKey.list requires organizationId")
      }
      try {
        const data = await fetchApiWithRequestHeaders(
          `/v1/orgs/${orgId}/capture-keys`,
          {
            headers: init?.headers,
          }
        )
        return normalizeCaptureKeyList(data)
      } catch {
        return []
      }
    },
    create: async (input: {
      organizationId: string
      label: string
      allowedOrigins: string[]
    }) => {
      return fetchApi(`/v1/orgs/${input.organizationId}/capture-keys`, {
        method: "POST",
        body: JSON.stringify({
          label: input.label,
          allowedOrigins: input.allowedOrigins,
        }),
      })
    },
    update: async (input: {
      organizationId: string
      keyId: string
      label: string
      allowedOrigins: string[]
    }) => {
      return fetchApi(
        `/v1/orgs/${input.organizationId}/capture-keys/${input.keyId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            label: input.label,
            allowedOrigins: input.allowedOrigins,
          }),
        }
      )
    },
    delete: async (input: { organizationId: string; keyId: string }) => {
      return fetchApi(
        `/v1/orgs/${input.organizationId}/capture-keys/${input.keyId}`,
        { method: "DELETE" }
      )
    },
    revoke: async (input: { organizationId: string; keyId: string }) => {
      return fetchApi(
        `/v1/orgs/${input.organizationId}/capture-keys/${input.keyId}/revoke`,
        { method: "POST" }
      )
    },
    rotate: async (input: { organizationId: string; keyId: string }) => {
      return fetchApi(
        `/v1/orgs/${input.organizationId}/capture-keys/${input.keyId}/rotate`,
        { method: "POST" }
      )
    },
  },
  organization: {
    listMembers: async () => [],
    inviteMember: async () => ({}),
  },
};

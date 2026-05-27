import type {
  BugReportStatus,
  BugReportVisibility,
} from "@spotting/shared/constants/bug-report";
import { BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS } from "@spotting/shared/constants/bug-report";
import type { Priority } from "@spotting/shared/constants/priorities";

import type { SharedBugReport } from "@/app/s/[id]/_components/types";
import { fetchApi } from "@/lib/api-fetch";

export type UpdateBugReportInput = {
  id: string;
  title?: string;
  description?: string;
  status?: BugReportStatus;
  priority?: Priority;
  visibility?: BugReportVisibility;
  tags?: string[];
  groupId?: string | null;
};

export type UpdateBugReportsBulkInput = {
  ids: string[];
  status?: BugReportStatus;
  priority?: Priority;
  visibility?: BugReportVisibility;
  tags?: string[];
  groupId?: string | null;
};

export type NetworkRequestDto = {
  id: string;
  method: string;
  url: string;
  status: number | null;
  duration: number | null;
  timestamp: string;
  offset: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
};

export type NetworkRequestsPage = {
  items: NetworkRequestDto[];
  pagination: { hasNextPage: boolean; page: number };
};

export type DebuggerEventsPayload = {
  actions: Array<{
    id: string;
    type: string;
    target: string | null;
    timestamp: string;
    offset: number;
    metadata?: Record<string, unknown>;
  }>;
  logs: Array<{
    id: string;
    level: string;
    message: string;
    timestamp: string;
    offset: number;
  }>;
  network: NetworkRequestDto[];
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/** Map Prisma `GET /v1/reports/:id` JSON into the shape the `/s/[id]` UI expects. */
export function normalizeBugReportDto(raw: unknown): SharedBugReport {
  const row = asRecord(raw);
  if (!row) {
    throw new Error("Invalid report payload");
  }

  const meta = asRecord(row.metadataJson) ?? {};
  const orgRow = asRecord(row.organization);
  const reporterRow = asRecord(row.reporterUser);

  const viewportObj = asRecord(meta.viewport);
  const viewportStr =
    viewportObj &&
    typeof viewportObj.w === "number" &&
    typeof viewportObj.h === "number"
      ? `${viewportObj.w}x${viewportObj.h}`
      : undefined;

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
        };

  const reporter =
    reporterRow && typeof reporterRow.name === "string"
      ? {
          id: String(reporterRow.id ?? ""),
          name: String(reporterRow.name),
          email:
            typeof reporterRow.email === "string" ? reporterRow.email : "",
        }
      : undefined;

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
    groupId:
      typeof row.groupId === "string"
        ? row.groupId
        : row.groupId === null
          ? null
          : undefined,
    group:
      asRecord(row.group) && typeof asRecord(row.group)?.name === "string"
        ? {
            id: String(asRecord(row.group)!.id ?? ""),
            name: String(asRecord(row.group)!.name),
          }
        : null,
  } as SharedBugReport;
}

export async function updateBugReport(input: UpdateBugReportInput) {
  const { id, ...body } = input;
  return fetchApi(`/v1/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function updateBugReportsBulk(input: UpdateBugReportsBulkInput) {
  return fetchApi("/v1/reports/bulk", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteBugReport(input: { id: string }) {
  return fetchApi(`/v1/reports/${input.id}`, { method: "DELETE" });
}

export async function deleteBugReportsBulk(input: { ids: string[] }) {
  return fetchApi("/v1/reports/bulk", {
    method: "DELETE",
    body: JSON.stringify(input),
  });
}

export async function retryBugReportDebuggerIngestion(input: { id: string }) {
  return fetchApi(`/v1/reports/${input.id}/retry`, { method: "POST" });
}

export const reportClient = {
  getById: async (input: { id: string }) =>
    normalizeBugReportDto(await fetchApi(`/v1/reports/${input.id}`)),
  getDebuggerEvents: async (input: { id: string }) =>
    fetchApi(`/v1/reports/${input.id}/events`) as Promise<DebuggerEventsPayload>,
  getNetworkRequests: async (input: {
    id: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 10;
    const searchQ =
      input.search !== undefined && input.search !== ""
        ? `&search=${encodeURIComponent(input.search)}`
        : "";
    const raw = await fetchApi(
      `/v1/reports/${input.id}/network?page=${page}&pageSize=${pageSize}${searchQ}`,
    );
    if (raw && typeof raw === "object" && "items" in raw && "pagination" in raw) {
      return raw as NetworkRequestsPage;
    }
    return {
      items: [],
      pagination: { hasNextPage: false, page },
    };
  },
  getNetworkRequestPayload: async (input: { id: string; requestId: string }) =>
    fetchApi(`/v1/reports/${input.id}/network/${input.requestId}`) as Promise<
      NetworkRequestDto & {
        requestBody?: string;
        responseBody?: string;
      }
    >,
  update: updateBugReport,
  updateBulk: updateBugReportsBulk,
  delete: deleteBugReport,
  deleteBulk: deleteBugReportsBulk,
  retryDebuggerIngestion: retryBugReportDebuggerIngestion,
};

export const reportQueries = {
  bugReport: {
    list: {
      infiniteOptions: (input: unknown) => ({
        queryKey: ["bugReport.list", input],
        queryFn: ({ pageParam = 1 }: { pageParam?: number }) =>
          fetchApi(`/v1/reports?page=${pageParam}`),
        initialPageParam: 1,
        getNextPageParam: (lastPage: {
          page?: number;
          totalPages?: number;
        }) => {
          const page = lastPage?.page;
          const totalPages = lastPage?.totalPages;
          if (
            typeof page !== "number" ||
            typeof totalPages !== "number" ||
            page >= totalPages
          ) {
            return undefined;
          }
          return page + 1;
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
        input: { id: string };
        enabled?: boolean;
        [key: string]: unknown;
      }) => {
        const { input, ...rest } = opts;
        return {
          queryKey: ["bugReport.getById", input.id],
          queryFn: async () => {
            const raw = await fetchApi(`/v1/reports/${input.id}`);
            return normalizeBugReportDto(raw);
          },
          ...rest,
        };
      },
    },
    getNetworkRequests: {
      infiniteOptions: (opts: {
        initialPageParam?: number;
        input: (pageParam: number) => {
          id: string;
          page?: number;
          perPage: number;
          search?: string | undefined;
        };
        queryKey?: readonly unknown[];
        getNextPageParam?: (lastPage: {
          pagination: { hasNextPage: boolean; page: number };
          items: unknown[];
        }) => number | undefined;
        enabled?: boolean;
      }) => {
        const initial = opts.initialPageParam ?? 1;
        const first = opts.input(initial);
        return {
          queryKey: opts.queryKey ?? [
            "bugReport.getNetworkRequests",
            first.id,
          ],
          initialPageParam: initial,
          queryFn: async ({ pageParam = initial }: { pageParam?: number }) => {
            const params = opts.input(pageParam ?? initial);
            const searchQ =
              params.search !== undefined && params.search !== ""
                ? `&search=${encodeURIComponent(params.search)}`
                : "";
            const raw = await fetchApi(
              `/v1/reports/${params.id}/network?page=${pageParam}&pageSize=${params.perPage}${searchQ}`,
            );
            if (
              raw &&
              typeof raw === "object" &&
              "items" in raw &&
              "pagination" in raw
            ) {
              return raw as NetworkRequestsPage;
            }
            return {
              items: [] as NetworkRequestDto[],
              pagination: {
                hasNextPage: false,
                page: pageParam ?? initial,
              },
            };
          },
          getNextPageParam:
            opts.getNextPageParam ??
            ((lastPage: {
              pagination: { hasNextPage: boolean; page: number };
            }) =>
              lastPage.pagination.hasNextPage
                ? lastPage.pagination.page + 1
                : undefined),
          enabled: opts.enabled,
        };
      },
    },
    getDebuggerEvents: {
      queryOptions: (opts: {
        input: { id: string };
        enabled?: boolean;
        [key: string]: unknown;
      }) => {
        const { input, ...rest } = opts;
        return {
          queryKey: ["bugReport.getDebuggerEvents", input.id],
          queryFn: () => fetchApi(`/v1/reports/${input.id}/events`),
          ...rest,
        };
      },
    },
    getNetworkRequestPayload: {
      queryOptions: (opts: {
        input: { id: string; requestId: string };
        enabled?: boolean;
        staleTime?: number;
        [key: string]: unknown;
      }) => {
        const { input, ...rest } = opts;
        return {
          queryKey: [
            "bugReport.getNetworkRequestPayload",
            input.id,
            input.requestId,
          ],
          queryFn: () =>
            fetchApi(
              `/v1/reports/${input.id}/network/${input.requestId}`,
            ) as Promise<
              NetworkRequestDto & {
                requestBody?: string;
                responseBody?: string;
              }
            >,
          ...rest,
        };
      },
    },
    delete: {
      useMutation: () => ({
        mutationFn: (input: { id: string }) =>
          fetchApi(`/v1/reports/${input.id}`, { method: "DELETE" }),
      }),
    },
    bulkDelete: {
      useMutation: () => ({
        mutationFn: (input: { ids: string[] }) =>
          fetchApi("/v1/reports/bulk", {
            method: "DELETE",
            body: JSON.stringify({ ids: input.ids }),
          }),
      }),
    },
    retryIngestion: {
      useMutation: () => ({
        mutationFn: (input: { id: string }) =>
          fetchApi(`/v1/reports/${input.id}/retry`, { method: "POST" }),
      }),
    },
  },
};

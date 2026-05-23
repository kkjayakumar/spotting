export type OrpcClient = typeof import("@/utils/orpc").client

export interface DeviceInfo {
  browser?: string
  os?: string
  viewport?: string
}

/** Normalized report shape for `/s/[id]` (see `normalizeBugReportDto` in `@/utils/orpc`). */
export interface SharedBugReport {
  id: string
  title?: string | null
  description?: string | null
  status: string
  priority: string
  createdAt: string | Date
  url?: string
  metadata?: unknown
  deviceInfo?: DeviceInfo | null
  organization?: { id: string; name: string; slug?: string }
  reporter?: { id?: string; name?: string; email?: string }
  attachmentUrl?: string | null
  attachmentType?: string
  submissionStatus: string
  /** When true, dashboard users may open the edit sheet (from API or client). */
  canEdit?: boolean
  tags: string[]
  visibility: string
  debuggerIngestionError: string | null
  debuggerIngestionStatus: string
}

export type SharedBugReportDebuggerEvents = Awaited<
  ReturnType<OrpcClient["bugReport"]["getDebuggerEvents"]>
>
export type DebuggerAction = SharedBugReportDebuggerEvents["actions"][number]
export type DebuggerLog = SharedBugReportDebuggerEvents["logs"][number]

export type SharedNetworkRequestsPage = Awaited<
  ReturnType<OrpcClient["bugReport"]["getNetworkRequests"]>
>
export type DebuggerNetworkRequest = SharedNetworkRequestsPage["items"][number]

export type DebuggerTimelineKind = "action" | "log" | "network"

export interface DebuggerTimelineEntry {
  id: string
  kind: DebuggerTimelineKind
  label: string
  detail: string
  timestamp: string
  offset: number | null
}

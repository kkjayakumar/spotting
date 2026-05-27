/** Row shape for dashboard cards; matches GET /v1/reports `items[]` plus optional UI fields. */
export type ReportGridItem = {
  id: string
  title: string
  description?: string | null
  createdAt: string
  updatedAt?: string
  status: string
  priority: string
  visibility: string
  pageUrl?: string | null
  /** Legacy alias used by some UI paths */
  url?: string | null
  tags?: unknown
  submissionStatus?: string
  debuggerIngestionStatus?: string
  debuggerIngestionError?: string | null
  attachmentType?: string
  thumbnail?: string | null
  attachmentUrl?: string | null
  duration?: string | number | null
  groupId?: string | null
  group?: { id: string; name: string } | null
}

export type ReportListPage = {
  items: ReportGridItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** GET /v1/reports/stats — fields optional when API stubbed */
export type ReportDashboardStats = {
  open?: number
  untriaged?: number
  mine?: number
  total?: number
}

/** @deprecated Use ReportGridItem */
export type BugReportListItem = ReportGridItem

/** @deprecated Use ReportListPage */
export type BugReportListResponse = ReportListPage

/** @deprecated Use ReportDashboardStats */
export type BugReportStats = ReportDashboardStats

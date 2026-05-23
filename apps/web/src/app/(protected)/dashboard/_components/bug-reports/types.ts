/** Row shape for dashboard cards; matches GET /v1/reports `items[]` plus optional UI fields. */
export type BugReportListItem = {
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
}

export type BugReportListResponse = {
  items: BugReportListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** GET /v1/reports/stats — fields optional when API stubbed */
export type BugReportStats = {
  open?: number
  untriaged?: number
  mine?: number
  total?: number
}

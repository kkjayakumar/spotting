import type {
  BugReportStatus,
  BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import type { Priority } from "@spotting/shared/constants/priorities"

import { fetchApi } from "@/lib/api-fetch"

export type UpdateBugReportInput = {
  id: string
  title?: string
  description?: string
  status?: BugReportStatus
  priority?: Priority
  visibility?: BugReportVisibility
  tags?: string[]
}

export type UpdateBugReportsBulkInput = {
  ids: string[]
  status?: BugReportStatus
  priority?: Priority
  visibility?: BugReportVisibility
  tags?: string[]
}

export async function updateBugReport(input: UpdateBugReportInput) {
  const { id, ...body } = input
  return fetchApi(`/v1/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function updateBugReportsBulk(input: UpdateBugReportsBulkInput) {
  return fetchApi("/v1/reports/bulk", {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function deleteBugReport(input: { id: string }) {
  return fetchApi(`/v1/reports/${input.id}`, { method: "DELETE" })
}

export async function deleteBugReportsBulk(input: { ids: string[] }) {
  return fetchApi("/v1/reports/bulk", {
    method: "DELETE",
    body: JSON.stringify(input),
  })
}

export async function retryBugReportDebuggerIngestion(input: { id: string }) {
  return fetchApi(`/v1/reports/${input.id}/retry`, { method: "POST" })
}

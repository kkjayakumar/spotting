import {
  BUG_REPORT_SORT_OPTIONS,
  BUG_REPORT_STATUS_OPTIONS,
  BUG_REPORT_VISIBILITY_OPTIONS,
  type BugReportSort,
  type BugReportStatus,
  type BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import {
  PRIORITY_OPTIONS,
  type Priority,
} from "@spotting/shared/constants/priorities"

export const REPORT_STATUS_CHOICES: Array<{
  value: BugReportStatus
  label: string
}> = [
  { value: BUG_REPORT_STATUS_OPTIONS.open, label: "Open" },
  { value: BUG_REPORT_STATUS_OPTIONS.inProgress, label: "In Progress" },
  { value: BUG_REPORT_STATUS_OPTIONS.resolved, label: "Resolved" },
  { value: BUG_REPORT_STATUS_OPTIONS.closed, label: "Closed" },
]

export const REPORT_PRIORITY_CHOICES: Array<{
  value: Priority
  label: string
}> = [
  { value: PRIORITY_OPTIONS.critical, label: "Critical" },
  { value: PRIORITY_OPTIONS.high, label: "High" },
  { value: PRIORITY_OPTIONS.medium, label: "Medium" },
  { value: PRIORITY_OPTIONS.low, label: "Low" },
  { value: PRIORITY_OPTIONS.none, label: "None" },
]

export const REPORT_VISIBILITY_CHOICES: Array<{
  value: BugReportVisibility
  label: string
}> = [
  { value: BUG_REPORT_VISIBILITY_OPTIONS.private, label: "Private" },
  { value: BUG_REPORT_VISIBILITY_OPTIONS.public, label: "Public" },
]

export const REPORT_SORT_CHOICES: Array<{
  value: BugReportSort
  label: string
}> = [
  { value: BUG_REPORT_SORT_OPTIONS.newest, label: "Newest" },
  { value: BUG_REPORT_SORT_OPTIONS.oldest, label: "Oldest" },
  { value: BUG_REPORT_SORT_OPTIONS.updated, label: "Recently Updated" },
  {
    value: BUG_REPORT_SORT_OPTIONS.priorityHigh,
    label: "Priority: High to Low",
  },
  {
    value: BUG_REPORT_SORT_OPTIONS.priorityLow,
    label: "Priority: Low to High",
  },
]

export interface ReportListFilters {
  statuses: BugReportStatus[]
  priorities: Priority[]
  visibilities: BugReportVisibility[]
}

export const CLEARED_REPORT_FILTERS: ReportListFilters = {
  statuses: [],
  priorities: [],
  visibilities: [],
}

/** @deprecated Use ReportListFilters */
export type DashboardFilters = ReportListFilters

/** @deprecated Use CLEARED_REPORT_FILTERS */
export const EMPTY_FILTERS = CLEARED_REPORT_FILTERS

/** @deprecated Use REPORT_STATUS_CHOICES */
export const STATUS_OPTIONS = REPORT_STATUS_CHOICES

/** @deprecated Use REPORT_PRIORITY_CHOICES */
export const PRIORITY_FILTER_OPTIONS = REPORT_PRIORITY_CHOICES

/** @deprecated Use REPORT_VISIBILITY_CHOICES */
export const VISIBILITY_OPTIONS = REPORT_VISIBILITY_CHOICES

/** @deprecated Use REPORT_SORT_CHOICES */
export const SORT_OPTIONS = REPORT_SORT_CHOICES

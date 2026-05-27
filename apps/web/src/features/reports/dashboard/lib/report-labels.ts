import type {
  BugReportStatus,
  BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import type { Priority } from "@spotting/shared/constants/priorities"

import {
  REPORT_PRIORITY_CHOICES,
  REPORT_STATUS_CHOICES,
  REPORT_VISIBILITY_CHOICES,
} from "./filter-options"

export function labelForReportStatus(status: string): string {
  const match = REPORT_STATUS_CHOICES.find(
    (choice) => choice.value === (status as BugReportStatus)
  )
  return match?.label ?? status
}

export function labelForPriority(priority: string): string {
  const match = REPORT_PRIORITY_CHOICES.find(
    (choice) => choice.value === (priority as Priority)
  )
  return match?.label ?? priority
}

export function labelForVisibility(visibility: string): string {
  const match = REPORT_VISIBILITY_CHOICES.find(
    (choice) => choice.value === (visibility as BugReportVisibility)
  )
  return match?.label ?? visibility
}

/** @deprecated Use labelForReportStatus */
export const formatStatusLabel = labelForReportStatus

/** @deprecated Use labelForPriority */
export const formatPriorityLabel = labelForPriority

/** @deprecated Use labelForVisibility */
export const formatVisibilityLabel = labelForVisibility

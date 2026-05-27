import {
  BUG_REPORT_STATUS_OPTIONS,
  BUG_REPORT_VISIBILITY_OPTIONS,
  type BugReportStatus,
  type BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import {
  PRIORITY_OPTIONS,
  type Priority,
} from "@spotting/shared/constants/priorities"

export function chipClassForStatus(status: string): string {
  switch (status as BugReportStatus) {
    case BUG_REPORT_STATUS_OPTIONS.open:
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
    case BUG_REPORT_STATUS_OPTIONS.inProgress:
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300"
    case BUG_REPORT_STATUS_OPTIONS.resolved:
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300"
    case BUG_REPORT_STATUS_OPTIONS.closed:
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-300"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

export function chipClassForPriority(priority: string): string {
  switch (priority as Priority) {
    case PRIORITY_OPTIONS.critical:
      return "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300"
    case PRIORITY_OPTIONS.high:
      return "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/50 dark:text-orange-300"
    case PRIORITY_OPTIONS.medium:
      return "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/50 dark:text-yellow-300"
    case PRIORITY_OPTIONS.low:
      return "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/50 dark:bg-teal-950/50 dark:text-teal-300"
    case PRIORITY_OPTIONS.none:
      return "border-border bg-muted/70 text-muted-foreground"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

export function chipClassForVisibility(visibility: string): string {
  switch (visibility as BugReportVisibility) {
    case BUG_REPORT_VISIBILITY_OPTIONS.private:
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/50 dark:text-violet-300"
    case BUG_REPORT_VISIBILITY_OPTIONS.public:
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/50 dark:text-sky-300"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

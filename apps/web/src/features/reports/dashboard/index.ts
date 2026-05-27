/**
 * Spotting dashboard reports list feature module.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Spec: docs/specs/dashboard-reports.md
 */

export {
  SpottingReportsList,
  BugReportsList,
} from "./components/spotting-reports-list"
export { ReportGridCard, BugReportCard } from "./components/report-grid-card"
export { ReportsQueryBar, BugReportsToolbar } from "./components/reports-query-bar"
export {
  ReportsBulkEditor,
  BugReportsBulkActions,
} from "./components/reports-bulk-editor"
export {
  ReportsRemovalDialogs,
  BugReportsDeleteDialogs,
} from "./components/reports-removal-dialogs"

export { useReportsInfiniteQuery, useBugReportsData } from "./hooks/use-reports-infinite-query"
export { useReportsUrlFilters, useBugReportsFilters } from "./hooks/use-reports-url-filters"
export {
  useReportsSelectionActions,
  useBugReportsActions,
} from "./hooks/use-reports-selection-actions"

export type {
  ReportGridItem,
  ReportListPage,
  ReportDashboardStats,
  BugReportListItem,
  BugReportListResponse,
  BugReportStats,
} from "./types"

export {
  CLEARED_REPORT_FILTERS,
  EMPTY_FILTERS,
  REPORT_PRIORITY_CHOICES,
  PRIORITY_FILTER_OPTIONS,
  REPORT_SORT_CHOICES,
  SORT_OPTIONS,
  REPORT_STATUS_CHOICES,
  STATUS_OPTIONS,
  REPORT_VISIBILITY_CHOICES,
  VISIBILITY_OPTIONS,
  type ReportListFilters,
  type DashboardFilters,
} from "./lib/filter-options"

export {
  labelForPriority,
  labelForReportStatus,
  labelForVisibility,
  formatPriorityLabel,
  formatStatusLabel,
  formatVisibilityLabel,
} from "./lib/report-labels"

export { splitBulkTags, toggleInSet, parseTagInput, toggleValue } from "./lib/list-helpers"

export {
  extractRequestErrorMessage,
  getRequestErrorMessage,
} from "./settings/extract-request-error"
export {
  parseCaptureOrigins,
  serializeCaptureOrigins,
  parsePublicKeyOrigins,
  formatPublicKeyOrigins,
} from "./settings/capture-origin-parsing"
export { displayOrgRole, formatRoleLabel } from "./settings/org-role-display"
export type {
  OrgMemberRecord,
  OrgInviteRecord,
  OrgMemberRole,
  OrganizationMemberRow,
  OrganizationInvitationRow,
  OrganizationRole,
} from "./settings/org-member-models"
export type {
  BillingCadence,
  BillingInterval,
  BillingOverviewProps,
  BillingPlan,
  BillingPlanLimits,
  BillingPriceSnapshot,
  BillingSnapshot,
  OrganizationBillingCardProps,
  PlanCardContext,
  PlanLimitMatrix,
  PlanOption,
  PlanOptionCardContext,
  SpottingBillingPlan,
  SwitchablePlan,
  UpgradablePlan,
  UpgradePlanChoice,
  BillingSummaryPricing,
  BillingSummarySnapshot,
} from "./settings/billing-plan-models"
export {
  NewCaptureKeyForm,
  PublicKeyCreateForm,
} from "./settings/new-capture-key-form"

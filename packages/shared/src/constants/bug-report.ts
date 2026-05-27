/**
 * Spotting report workflow statuses (stored on Report.status).
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const REPORT_STATUS = {
  open: "open",
  inProgress: "in_progress",
  resolved: "resolved",
  closed: "closed",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

/** @deprecated Use REPORT_STATUS — kept for dashboard imports during migration */
export const BUG_REPORT_STATUS_OPTIONS = REPORT_STATUS;
export type BugReportStatus = ReportStatus;

export const REPORT_VISIBILITY = {
  public: "public",
  private: "private",
} as const;

export type ReportVisibility =
  (typeof REPORT_VISIBILITY)[keyof typeof REPORT_VISIBILITY];

/** @deprecated Use REPORT_VISIBILITY */
export const BUG_REPORT_VISIBILITY_OPTIONS = REPORT_VISIBILITY;
export type BugReportVisibility = ReportVisibility;

export const REPORT_SUBMISSION_STATUS = {
  processing: "processing",
  ready: "ready",
  failed: "failed",
} as const;

export type ReportSubmissionStatus =
  (typeof REPORT_SUBMISSION_STATUS)[keyof typeof REPORT_SUBMISSION_STATUS];

/** @deprecated Use REPORT_SUBMISSION_STATUS */
export const BUG_REPORT_SUBMISSION_STATUS_OPTIONS = REPORT_SUBMISSION_STATUS;
export type BugReportSubmissionStatus = ReportSubmissionStatus;

export const REPORT_DEBUGGER_INGESTION_STATUS = {
  notUploaded: "not_uploaded",
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const;

export type ReportDebuggerIngestionStatus =
  (typeof REPORT_DEBUGGER_INGESTION_STATUS)[keyof typeof REPORT_DEBUGGER_INGESTION_STATUS];

/** @deprecated Use REPORT_DEBUGGER_INGESTION_STATUS */
export const BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS =
  REPORT_DEBUGGER_INGESTION_STATUS;
export type BugReportDebuggerIngestionStatus = ReportDebuggerIngestionStatus;

export const REPORT_SORT = {
  newest: "newest",
  oldest: "oldest",
  updated: "updated",
  priorityHigh: "priority_high",
  priorityLow: "priority_low",
} as const;

export type ReportSort = (typeof REPORT_SORT)[keyof typeof REPORT_SORT];

/** @deprecated Use REPORT_SORT */
export const BUG_REPORT_SORT_OPTIONS = REPORT_SORT;
export type BugReportSort = ReportSort;

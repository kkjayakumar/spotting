/**
 * Spotting report viewer metadata helpers.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS,
  BUG_REPORT_STATUS_OPTIONS,
  BUG_REPORT_SUBMISSION_STATUS_OPTIONS,
} from "@spotting/shared/constants/bug-report"

export function readRecordingDurationMs(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") {
    return null
  }

  const durationMs = (metadata as { durationMs?: unknown }).durationMs
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs)) {
    return null
  }

  return Math.max(0, Math.floor(durationMs))
}

export function labelSubmissionStatus(status: string): string {
  switch (status) {
    case BUG_REPORT_SUBMISSION_STATUS_OPTIONS.processing:
      return "Processing uploaded artifacts"
    case BUG_REPORT_SUBMISSION_STATUS_OPTIONS.failed:
      return "Report processing failed"
    default:
      return "Report ready"
  }
}

export function labelDebuggerIngestionStatus(status: string): string {
  switch (status) {
    case BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS.notUploaded:
      return "Not uploaded"
    case BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS.pending:
      return "Pending"
    case BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS.processing:
      return "Processing"
    case BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS.failed:
      return "Failed"
    default:
      return "Completed"
  }
}

export function labelReportStatus(status: string): string {
  switch (status) {
    case BUG_REPORT_STATUS_OPTIONS.inProgress:
      return "In Progress"
    case BUG_REPORT_STATUS_OPTIONS.resolved:
      return "Resolved"
    case BUG_REPORT_STATUS_OPTIONS.closed:
      return "Closed"
    default:
      return "Open"
  }
}

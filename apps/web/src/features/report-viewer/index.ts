/**
 * Spotting public report viewer feature module.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Spec: docs/specs/report-viewer.md
 */

export { SpottingReportViewer, BugReportView } from "./components/spotting-report-viewer"
export type { InspectorTab } from "./constants"
export { useSpottingReportViewer } from "./hooks/use-spotting-report-viewer"
export type {
  DebuggerTimelineEntry,
  SharedBugReport,
  SpottingReportViewModel,
} from "./types"

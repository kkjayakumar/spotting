/**
 * Spotting report priority scale.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const REPORT_PRIORITY = {
  none: "none",
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;

export type ReportPriority =
  (typeof REPORT_PRIORITY)[keyof typeof REPORT_PRIORITY];

/** @deprecated Use REPORT_PRIORITY */
export const PRIORITY_OPTIONS = REPORT_PRIORITY;
export type Priority = ReportPriority;

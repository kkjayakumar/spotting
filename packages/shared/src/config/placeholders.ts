/**
 * Spotting UI placeholder copy for empty states.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const PLACEHOLDER_COPY = {
  default: "-",
  none: "None",
  notAvailable: "N/A",
  unknown: "Unknown",
  notSet: "Not set",
  notSpecified: "Not specified",
} as const

export const placeholders = PLACEHOLDER_COPY

export type SpottingPlaceholderKey = keyof typeof PLACEHOLDER_COPY

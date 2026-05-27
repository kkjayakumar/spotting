/**
 * Spotting locale formatting helpers.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
  year: "numeric",
}

export function formatDate(
  input: Date | string | number | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (input === undefined || input === null) {
    return ""
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      ...DEFAULT_DATE_OPTIONS,
      ...options,
    }).format(new Date(input))
  } catch {
    return ""
  }
}

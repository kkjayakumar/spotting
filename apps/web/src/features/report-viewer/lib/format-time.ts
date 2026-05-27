/**
 * Spotting viewer time formatting.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export function formatTimelineOffset(offsetMs: number): string {
  const safeMs = Math.max(0, Math.floor(offsetMs))
  const totalSeconds = Math.floor(safeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const tenths = Math.floor((safeMs % 1000) / 100)

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`
}

export function formatTimelineRowCaption(
  timestamp: string,
  offsetMs: number | null
): string {
  const offsetLabel =
    typeof offsetMs === "number"
      ? `Video ${formatTimelineOffset(offsetMs)}`
      : "Outside recording"

  return `${offsetLabel} • ${new Date(timestamp).toLocaleTimeString()}`
}

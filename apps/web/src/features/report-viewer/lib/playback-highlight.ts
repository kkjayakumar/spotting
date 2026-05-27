/**
 * Spotting viewer playback highlight selection.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PLAYBACK_HIGHLIGHT_BUCKET_MS } from "../constants"
import type { DebuggerTimelineEntry } from "../types"

function offsetBucket(offsetMs: number): number {
  return Math.floor(Math.max(0, offsetMs) / PLAYBACK_HIGHLIGHT_BUCKET_MS)
}

export function entryIdsHighlightedAtPlaybackMs(input: {
  entries: DebuggerTimelineEntry[]
  playbackMs: number
  videoAttached: boolean
}): string[] {
  if (!input.videoAttached) {
    return []
  }

  const timedEntries = input.entries
    .filter(
      (entry): entry is DebuggerTimelineEntry & { offset: number } =>
        typeof entry.offset === "number"
    )
    .sort((left, right) => left.offset - right.offset)

  let activeBucket: number | null = null

  for (const entry of timedEntries) {
    if (entry.offset <= input.playbackMs) {
      activeBucket = offsetBucket(entry.offset)
    }
  }

  if (activeBucket === null) {
    return []
  }

  return timedEntries
    .filter((entry) => offsetBucket(entry.offset) === activeBucket)
    .map((entry) => entry.id)
}

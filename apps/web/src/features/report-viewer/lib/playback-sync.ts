/**
 * Spotting viewer video seek synchronization.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { reportNonFatalError } from "@spotting/shared/lib/errors"

import type { DebuggerTimelineEntry } from "../types"

export function seekPlayersToTimelineEntry(input: {
  desktopPlayer: HTMLVideoElement | null
  mobilePlayer: HTMLVideoElement | null
  entry: DebuggerTimelineEntry
  resolveVisiblePlayer: () => HTMLVideoElement | null
  recordingDurationMs: number | null
  setPlaybackMs: (value: number) => void
  videoAttached: boolean
}): void {
  if (!input.videoAttached || typeof input.entry.offset !== "number") {
    return
  }

  const clampedMs =
    typeof input.recordingDurationMs === "number"
      ? Math.min(input.entry.offset, input.recordingDurationMs)
      : input.entry.offset

  const targetSeconds = clampedMs / 1000
  const visiblePlayer = input.resolveVisiblePlayer()
  const resumeAfterSeek = Boolean(visiblePlayer && !visiblePlayer.paused)

  for (const player of [input.desktopPlayer, input.mobilePlayer]) {
    if (player) {
      player.currentTime = targetSeconds
    }
  }

  input.setPlaybackMs(clampedMs)

  if (!(visiblePlayer && resumeAfterSeek)) {
    return
  }

  visiblePlayer.play().catch((error: unknown) => {
    reportNonFatalError(
      "Spotting viewer: playback resume failed after timeline seek",
      error
    )
  })
}

export function resolveVisibleVideoPlayer(input: {
  desktopPlayer: HTMLVideoElement | null
  mobilePlayer: HTMLVideoElement | null
}): HTMLVideoElement | null {
  if (input.desktopPlayer?.offsetParent !== null) {
    return input.desktopPlayer
  }

  if (input.mobilePlayer?.offsetParent !== null) {
    return input.mobilePlayer
  }

  return input.desktopPlayer ?? input.mobilePlayer ?? null
}

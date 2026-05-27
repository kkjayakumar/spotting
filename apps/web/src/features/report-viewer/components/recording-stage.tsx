/**
 * Spotting recording / screenshot stage.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

"use client"

import { reportNonFatalError } from "@spotting/shared/lib/errors"
import { InteractiveImageViewer } from "@spotting/ui/components/interactive-image-viewer"
import { FileTextIcon } from "lucide-react"
import {
  forwardRef,
  type SyntheticEvent,
  useCallback,
  useRef,
} from "react"

import { readRecordingDurationMs } from "../lib/report-metadata"
import type { SpottingReportViewModel } from "../types"

interface RecordingStageProps {
  compact?: boolean
  onPlaybackMsChange?: (ms: number) => void
  report: SpottingReportViewModel
}

export const RecordingStage = forwardRef<HTMLVideoElement, RecordingStageProps>(
  ({ compact = false, onPlaybackMsChange, report }, ref) => {
    const hasVideo =
      report.attachmentType === "video" && Boolean(report.attachmentUrl)
    const hasImage =
      report.attachmentType === "screenshot" && Boolean(report.attachmentUrl)
    const durationMs = readRecordingDurationMs(report.metadata)
    const primingRef = useRef(false)

    const primeDurationFromMetadata = useCallback(
      (event: SyntheticEvent<HTMLVideoElement>) => {
        const player = event.currentTarget
        if (primingRef.current) {
          return
        }

        if (!(typeof durationMs === "number" && durationMs > 0)) {
          return
        }

        if (Number.isFinite(player.duration) && player.duration > 0) {
          return
        }

        const seekTargetSec = Math.max(0, durationMs / 1000 - 0.001)
        if (seekTargetSec <= 0) {
          return
        }

        primingRef.current = true
        const previousTime = player.currentTime
        const wasPaused = player.paused

        player.addEventListener(
          "seeked",
          () => {
            const maxSec =
              Number.isFinite(player.duration) && player.duration > 0
                ? player.duration
                : durationMs / 1000
            player.currentTime = Math.min(previousTime, maxSec)
            primingRef.current = false
            if (!wasPaused) {
              player.play().catch((error: unknown) => {
                reportNonFatalError(
                  "Spotting viewer: failed to resume after duration prime",
                  error
                )
              })
            }
          },
          { once: true }
        )

        try {
          player.currentTime = seekTargetSec
        } catch {
          primingRef.current = false
        }
      },
      [durationMs]
    )

    const shellClass = compact
      ? "relative flex items-center justify-center overflow-hidden bg-muted/20"
      : "relative flex flex-1 items-center justify-center overflow-hidden bg-muted/20 p-4 md:p-8"

    const mediaWrapClass = compact
      ? "relative flex w-full items-center justify-center"
      : "relative flex h-full w-full max-w-7xl items-center justify-center"

    return (
      <div className={shellClass}>
        <div className={mediaWrapClass}>
          {hasVideo ? (
            // biome-ignore lint/a11y/useMediaCaption: customer uploads lack caption tracks
            <video
              className={
                compact
                  ? "h-auto w-full bg-black object-contain outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  : "max-h-full max-w-full rounded-lg bg-black object-contain shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              }
              controls
              onLoadedMetadata={primeDurationFromMetadata}
              onTimeUpdate={(event) => {
                if (primingRef.current) {
                  return
                }
                onPlaybackMsChange?.(event.currentTarget.currentTime * 1000)
              }}
              preload="metadata"
              ref={ref}
              src={report.attachmentUrl ?? undefined}
            />
          ) : hasImage ? (
            <InteractiveImageViewer
              alt={report.title ?? "Report attachment"}
              compact={compact}
              src={report.attachmentUrl ?? ""}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-background/50 p-8 text-muted-foreground">
              <FileTextIcon className="size-8 opacity-50" />
              <p className="text-sm">No visual attachment available</p>
            </div>
          )}
        </div>
      </div>
    )
  }
)

RecordingStage.displayName = "RecordingStage"

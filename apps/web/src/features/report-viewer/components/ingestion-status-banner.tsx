/**
 * Spotting viewer ingestion status banner.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS } from "@spotting/shared/constants/bug-report"
import { Button } from "@spotting/ui/components/ui/button"
import { Loader2Icon } from "lucide-react"

import {
  labelDebuggerIngestionStatus,
  labelSubmissionStatus,
} from "../lib/report-metadata"

interface IngestionStatusBannerProps {
  debuggerIngestionError: string | null
  debuggerIngestionStatus: string
  isRetrying: boolean
  onRetry: () => void
  submissionStatus: string
}

export function IngestionStatusBanner({
  debuggerIngestionError,
  debuggerIngestionStatus,
  isRetrying,
  onRetry,
  submissionStatus,
}: IngestionStatusBannerProps) {
  return (
    <div className="border-amber-200 border-b bg-amber-50 px-4 py-3 text-amber-950 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">{labelSubmissionStatus(submissionStatus)}</p>
          <p className="text-xs">
            Debugger ingestion: {labelDebuggerIngestionStatus(debuggerIngestionStatus)}
          </p>
          {debuggerIngestionError ? (
            <p className="text-xs">{debuggerIngestionError}</p>
          ) : null}
        </div>
        {debuggerIngestionStatus ===
        BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS.failed ? (
          <Button disabled={isRetrying} onClick={onRetry} size="sm" variant="outline">
            {isRetrying ? <Loader2Icon className="animate-spin" /> : null}
            Retry debugger ingest
          </Button>
        ) : null}
      </div>
    </div>
  )
}

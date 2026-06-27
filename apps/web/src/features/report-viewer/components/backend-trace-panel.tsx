"use client"

import { ServerIcon, ExternalLinkIcon } from "lucide-react"
import type { SpottingReportViewModel } from "../types"

const COPILOT_URL = process.env.NEXT_PUBLIC_DEVOPS_COPILOT_URL ?? "http://localhost:5000"

function readCorrelationId(report: SpottingReportViewModel): string | null {
  const meta = report.metadata
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null
  const correlationId = (meta as Record<string, unknown>).correlationId
  return typeof correlationId === "string" && correlationId ? correlationId : null
}

export function BackendTracePanel({ report }: { report: SpottingReportViewModel }) {
  const correlationId = readCorrelationId(report)
  if (!correlationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <ServerIcon className="size-6 text-muted-foreground" />
        <p className="font-medium text-foreground text-sm">No backend traces linked</p>
        <p className="max-w-xs text-muted-foreground text-xs">
          Ensure your frontend sends X-Request-Id on API calls. Spotting will capture it for correlation with DevOps Copilot.
        </p>
      </div>
    )
  }

  const issuesUrl = `${COPILOT_URL}/api/sentry/issues`
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">Correlation ID</p>
        <p className="mt-1 break-all font-mono text-sm">{correlationId}</p>
      </div>
      <p className="text-muted-foreground text-xs">
        Search DevOps Copilot Sentry issues for this request ID to find the matching backend exception.
      </p>
      <a
        className="inline-flex items-center gap-1.5 text-primary text-sm hover:underline"
        href={issuesUrl}
        rel="noreferrer"
        target="_blank"
      >
        Open DevOps Copilot Issues
        <ExternalLinkIcon className="size-3.5" />
      </a>
    </div>
  )
}
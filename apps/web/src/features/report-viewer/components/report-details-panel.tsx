/**
 * Spotting report details inspector panel.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Separator } from "@spotting/ui/components/ui/separator"
import { cn } from "@spotting/ui/lib/utils"

import type { DeviceInfo, SpottingReportViewModel } from "../types"
import { ReportPriorityField } from "./report-priority-field"
import { ReportProjectField } from "./report-project-field"

interface ReportDetailsPanelProps {
  report: SpottingReportViewModel
  onReportUpdated?: () => void | Promise<void>
}

function DetailField({
  className,
  label,
  value,
}: {
  className?: string
  label: string
  value?: string | null
}) {
  if (!value) {
    return null
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-muted-foreground text-xs">{label}</span>
      <span className={cn("wrap-break-word text-foreground text-sm", className)} title={value}>
        {value}
      </span>
    </div>
  )
}

export function ReportDetailsPanel({
  report,
  onReportUpdated,
}: ReportDetailsPanelProps) {
  const device = report.deviceInfo as DeviceInfo | null

  return (
    <div className="space-y-6 p-4">
      <section className="space-y-4">
        <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Session context
        </h3>
        <div className="grid gap-3 text-sm">
          <DetailField className="break-all" label="URL" value={report.url} />
          <DetailField label="Browser" value={device?.browser} />
          <DetailField label="OS" value={device?.os} />
          <DetailField label="Viewport" value={device?.viewport} />
        </div>
      </section>
      <Separator />
      <section className="space-y-4">
        <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Ticket
        </h3>
        <div className="grid gap-3 text-sm">
          <ReportPriorityField
            canEdit={report.canEdit}
            onUpdated={onReportUpdated}
            priority={report.priority}
            reportId={report.id}
          />
          <DetailField label="Reporter" value={report.reporter?.name?.trim()} />
          <DetailField
            label="Organization"
            value={report.organization?.name?.trim() || "—"}
          />
          <div className="pt-2">
            <span className="mb-1 block font-medium text-muted-foreground text-xs">
              Description
            </span>
            <p className="min-h-[60px] whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-foreground text-sm leading-relaxed">
              {report.description || "No description provided."}
            </p>
          </div>
        </div>
      </section>
      <Separator />
      <section className="space-y-3">
        <ReportProjectField
          canEdit={report.canEdit}
          groupId={report.groupId ?? report.group?.id ?? null}
          onUpdated={onReportUpdated}
          organizationId={report.organization?.id ?? null}
          reportId={report.id}
        />
      </section>
    </div>
  )
}

import * as React from "react"
import { Separator } from "@spotting/ui/components/ui/separator"
import { cn } from "@spotting/ui/lib/utils"
import { Globe, Compass, Laptop, Monitor, User, Building } from "lucide-react"

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
  icon,
}: {
  className?: string
  label: string
  value?: string | null
  icon?: React.ReactNode
}) {
  if (!value) {
    return null
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card/45 p-3 shadow-sm hover:bg-card/90 transition-colors">
      {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">{label}</span>
        <span className={cn("wrap-break-word text-foreground text-sm font-medium", className)} title={value}>
          {value}
        </span>
      </div>
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
        <h3 className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider px-1">
          Session context
        </h3>
        <div className="grid gap-2.5 text-sm">
          <DetailField
            className="break-all"
            label="URL"
            value={report.url}
            icon={<Globe className="size-4 text-blue-500 dark:text-blue-400" />}
          />
          <DetailField
            label="Browser"
            value={device?.browser}
            icon={<Compass className="size-4 text-indigo-500 dark:text-indigo-400" />}
          />
          <DetailField
            label="OS"
            value={device?.os}
            icon={<Laptop className="size-4 text-emerald-500 dark:text-emerald-400" />}
          />
          <DetailField
            label="Viewport"
            value={device?.viewport}
            icon={<Monitor className="size-4 text-amber-500 dark:text-amber-400" />}
          />
        </div>
      </section>
      <Separator />
      <section className="space-y-4">
        <h3 className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider px-1">
          Ticket
        </h3>
        <div className="grid gap-2.5 text-sm">
          <ReportPriorityField
            canEdit={report.canEdit}
            onUpdated={onReportUpdated}
            priority={report.priority}
            reportId={report.id}
          />
          <DetailField
            label="Reporter"
            value={report.reporter?.name?.trim()}
            icon={<User className="size-4 text-pink-500 dark:text-pink-400" />}
          />
          <DetailField
            label="Organization"
            value={report.organization?.name?.trim() || "—"}
            icon={<Building className="size-4 text-teal-500 dark:text-teal-400" />}
          />
          <div className="pt-2 px-1">
            <span className="mb-1.5 block font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
              Description
            </span>
            <div className="relative overflow-hidden rounded-lg border bg-card/45 p-3 shadow-sm hover:bg-card/90 transition-colors">
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary/70" />
              <p className="pl-2 whitespace-pre-wrap text-foreground text-sm leading-relaxed font-normal">
                {report.description || "No description provided."}
              </p>
            </div>
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

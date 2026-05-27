"use client"

import type { ReactNode } from "react"

import type { ReportDashboardStats } from "../types"
import {
  labelForPriority,
  labelForReportStatus,
  labelForVisibility,
} from "../lib/report-labels"
import type { ReportListFilters } from "../lib/filter-options"

interface ReportsSummaryChipsProps {
  stats?: ReportDashboardStats
  filters: ReportListFilters
}

export function ReportsSummaryChips({ stats, filters }: ReportsSummaryChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SummaryChip label="Open" value={stats?.open ?? 0} />
      <SummaryChip label="Untriaged" value={stats?.untriaged ?? 0} />
      <SummaryChip label="Mine" value={stats?.mine ?? 0} />
      <SummaryChip label="Total" value={stats?.total ?? 0} />
      {filters.statuses.map((status) => (
        <ActiveFacet key={status}>{labelForReportStatus(status)}</ActiveFacet>
      ))}
      {filters.priorities.map((priority) => (
        <ActiveFacet key={priority}>{labelForPriority(priority)}</ActiveFacet>
      ))}
      {filters.visibilities.map((visibility) => (
        <ActiveFacet key={visibility}>
          {labelForVisibility(visibility)}
        </ActiveFacet>
      ))}
    </div>
  )
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 font-medium text-xs">
      {label}: {value}
    </span>
  )
}

function ActiveFacet({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border bg-muted px-2 py-1 text-xs">
      {children}
    </span>
  )
}

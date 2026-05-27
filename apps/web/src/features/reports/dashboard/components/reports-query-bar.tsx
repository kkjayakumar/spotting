"use client"

import type {
  BugReportSort,
  BugReportStatus,
  BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import type { Priority } from "@spotting/shared/constants/priorities"
import { Button } from "@spotting/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@spotting/ui/components/ui/dropdown-menu"
import { Input } from "@spotting/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@spotting/ui/components/ui/select"
import { Filter, Search } from "lucide-react"

import {
  REPORT_PRIORITY_CHOICES,
  REPORT_SORT_CHOICES,
  REPORT_STATUS_CHOICES,
  REPORT_VISIBILITY_CHOICES,
  type ReportListFilters,
} from "../lib/filter-options"
import type { ReportDashboardStats } from "../types"
import { ReportsSummaryChips } from "./reports-summary-chips"

interface ReportsQueryBarProps {
  search: string
  sort: BugReportSort
  filters: ReportListFilters
  stats?: ReportDashboardStats
  onSearchChange: (value: string) => void
  onSortChange: (value: BugReportSort) => void
  onToggleStatus: (value: BugReportStatus) => void
  onTogglePriority: (value: Priority) => void
  onToggleVisibility: (value: BugReportVisibility) => void
  onClearFilters: () => void
}

export function ReportsQueryBar({
  search,
  sort,
  filters,
  stats,
  onSearchChange,
  onSortChange,
  onToggleStatus,
  onTogglePriority,
  onToggleVisibility,
  onClearFilters,
}: ReportsQueryBarProps) {
  const activeFacetCount =
    filters.statuses.length +
    filters.priorities.length +
    filters.visibilities.length
  const sortLabel =
    REPORT_SORT_CHOICES.find((choice) => choice.value === sort)?.label ??
    "Sort"

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title, description, or URL"
            value={search}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            onValueChange={(value) => onSortChange(value as BugReportSort)}
            value={sort}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue>{sortLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {REPORT_SORT_CHOICES.map((choice) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {choice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="sm" variant="outline">
                  <Filter className="size-4" />
                  Filters
                  {activeFacetCount > 0 ? ` (${activeFacetCount})` : ""}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                {REPORT_STATUS_CHOICES.map((choice) => (
                  <DropdownMenuCheckboxItem
                    checked={filters.statuses.includes(choice.value)}
                    key={choice.value}
                    onCheckedChange={() => onToggleStatus(choice.value)}
                  >
                    {choice.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                {REPORT_PRIORITY_CHOICES.map((choice) => (
                  <DropdownMenuCheckboxItem
                    checked={filters.priorities.includes(choice.value)}
                    key={choice.value}
                    onCheckedChange={() => onTogglePriority(choice.value)}
                  >
                    {choice.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                {REPORT_VISIBILITY_CHOICES.map((choice) => (
                  <DropdownMenuCheckboxItem
                    checked={filters.visibilities.includes(choice.value)}
                    key={choice.value}
                    onCheckedChange={() => onToggleVisibility(choice.value)}
                  >
                    {choice.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            disabled={activeFacetCount === 0}
            onClick={onClearFilters}
            size="sm"
            variant="ghost"
          >
            Clear filters
          </Button>
        </div>
      </div>

      <ReportsSummaryChips filters={filters} stats={stats} />
    </div>
  )
}

/** @deprecated Use ReportsQueryBar */
export const BugReportsToolbar = ReportsQueryBar

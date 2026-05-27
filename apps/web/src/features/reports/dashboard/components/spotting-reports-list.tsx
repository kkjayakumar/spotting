"use client"

/** Spotting dashboard reports list. Copyright (C) 2026 KK Jayakumar. SPDX-License-Identifier: AGPL-3.0-or-later */
import { Button } from "@spotting/ui/components/ui/button"
import { Loader2, Play } from "lucide-react"

import { SelectionActionBar } from "@/components/selection-action-bar"
import { canDeleteReports } from "@/lib/org-permissions"
import { REPORTS_GRID_SKELETON_KEYS } from "../constants"
import { useActiveOrganizationId } from "../hooks/use-active-organization-id"
import { useReportsInfiniteQuery } from "../hooks/use-reports-infinite-query"
import { useReportsSelectionActions } from "../hooks/use-reports-selection-actions"
import { useReportsUrlFilters } from "../hooks/use-reports-url-filters"
import { ReportGridCard } from "./report-grid-card"
import { ReportsBulkEditor } from "./reports-bulk-editor"
import { ReportsQueryBar } from "./reports-query-bar"
import { ReportsRemovalDialogs } from "./reports-removal-dialogs"

export function SpottingReportsList() {
  const urlFilters = useReportsUrlFilters()
  const { organizationId, memberRole } = useActiveOrganizationId()
  const allowDelete = canDeleteReports(memberRole)

  const {
    reports,
    stats,
    refreshAll,
    isError,
    errorMessage,
    isLoading,
    isFetching,
    refetch,
    sentinelRef,
  } = useReportsInfiniteQuery({
    search: urlFilters.debouncedSearch,
    sort: urlFilters.sort,
    filters: urlFilters.filters,
    groupId: urlFilters.selectedGroupId,
  })

  const selection = useReportsSelectionActions({
    reportIds: reports.map((report) => report.id),
    refreshAll,
    organizationId,
  })

  const listPadding =
    selection.selectedCount > 0
      ? "space-y-4 pb-40 sm:pb-32 lg:pb-28"
      : "space-y-4"

  return (
    <div className={listPadding}>
      <div className="min-w-0 space-y-4">
      <ReportsQueryBar
        filters={urlFilters.filters}
        onClearFilters={urlFilters.clearFilters}
        onSearchChange={urlFilters.setSearchValue}
        onSortChange={urlFilters.setSort}
        onTogglePriority={urlFilters.togglePriority}
        onToggleStatus={urlFilters.toggleStatus}
        onToggleVisibility={urlFilters.toggleVisibility}
        search={urlFilters.searchValue}
        sort={urlFilters.sort}
        stats={stats}
      />

      <SelectionActionBar
        actions={
          <ReportsBulkEditor
            allowDelete={allowDelete}
            bulkGroupId={selection.bulkGroupId}
            bulkPriority={selection.bulkPriority}
            bulkStatus={selection.bulkStatus}
            bulkTagsInput={selection.bulkTagsInput}
            bulkVisibility={selection.bulkVisibility}
            groups={selection.reportGroups}
            isBusy={selection.isMutating}
            onApply={selection.handleBulkUpdate}
            onBulkGroupChange={selection.setBulkGroupId}
            onBulkPriorityChange={selection.setBulkPriority}
            onBulkStatusChange={selection.setBulkStatus}
            onBulkTagsChange={selection.setBulkTagsInput}
            onBulkVisibilityChange={selection.setBulkVisibility}
            onRequestDelete={() => selection.setBulkDeleteOpen(true)}
          />
        }
        onClearSelection={selection.clearSelection}
        selectedCount={selection.selectedCount}
      />

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-medium text-sm">Failed to load reports</p>
          <p className="mt-1 text-muted-foreground text-sm">
            {errorMessage || "Unexpected error"}
          </p>
          <Button className="mt-3" onClick={() => refetch()} size="sm" variant="outline">
            Retry
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {REPORTS_GRID_SKELETON_KEYS.map((key) => (
            <div
              className="aspect-video w-full animate-pulse rounded-lg bg-muted"
              key={key}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && reports.length === 0 && !isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Play className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="font-semibold text-2xl">
              {urlFilters.hasActiveFilters
                ? "No matching reports"
                : "No reports yet"}
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              {urlFilters.hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Captured reports will appear here."}
            </p>
          </div>
        </div>
      ) : null}

      {reports.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {reports.map((report) => (
            <ReportGridCard
              allowDelete={allowDelete}
              isBusy={selection.isMutating}
              isSelected={selection.selectedIds.has(report.id)}
              key={report.id}
              onDeleteRequest={() => selection.setDeleteReportId(report.id)}
              onPatchReport={(input) =>
                selection.updateMutation.mutate({ id: report.id, ...input })
              }
              onReportSaved={refreshAll}
              onRetryIngest={() =>
                selection.retryIngestionMutation.mutate(report.id)
              }
              onSelectChange={(checked) =>
                selection.toggleSelection(report.id, checked)
              }
              organizationId={organizationId}
              report={report}
            />
          ))}
        </div>
      ) : null}

      {isFetching ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      <div aria-hidden className="h-1 w-full" ref={sentinelRef} />
      </div>

      <ReportsRemovalDialogs
        bulkDeleteOpen={selection.bulkDeleteOpen}
        isBulkDeleteLoading={selection.bulkDeleteMutation.isPending}
        isSingleDeleteLoading={selection.deleteMutation.isPending}
        onBulkDeleteConfirm={selection.handleBulkDelete}
        onBulkDeleteOpenChange={selection.setBulkDeleteOpen}
        onSingleDeleteConfirm={async () => {
          if (!selection.deleteReportId) {
            return
          }
          await selection.deleteMutation.mutateAsync(selection.deleteReportId)
          selection.setDeleteReportId(null)
        }}
        onSingleDeleteOpenChange={(open) => {
          if (!open) {
            selection.setDeleteReportId(null)
          }
        }}
        pendingDeleteId={selection.deleteReportId}
        selectedCount={selection.selectedCount}
      />
    </div>
  )
}

/** @deprecated Use SpottingReportsList */
export const BugReportsList = SpottingReportsList

"use client"

import {
  BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS,
  BUG_REPORT_SUBMISSION_STATUS_OPTIONS,
  type BugReportStatus,
  type BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import type { Priority } from "@spotting/shared/constants/priorities"
import { Card, CardContent } from "@spotting/ui/components/ui/card"
import { Checkbox } from "@spotting/ui/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@spotting/ui/components/ui/dropdown-menu"
import { Clock, FolderOpen, Shield, Tag } from "lucide-react"
import Link from "next/link"
import { type ReactNode, useState } from "react"

import { EditBugReportSheet } from "@/components/bug-reports/edit-bug-report-sheet"
import {
  labelForPriority,
  labelForReportStatus,
  labelForVisibility,
} from "../lib/report-labels"
import {
  chipClassForPriority,
  chipClassForStatus,
  chipClassForVisibility,
} from "../lib/report-chip-styles"
import { REPORT_PRIORITY_CHOICES } from "../lib/filter-options"
import type { ReportGridItem } from "../types"
import { ReportCardActionsMenu } from "./report-card-actions-menu"
import {
  ReportCardThumbnail,
  ReportMediaKindBadge,
} from "./report-card-thumbnail"

interface ReportGridCardProps {
  report: ReportGridItem
  organizationId: string | null
  isSelected: boolean
  isBusy: boolean
  allowDelete?: boolean
  onSelectChange: (checked: boolean) => void
  onDeleteRequest: () => void
  onRetryIngest: () => void
  onReportSaved: () => Promise<void>
  onPatchReport: (input: {
    visibility?: BugReportVisibility
    priority?: Priority
  }) => void
}

export function ReportGridCard({
  report,
  organizationId,
  isSelected,
  isBusy,
  allowDelete = true,
  onSelectChange,
  onDeleteRequest,
  onRetryIngest,
  onReportSaved,
  onPatchReport,
}: ReportGridCardProps) {
  const tagList = normalizeTags(report.tags)
  const [editOpen, setEditOpen] = useState(false)

  return (
    <Card className="group relative overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        aria-label={`Open ${report.title}`}
        className="absolute inset-0 z-10"
        href={`/s/${report.id}`}
      />
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <div className="absolute top-2 left-2 z-20">
            <Checkbox
              aria-label={`Select ${report.title}`}
              checked={isSelected}
              onCheckedChange={(checked) => onSelectChange(checked === true)}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
            />
          </div>

          <div className="absolute top-2 right-2 z-20">
            <ReportCardActionsMenu
              allowDelete={allowDelete}
              isBusy={isBusy}
              onDelete={onDeleteRequest}
              onEdit={() => setEditOpen(true)}
              onPriorityChange={(priority) => onPatchReport({ priority })}
              onRetryIngest={onRetryIngest}
              onVisibilityChange={(visibility) => onPatchReport({ visibility })}
              report={report}
            />
          </div>

          <ReportCardThumbnail report={report} />

          <div className="pointer-events-none absolute bottom-2 left-2 z-20">
            <ReportMediaKindBadge attachmentType={report.attachmentType} />
          </div>

          {report.attachmentType === "video" ? (
            <div className="pointer-events-none absolute right-2 bottom-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-white text-xs">
              <Clock className="h-3 w-3" />
              {report.duration}
            </div>
          ) : null}
        </div>

        <div className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3
                className="line-clamp-1 font-semibold text-sm leading-tight"
                title={report.title}
              >
                {report.title}
              </h3>
              <p className="text-muted-foreground text-xs">
                {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
            <ColoredMetaChip className={chipClassForVisibility(report.visibility)}>
              <Shield className="size-3" />
              {labelForVisibility(report.visibility)}
            </ColoredMetaChip>
          </div>

          <p className="line-clamp-2 min-h-8 text-muted-foreground text-xs">
            {report.description || report.url || "No additional context"}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <ColoredMetaChip className={chipClassForStatus(report.status)}>
              {labelForReportStatus(report.status)}
            </ColoredMetaChip>
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                render={
                  <button
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium text-[11px] ${chipClassForPriority(report.priority)}`}
                    disabled={isBusy}
                    type="button"
                  />
                }
              >
                {labelForPriority(report.priority)}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuRadioGroup
                  onValueChange={(value) => {
                    if (value !== report.priority) {
                      onPatchReport({ priority: value as Priority })
                    }
                  }}
                  value={report.priority}
                >
                  {REPORT_PRIORITY_CHOICES.map((choice) => (
                    <DropdownMenuRadioItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {report.group?.name ? (
              <ColoredMetaChip className="border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/50 dark:text-indigo-300">
                <FolderOpen className="size-3" />
                {report.group.name}
              </ColoredMetaChip>
            ) : null}
            {report.submissionStatus !==
            BUG_REPORT_SUBMISSION_STATUS_OPTIONS.ready ? (
              <ColoredMetaChip className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/50 dark:text-orange-300">
                {describeSubmissionState(report.submissionStatus)}
              </ColoredMetaChip>
            ) : null}
            {report.debuggerIngestionStatus ===
            BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS.failed ? (
              <ColoredMetaChip className="border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
                Debugger ingest failed
              </ColoredMetaChip>
            ) : null}
            {tagList.slice(0, 2).map((tag) => (
              <ColoredMetaChip
                className="border-border bg-muted/70 text-muted-foreground"
                key={tag}
              >
                <Tag className="size-3" />
                {tag}
              </ColoredMetaChip>
            ))}
            {tagList.length > 2 ? (
              <ColoredMetaChip className="border-border bg-muted/70 text-muted-foreground">
                +{tagList.length - 2}
              </ColoredMetaChip>
            ) : null}
          </div>

          {report.debuggerIngestionError ? (
            <p className="line-clamp-2 text-amber-700 text-xs">
              {report.debuggerIngestionError}
            </p>
          ) : null}
        </div>
      </CardContent>

      <EditBugReportSheet
        onOpenChange={setEditOpen}
        onUpdated={onReportSaved}
        open={editOpen}
        organizationId={organizationId}
        report={{
          id: report.id,
          title: report.title,
          tags: tagList,
          status: report.status as BugReportStatus,
          priority: report.priority as Priority,
          visibility: report.visibility as BugReportVisibility,
          groupId: report.groupId ?? report.group?.id ?? null,
        }}
      />
    </Card>
  )
}

function ColoredMetaChip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium text-[11px] ${className ?? ""}`}
    >
      {children}
    </span>
  )
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.filter((entry): entry is string => typeof entry === "string")
}

function describeSubmissionState(status: string | undefined) {
  switch (status) {
    case BUG_REPORT_SUBMISSION_STATUS_OPTIONS.processing:
      return "Processing"
    case BUG_REPORT_SUBMISSION_STATUS_OPTIONS.failed:
      return "Submission failed"
    default:
      return "Ready"
  }
}

/** @deprecated Use ReportGridCard */
export const BugReportCard = ReportGridCard

"use client"

import {
  BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS,
  BUG_REPORT_SUBMISSION_STATUS_OPTIONS,
  type BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import type { Priority } from "@spotting/shared/constants/priorities"
import { reportNonFatalError } from "@spotting/shared/lib/errors"
import { Button } from "@spotting/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@spotting/ui/components/ui/dropdown-menu"
import {
  Copy,
  Edit3,
  ExternalLink,
  MoreVertical,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { REPORT_PRIORITY_CHOICES, REPORT_VISIBILITY_CHOICES } from "../lib/filter-options"
import type { ReportGridItem } from "../types"

interface ReportCardActionsMenuProps {
  report: ReportGridItem
  isBusy: boolean
  allowDelete?: boolean
  onDelete: () => void
  onEdit: () => void
  onRetryIngest: () => void
  onVisibilityChange: (value: BugReportVisibility) => void
  onPriorityChange: (value: Priority) => void
}

export function ReportCardActionsMenu({
  report,
  isBusy,
  allowDelete = true,
  onDelete,
  onEdit,
  onRetryIngest,
  onVisibilityChange,
  onPriorityChange,
}: ReportCardActionsMenuProps) {
  const shareReady =
    report.submissionStatus === BUG_REPORT_SUBMISSION_STATUS_OPTIONS.ready
  const canRetryIngest =
    report.debuggerIngestionStatus ===
      BUG_REPORT_DEBUGGER_INGESTION_STATUS_OPTIONS.failed &&
    report.submissionStatus === BUG_REPORT_SUBMISSION_STATUS_OPTIONS.failed

  const copyShareLink = async () => {
    if (!shareReady) {
      toast.error("Share link is unavailable until the report is ready")
      return
    }

    const url = `${window.location.origin}/s/${report.id}`

    try {
      await navigator.clipboard.writeText(url)
      toast.success("Share link copied")
    } catch (error) {
      reportNonFatalError("Failed to copy report share link", error)
      toast.error("Failed to copy link")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        render={
          <Button
            aria-label="Report actions"
            className="h-8 w-8 bg-background/90 backdrop-blur-sm"
            disabled={isBusy}
            size="icon-sm"
            variant="outline"
          />
        }
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={copyShareLink}>
          <Copy className="size-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!shareReady}
          onClick={() => window.open(`/s/${report.id}`, "_blank", "noopener")}
        >
          <ExternalLink className="size-4" />
          Open in new tab
        </DropdownMenuItem>
        {canRetryIngest ? (
          <DropdownMenuItem onClick={onRetryIngest}>
            <RotateCcw className="size-4" />
            Retry debugger ingest
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            onValueChange={(value) => {
              if (value !== report.priority) {
                onPriorityChange(value as Priority)
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
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Privacy</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            onValueChange={(value) => {
              if (value !== report.visibility) {
                onVisibilityChange(value as BugReportVisibility)
              }
            }}
            value={report.visibility}
          >
            {REPORT_VISIBILITY_CHOICES.map((choice) => (
              <DropdownMenuRadioItem key={choice.value} value={choice.value}>
                {choice.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEdit}>
          <Edit3 className="size-4" />
          Edit report
        </DropdownMenuItem>
        {allowDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

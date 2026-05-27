"use client"

import type {
  BugReportStatus,
  BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import type { Priority } from "@spotting/shared/constants/priorities"
import { Button } from "@spotting/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@spotting/ui/components/ui/dialog"
import { Input } from "@spotting/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@spotting/ui/components/ui/select"
import { SlidersHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"

import {
  REPORT_PRIORITY_CHOICES,
  REPORT_STATUS_CHOICES,
  REPORT_VISIBILITY_CHOICES,
} from "../lib/filter-options"
import {
  labelForPriority,
  labelForReportStatus,
  labelForVisibility,
} from "../lib/report-labels"

import type { ReportGroupSummary } from "@/lib/api/report-groups"

interface ReportsBulkEditorProps {
  bulkStatus: BugReportStatus | ""
  bulkPriority: Priority | ""
  bulkVisibility: BugReportVisibility | ""
  bulkTagsInput: string
  bulkGroupId: string
  groups: ReportGroupSummary[]
  isBusy: boolean
  allowDelete?: boolean
  onBulkStatusChange: (value: BugReportStatus | "") => void
  onBulkPriorityChange: (value: Priority | "") => void
  onBulkVisibilityChange: (value: BugReportVisibility | "") => void
  onBulkTagsChange: (value: string) => void
  onBulkGroupChange: (value: string) => void
  onApply: () => Promise<void>
  onRequestDelete: () => void
}

export function ReportsBulkEditor({
  bulkStatus,
  bulkPriority,
  bulkVisibility,
  bulkTagsInput,
  bulkGroupId,
  groups,
  isBusy,
  allowDelete = true,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkVisibilityChange,
  onBulkTagsChange,
  onBulkGroupChange,
  onApply,
  onRequestDelete,
}: ReportsBulkEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const statusPlaceholder = bulkStatus
    ? labelForReportStatus(bulkStatus)
    : "Status"
  const priorityPlaceholder = bulkPriority
    ? labelForPriority(bulkPriority)
    : "Priority"
  const visibilityPlaceholder = bulkVisibility
    ? labelForVisibility(bulkVisibility)
    : "Visibility"

  const hasDraft =
    Boolean(bulkStatus) ||
    Boolean(bulkPriority) ||
    Boolean(bulkVisibility) ||
    bulkTagsInput.trim().length > 0 ||
    bulkGroupId.length > 0

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogTrigger
          render={
            <Button
              className="flex-1 sm:flex-none"
              size="sm"
              variant={hasDraft ? "default" : "outline"}
            />
          }
        >
          <SlidersHorizontal className="size-4" />
          Bulk edit
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk edit selected reports</DialogTitle>
            <DialogDescription>
              Choose one or more fields. Only selected fields will be updated.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              onValueChange={(value) =>
                onBulkStatusChange(value as BugReportStatus)
              }
              value={bulkStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{statusPlaceholder}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {REPORT_STATUS_CHOICES.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => onBulkPriorityChange(value as Priority)}
              value={bulkPriority}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{priorityPlaceholder}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {REPORT_PRIORITY_CHOICES.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                onBulkVisibilityChange(value as BugReportVisibility)
              }
              value={bulkVisibility}
            >
              <SelectTrigger className="w-full sm:col-span-2">
                <SelectValue>{visibilityPlaceholder}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {REPORT_VISIBILITY_CHOICES.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              className="sm:col-span-2"
              onChange={(event) => onBulkTagsChange(event.target.value)}
              placeholder="Tags (comma-separated)"
              value={bulkTagsInput}
            />

            <Select
              onValueChange={(value) =>
                onBulkGroupChange(!value ? "" : value)
              }
              value={bulkGroupId}
            >
              <SelectTrigger className="w-full sm:col-span-2">
                <SelectValue>
                  {bulkGroupId === "__none__"
                    ? "Remove from project"
                    : bulkGroupId
                      ? (groups.find((group) => group.id === bulkGroupId)?.name ??
                        "Project")
                      : "Project"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Remove from project</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} ({group.reportCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              disabled={isBusy}
              onClick={async () => {
                try {
                  await onApply()
                  setDialogOpen(false)
                } catch {
                  // Parent mutation handles toast errors.
                }
              }}
              size="sm"
            >
              Apply updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {allowDelete ? (
        <Button
          className="flex-1 sm:flex-none"
          disabled={isBusy}
          onClick={onRequestDelete}
          size="sm"
          variant="destructive"
        >
          <Trash2 className="size-4" />
          Delete selected
        </Button>
      ) : null}
    </div>
  )
}

/** @deprecated Use ReportsBulkEditor */
export const BugReportsBulkActions = ReportsBulkEditor

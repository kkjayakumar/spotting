"use client"

import { ConfirmationDialog } from "@spotting/ui/components/dialogs/confirmation-dialog"

interface ReportsRemovalDialogsProps {
  pendingDeleteId: string | null
  selectedCount: number
  bulkDeleteOpen: boolean
  isSingleDeleteLoading: boolean
  isBulkDeleteLoading: boolean
  onSingleDeleteConfirm: () => Promise<void>
  onSingleDeleteOpenChange: (open: boolean) => void
  onBulkDeleteConfirm: () => Promise<void>
  onBulkDeleteOpenChange: (open: boolean) => void
}

export function ReportsRemovalDialogs({
  pendingDeleteId,
  selectedCount,
  bulkDeleteOpen,
  isSingleDeleteLoading,
  isBulkDeleteLoading,
  onSingleDeleteConfirm,
  onSingleDeleteOpenChange,
  onBulkDeleteConfirm,
  onBulkDeleteOpenChange,
}: ReportsRemovalDialogsProps) {
  const bulkLabel =
    selectedCount === 1 ? "1 selected report" : `${selectedCount} selected reports`

  return (
    <>
      <ConfirmationDialog
        confirmText="Delete report"
        description="This action will permanently remove the report and its attachment from storage."
        isLoading={isSingleDeleteLoading}
        onConfirm={onSingleDeleteConfirm}
        onOpenChange={onSingleDeleteOpenChange}
        open={pendingDeleteId !== null}
        title="Delete this report?"
        variant="destructive"
      />

      <ConfirmationDialog
        confirmText="Delete selected"
        description={`This action will permanently remove ${bulkLabel} and their attachments from storage.`}
        isLoading={isBulkDeleteLoading}
        onConfirm={onBulkDeleteConfirm}
        onOpenChange={onBulkDeleteOpenChange}
        open={bulkDeleteOpen}
        title={`Delete ${bulkLabel}?`}
        variant="destructive"
      />
    </>
  )
}

/** @deprecated Use ReportsRemovalDialogs */
export const BugReportsDeleteDialogs = ReportsRemovalDialogs

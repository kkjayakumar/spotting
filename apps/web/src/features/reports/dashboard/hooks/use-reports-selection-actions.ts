"use client"

import type {
  BugReportStatus,
  BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import type { Priority } from "@spotting/shared/constants/priorities"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  deleteBugReport,
  deleteBugReportsBulk,
  retryBugReportDebuggerIngestion,
  updateBugReport,
  updateBugReportsBulk,
} from "@/lib/bug-report-api"
import { reportGroupQueries } from "@/lib/api/report-groups"
import { useQuery } from "@tanstack/react-query"
import { splitBulkTags } from "../lib/list-helpers"

interface UseReportsSelectionActionsInput {
  reportIds: string[]
  refreshAll: () => Promise<void>
  organizationId: string | null
}

export function useReportsSelectionActions({
  reportIds,
  refreshAll,
  organizationId,
}: UseReportsSelectionActionsInput) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const [bulkStatus, setBulkStatus] = useState<BugReportStatus | "">("")
  const [bulkPriority, setBulkPriority] = useState<Priority | "">("")
  const [bulkVisibility, setBulkVisibility] = useState<
    BugReportVisibility | ""
  >("")
  const [bulkTagsRaw, setBulkTagsRaw] = useState("")
  const [bulkGroupId, setBulkGroupId] = useState<string>("")

  const groupsQuery = useQuery(reportGroupQueries.list(organizationId))

  useEffect(() => {
    setSelectedIds((previous) => {
      const allowed = new Set(reportIds)
      const next = new Set(
        Array.from(previous).filter((id) => allowed.has(id))
      )
      return next.size === previous.size ? previous : next
    })
  }, [reportIds])

  const selectedIdList = useMemo(() => Array.from(selectedIds), [selectedIds])
  const selectedCount = selectedIds.size

  const resetBulkFields = () => {
    setBulkStatus("")
    setBulkPriority("")
    setBulkVisibility("")
    setBulkTagsRaw("")
    setBulkGroupId("")
  }

  const deleteOne = useMutation({
    mutationFn: async (id: string) => deleteBugReport({ id }),
    onSuccess: async (_, id) => {
      setSelectedIds((previous) => {
        const next = new Set(previous)
        next.delete(id)
        return next
      })
      await refreshAll()
      toast.success("Report deleted")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete report")
    },
  })

  const deleteMany = useMutation({
    mutationFn: async (ids: string[]) => deleteBugReportsBulk({ ids }),
    onSuccess: async (result) => {
      setSelectedIds(new Set())
      await refreshAll()
      toast.success(`Deleted ${result.deletedCount} report(s)`)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete selected reports")
    },
  })

  const updateOne = useMutation({
    mutationFn: updateBugReport,
    onSuccess: async () => {
      await refreshAll()
      toast.success("Report updated")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update report")
    },
  })

  const updateMany = useMutation({
    mutationFn: updateBugReportsBulk,
    onSuccess: async (result) => {
      await refreshAll()
      toast.success(`Updated ${result.updatedCount} report(s)`)
      resetBulkFields()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update selected reports")
    },
  })

  const retryIngest = useMutation({
    mutationFn: async (id: string) => retryBugReportDebuggerIngestion({ id }),
    onSuccess: async () => {
      await refreshAll()
      toast.success("Debugger ingestion retried")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to retry debugger ingestion")
    },
  })

  const isBusy =
    deleteOne.isPending ||
    deleteMany.isPending ||
    updateOne.isPending ||
    updateMany.isPending ||
    retryIngest.isPending

  const setSelected = (id: string, checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const confirmBulkDelete = async () => {
    if (selectedIdList.length < 1) {
      return
    }
    await deleteMany.mutateAsync(selectedIdList)
  }

  const applyBulkEdits = async () => {
    if (selectedIdList.length < 1) {
      return
    }

    const tags = splitBulkTags(bulkTagsRaw)
    const hasGroupUpdate = bulkGroupId.length > 0
    const hasPayload =
      Boolean(bulkStatus) ||
      Boolean(bulkPriority) ||
      Boolean(bulkVisibility) ||
      tags.length > 0 ||
      hasGroupUpdate

    if (!hasPayload) {
      toast.error("Select at least one update field")
      return
    }

    await updateMany.mutateAsync({
      ids: selectedIdList,
      status: bulkStatus || undefined,
      priority: bulkPriority || undefined,
      visibility: bulkVisibility || undefined,
      tags: tags.length > 0 ? tags : undefined,
      groupId:
        bulkGroupId === "__none__"
          ? null
          : hasGroupUpdate
            ? bulkGroupId
            : undefined,
    })
  }

  return {
    selectedIds,
    selectedCount,
    clearSelection: () => setSelectedIds(new Set()),
    toggleSelection: setSelected,
    selectedIdList,
    reportGroups: groupsQuery.data ?? [],

    deleteReportId: pendingDeleteId,
    setDeleteReportId: setPendingDeleteId,
    bulkDeleteOpen: bulkDeleteDialogOpen,
    setBulkDeleteOpen: setBulkDeleteDialogOpen,

    bulkStatus,
    setBulkStatus,
    bulkPriority,
    setBulkPriority,
    bulkVisibility,
    setBulkVisibility,
    bulkTagsInput: bulkTagsRaw,
    setBulkTagsInput: setBulkTagsRaw,
    bulkGroupId,
    setBulkGroupId,

    isMutating: isBusy,
    updateMutation: updateOne,
    retryIngestionMutation: retryIngest,
    deleteMutation: deleteOne,
    bulkDeleteMutation: deleteMany,
    handleBulkDelete: confirmBulkDelete,
    handleBulkUpdate: applyBulkEdits,
  }
}

/** @deprecated Use useReportsSelectionActions */
export const useBugReportsActions = useReportsSelectionActions

"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@spotting/ui/components/ui/select"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FolderOpen } from "lucide-react"
import { toast } from "sonner"

import { reportGroupQueries } from "@/lib/api/report-groups"
import { updateBugReport } from "@/lib/bug-report-api"

interface ReportProjectFieldProps {
  reportId: string
  organizationId: string | null
  groupId?: string | null
  canEdit?: boolean
  onUpdated?: () => void | Promise<void>
}

export function ReportProjectField({
  reportId,
  organizationId,
  groupId,
  canEdit,
  onUpdated,
}: ReportProjectFieldProps) {
  const queryClient = useQueryClient()
  const groupsQuery = useQuery(reportGroupQueries.list(organizationId))

  const mutation = useMutation({
    mutationFn: updateBugReport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["bugReport.getById", reportId],
      })
      await onUpdated?.()
      toast.success("Project updated")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update project")
    },
  })

  const groups = groupsQuery.data ?? []
  const currentName =
    groups.find((group) => group.id === groupId)?.name ?? "No project"

  if (!canEdit) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-muted-foreground text-xs">Project</span>
        <span className="inline-flex items-center gap-1.5 text-foreground text-sm">
          <FolderOpen className="size-3.5 text-muted-foreground" />
          {groupId ? currentName : "No project"}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-medium text-muted-foreground text-xs">Project</span>
      <Select
        disabled={!organizationId || mutation.isPending}
        onValueChange={(value) => {
          mutation.mutate({
            id: reportId,
            groupId: value === "__none__" ? null : value,
          })
        }}
        value={groupId && groupId.length > 0 ? groupId : "__none__"}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={currentName} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No project</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">
        Move this report to another project anytime.
      </p>
    </div>
  )
}

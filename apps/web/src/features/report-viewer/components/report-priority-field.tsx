"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@spotting/ui/components/ui/select"
import type { Priority } from "@spotting/shared/constants/priorities"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Flag } from "lucide-react"
import { toast } from "sonner"

import { REPORT_PRIORITY_CHOICES } from "@/features/reports/dashboard/lib/filter-options"
import { labelForPriority } from "@/features/reports/dashboard/lib/report-labels"
import { chipClassForPriority } from "@/features/reports/dashboard/lib/report-chip-styles"
import { updateBugReport } from "@/lib/bug-report-api"
import { cn } from "@spotting/ui/lib/utils"

interface ReportPriorityFieldProps {
  reportId: string
  priority: string
  canEdit?: boolean
  onUpdated?: () => void | Promise<void>
}

export function ReportPriorityField({
  reportId,
  priority,
  canEdit,
  onUpdated,
}: ReportPriorityFieldProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: updateBugReport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["bugReport.getById", reportId],
      })
      await onUpdated?.()
      toast.success("Priority updated")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update priority")
    },
  })

  const currentLabel = labelForPriority(priority)

  if (!canEdit) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-muted-foreground text-xs">Priority</span>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 font-medium text-sm capitalize",
            chipClassForPriority(priority),
          )}
        >
          <Flag className="size-3.5" />
          {currentLabel}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-medium text-muted-foreground text-xs">Priority</span>
      <Select
        disabled={mutation.isPending}
        onValueChange={(value) => {
          if (value !== priority) {
            mutation.mutate({
              id: reportId,
              priority: value as Priority,
            })
          }
        }}
        value={priority}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={currentLabel} />
        </SelectTrigger>
        <SelectContent>
          {REPORT_PRIORITY_CHOICES.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

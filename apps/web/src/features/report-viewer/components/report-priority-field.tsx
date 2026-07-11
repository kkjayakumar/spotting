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
      <div className="flex items-start gap-3 rounded-lg border bg-card/45 p-3 shadow-sm hover:bg-card/90 transition-colors">
        <Flag className={cn("size-4 mt-0.5 shrink-0", 
          priority === "high" ? "text-red-500 dark:text-red-400" :
          priority === "medium" ? "text-amber-500 dark:text-amber-400" :
          "text-blue-500 dark:text-blue-400"
        )} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Priority</span>
          <span className={cn("text-sm font-semibold capitalize", 
            priority === "high" ? "text-red-600 dark:text-red-400" :
            priority === "medium" ? "text-amber-600 dark:text-amber-400" :
            "text-blue-600 dark:text-blue-400"
          )}>
            {currentLabel}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-1">
      <span className="flex items-center gap-1.5 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
        <Flag className={cn("size-3.5",
          priority === "high" ? "text-red-500 dark:text-red-400" :
          priority === "medium" ? "text-amber-500 dark:text-amber-400" :
          "text-blue-500 dark:text-blue-400"
        )} />
        Priority
      </span>
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

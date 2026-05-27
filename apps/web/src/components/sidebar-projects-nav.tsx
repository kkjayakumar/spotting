"use client"

import { Button } from "@spotting/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@spotting/ui/components/ui/dialog"
import { Input } from "@spotting/ui/components/ui/input"
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@spotting/ui/components/ui/sidebar"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FolderOpen, Plus, Trash2 } from "lucide-react"
import type { Route } from "next"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { useReportsUrlFilters } from "@/features/reports/dashboard/hooks/use-reports-url-filters"
import {
  createReportGroup,
  deleteReportGroup,
  reportGroupQueries,
  type ReportGroupSummary,
} from "@/lib/api/report-groups"
import { canManageProjects } from "@/lib/org-permissions"
import {
  readLocalReportGroupPreference,
  setPreferredReportGroup,
} from "@/lib/report-group-preference"

interface SidebarProjectsNavProps {
  organizationId: string | null | undefined
  memberRole: string | null | undefined
}

export function SidebarProjectsNav({
  organizationId,
  memberRole,
}: SidebarProjectsNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { selectedGroupId, setSelectedGroupId } = useReportsUrlFilters()
  const canManage = canManageProjects(memberRole)

  const [createOpen, setCreateOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ReportGroupSummary | null>(
    null,
  )

  const groupsQuery = useQuery(reportGroupQueries.list(organizationId ?? null))
  const projects = groupsQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: createReportGroup,
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({
        queryKey: ["spotting.report-groups", organizationId],
      })
      setCreateOpen(false)
      setNewProjectName("")
      selectProject(group.id)
      toast.success(`Created project "${group.name}"`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create project")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReportGroup,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["spotting.report-groups", organizationId],
      })
      if (selectedGroupId === variables.groupId) {
        selectProject(null)
      }
      setDeleteTarget(null)
      toast.success("Project deleted")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete project")
    },
  })

  function selectProject(groupId: string | null) {
    setSelectedGroupId(groupId)

    if (!organizationId) {
      return
    }

    const normalizedGroupId =
      groupId === "none" ? null : groupId;
    void setPreferredReportGroup({
      organizationId,
      groupId: normalizedGroupId,
    }).catch(() => undefined)

    if (!pathname.startsWith("/dashboard")) {
      const query =
        groupId === null
          ? ""
          : groupId === "none"
            ? "?groupId=none"
            : `?groupId=${encodeURIComponent(groupId)}`
      router.push(`/dashboard${query}` as Route)
    }
  }

  const capturePref =
    organizationId ? readLocalReportGroupPreference() : null
  const captureProjectName =
    capturePref &&
    capturePref.organizationId === organizationId &&
    capturePref.groupId
      ? projects.find((project) => project.id === capturePref.groupId)?.name
      : null

  return (
    <>
      <SidebarGroupLabel className="mt-2">Projects</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                isActive={selectedGroupId === null}
                onClick={() => selectProject(null)}
                render={(props) => <button type="button" {...props} />}
                size="sm"
              >
                <FolderOpen />
                <span>All reports</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                isActive={selectedGroupId === "none"}
                onClick={() => selectProject("none")}
                render={(props) => <button type="button" {...props} />}
                size="sm"
              >
                <FolderOpen />
                <span>No project</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            {projects.map((project) => (
              <SidebarMenuSubItem key={project.id}>
                <div className="flex items-center gap-0.5">
                  <SidebarMenuSubButton
                    className="min-w-0 flex-1"
                    isActive={selectedGroupId === project.id}
                    onClick={() => selectProject(project.id)}
                    render={(props) => <button type="button" {...props} />}
                    size="sm"
                  >
                    <FolderOpen />
                    <span className="truncate">{project.name}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground text-xs">
                      {project.reportCount}
                    </span>
                  </SidebarMenuSubButton>
                  {canManage ? (
                    <Button
                      aria-label={`Delete ${project.name}`}
                      className="size-7 shrink-0 group-data-[collapsible=icon]:hidden"
                      disabled={deleteMutation.isPending}
                      onClick={() => setDeleteTarget(project)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </SidebarMenuItem>

        {canManage ? (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setCreateOpen(true)}
              render={(props) => <button type="button" {...props} />}
              size="sm"
              tooltip="New project"
            >
              <Plus />
              <span>New project</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : null}

        {captureProjectName ? (
          <SidebarMenuItem>
            <p className="px-2 py-1 text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
              New captures save to{" "}
              <span className="font-medium text-foreground">
                {captureProjectName}
              </span>
            </p>
          </SidebarMenuItem>
        ) : null}
      </SidebarMenu>

      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Organize captured videos and screenshots into projects.
            </DialogDescription>
          </DialogHeader>
          <Input
            onChange={(event) => setNewProjectName(event.target.value)}
            placeholder="Project name"
            value={newProjectName}
          />
          <DialogFooter>
            <Button
              disabled={
                !organizationId ||
                createMutation.isPending ||
                newProjectName.trim().length === 0
              }
              onClick={() => {
                if (!organizationId) {
                  return
                }
                createMutation.mutate({
                  organizationId,
                  name: newProjectName.trim(),
                })
              }}
            >
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        open={Boolean(deleteTarget)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              Reports in "{deleteTarget?.name}" will have no project. This does
              not delete the reports themselves.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteTarget(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                !organizationId || !deleteTarget || deleteMutation.isPending
              }
              onClick={() => {
                if (!(organizationId && deleteTarget)) {
                  return
                }
                deleteMutation.mutate({
                  organizationId,
                  groupId: deleteTarget.id,
                })
              }}
              variant="destructive"
            >
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

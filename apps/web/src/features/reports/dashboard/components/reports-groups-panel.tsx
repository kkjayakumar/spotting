"use client";

import { Button } from "@spotting/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@spotting/ui/components/ui/dialog";
import { Input } from "@spotting/ui/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createReportGroup,
  deleteReportGroup,
  reportGroupQueries,
  type ReportGroupSummary,
} from "@/lib/api/report-groups";
import {
  readLocalReportGroupPreference,
  setPreferredReportGroup,
} from "@/lib/report-group-preference";

interface ReportsGroupsPanelProps {
  organizationId: string | null;
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
}

export function ReportsGroupsPanel({
  organizationId,
  selectedGroupId,
  onSelectGroup,
}: ReportsGroupsPanelProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [captureGroupId, setCaptureGroupId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReportGroupSummary | null>(
    null,
  );

  const groupsQuery = useQuery(reportGroupQueries.list(organizationId));

  useEffect(() => {
    if (!organizationId) {
      setCaptureGroupId(null);
      return;
    }
    const pref = readLocalReportGroupPreference();
    setCaptureGroupId(
      pref?.organizationId === organizationId ? pref.groupId : null,
    );
  }, [organizationId, groupsQuery.dataUpdatedAt]);

  const createMutation = useMutation({
    mutationFn: createReportGroup,
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({
        queryKey: ["spotting.report-groups", organizationId],
      });
      setCreateOpen(false);
      setNewGroupName("");
      handleSelectGroup(group.id);
      toast.success(`Created project "${group.name}" — new captures will save here`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReportGroup,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["spotting.report-groups", organizationId],
      });
      if (selectedGroupId === variables.groupId) {
        onSelectGroup(null);
      }
      if (captureGroupId === variables.groupId) {
        setCaptureGroupId(null);
      }
      setDeleteTarget(null);
      toast.success("Project deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete group");
    },
  });

  const groups = groupsQuery.data ?? [];
  const ungroupedSelected = selectedGroupId === "none";

  const handleSelectGroup = (groupId: string | null) => {
    onSelectGroup(groupId);
    if (!organizationId) {
      return;
    }
    const normalizedGroupId =
      groupId === "none" ? null : groupId;
    setCaptureGroupId(normalizedGroupId);
    void setPreferredReportGroup({
      organizationId,
      groupId: normalizedGroupId,
    }).catch(() => undefined);
  };

  const captureGroupName = captureGroupId
    ? groups.find((group) => group.id === captureGroupId)?.name
    : null;

  return (
    <aside className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm">Projects</h2>
        <Button
          disabled={!organizationId}
          onClick={() => setCreateOpen(true)}
          size="sm"
          variant="outline"
        >
          <Plus className="size-4" />
          New
        </Button>
      </div>

      <div className="space-y-1">
        <GroupButton
          active={selectedGroupId === null}
          label="All reports"
          onClick={() => onSelectGroup(null)}
        />
        <GroupButton
          active={ungroupedSelected}
          label="No project"
          onClick={() => onSelectGroup("none")}
        />
        {groups.map((group) => (
          <div className="flex items-center gap-1" key={group.id}>
            <GroupButton
              active={selectedGroupId === group.id}
              count={group.reportCount}
              label={group.name}
              onClick={() => handleSelectGroup(group.id)}
            />
            <Button
              aria-label={`Delete ${group.name}`}
              className="shrink-0"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteTarget(group)}
              size="icon-sm"
              variant="ghost"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {captureGroupName ? (
        <p className="rounded-md bg-muted/60 px-2 py-1.5 text-muted-foreground text-xs">
          New captures save to <span className="font-medium">{captureGroupName}</span>
        </p>
      ) : null}

      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Organize captured videos and screenshots into projects.
            </DialogDescription>
          </DialogHeader>
          <Input
            onChange={(event) => setNewGroupName(event.target.value)}
            placeholder="Project name"
            value={newGroupName}
          />
          <DialogFooter>
            <Button
              disabled={
                !organizationId ||
                createMutation.isPending ||
                newGroupName.trim().length === 0
              }
              onClick={() => {
                if (!organizationId) {
                  return;
                }
                createMutation.mutate({
                  organizationId,
                  name: newGroupName.trim(),
                });
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
            setDeleteTarget(null);
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
              disabled={!organizationId || !deleteTarget || deleteMutation.isPending}
              onClick={() => {
                if (!(organizationId && deleteTarget)) {
                  return;
                }
                deleteMutation.mutate({
                  organizationId,
                  groupId: deleteTarget.id,
                });
              }}
              variant="destructive"
            >
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function GroupButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-muted"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        <FolderOpen className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      {typeof count === "number" ? (
        <span className="ml-2 shrink-0 text-muted-foreground text-xs">
          {count}
        </span>
      ) : null}
    </button>
  );
}

"use client"

/**
 * Spotting public report viewer shell.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  type BugReportStatus,
  type BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import type { Priority } from "@spotting/shared/constants/priorities"
import { Button } from "@spotting/ui/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@spotting/ui/components/ui/resizable"
import { EditIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { EditBugReportSheet } from "@/components/bug-reports/edit-bug-report-sheet"

import { VIEWER_LAYOUT } from "../constants"
import { useSpottingReportViewer } from "../hooks/use-spotting-report-viewer"
import { IngestionStatusBanner } from "./ingestion-status-banner"
import { InspectorSidebar } from "./inspector-sidebar"
import { RecordingStage } from "./recording-stage"
import { ReportViewerHeader } from "./report-viewer-header"
import { ViewerLoadingState } from "./viewer-loading-state"
import { ViewerNotFoundState } from "./viewer-not-found-state"

interface SpottingReportViewerProps {
  reportId: string
}

export function SpottingReportViewer({ reportId }: SpottingReportViewerProps) {
  const viewer = useSpottingReportViewer(reportId)

  if (viewer.isLoading) {
    return <ViewerLoadingState />
  }

  if (viewer.error || !viewer.report) {
    return <ViewerNotFoundState />
  }

  const report = viewer.report
  const editButton = report.canEdit ? (
    <Button onClick={() => viewer.setEditSheetOpen(true)} size="sm" variant="ghost">
      <EditIcon />
      <span className="sr-only">Edit report</span>
    </Button>
  ) : null

  const mobileVideoToggle = (
    <button
      aria-label={viewer.mobileRecordingHidden ? "Show recording" : "Hide recording"}
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      onClick={viewer.toggleMobileRecording}
      type="button"
    >
      {viewer.mobileRecordingHidden ? (
        <EyeIcon className="size-3.5" />
      ) : (
        <EyeOffIcon className="size-3.5" />
      )}
    </button>
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <ReportViewerHeader editAction={editButton} report={report} />

      {report.canEdit ? (
        <EditBugReportSheet
          onOpenChange={viewer.setEditSheetOpen}
          onUpdated={async () => {
            await viewer.refetchReport()
          }}
          open={viewer.editSheetOpen}
          report={{
            id: report.id,
            title: report.title,
            tags: report.tags,
            status: report.status as BugReportStatus,
            priority: report.priority as Priority,
            visibility: report.visibility as BugReportVisibility,
            groupId: report.groupId ?? report.group?.id ?? null,
          }}
          organizationId={report.organization?.id ?? null}
        />
      ) : null}

      {report.canEdit && !viewer.submissionReady ? (
        <IngestionStatusBanner
          debuggerIngestionError={report.debuggerIngestionError}
          debuggerIngestionStatus={report.debuggerIngestionStatus}
          isRetrying={viewer.retryIngestionPending}
          onRetry={viewer.onRetryIngestion}
          submissionStatus={report.submissionStatus}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden h-full w-full md:block">
          <ResizablePanelGroup className="h-full w-full" orientation="horizontal">
            <ResizablePanel minSize={VIEWER_LAYOUT.canvasMinWidth}>
              <RecordingStage
                onPlaybackMsChange={viewer.onPlaybackMsChange}
                ref={viewer.desktopVideoRef}
                report={report}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={VIEWER_LAYOUT.sidebarDefaultWidth}
              maxSize={VIEWER_LAYOUT.sidebarMaxWidth}
              minSize={VIEWER_LAYOUT.sidebarMinWidth}
            >
              <InspectorSidebar
                actionsChannel={viewer.timelineChannels.actions}
                activeTab={viewer.activeTab}
                consoleChannel={viewer.timelineChannels.console}
                networkChannel={viewer.networkChannel}
                onEntrySelect={viewer.onTimelineEntrySelect}
                onReportUpdated={async () => {
                  await viewer.refetchReport()
                }}
                onTabChange={viewer.onInspectorTabChange}
                report={report}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <div className="flex h-full w-full flex-col md:hidden">
          {viewer.mobileRecordingHidden ? null : (
            <div className="shrink-0 border-b">
              <RecordingStage
                compact
                onPlaybackMsChange={viewer.onPlaybackMsChange}
                ref={viewer.mobileVideoRef}
                report={report}
              />
            </div>
          )}
          <div className="min-h-0 flex-1">
            <InspectorSidebar
              actionsChannel={viewer.timelineChannels.actions}
              activeTab={viewer.activeTab}
              consoleChannel={viewer.timelineChannels.console}
              networkChannel={viewer.networkChannel}
              onEntrySelect={viewer.onTimelineEntrySelect}
              onReportUpdated={async () => {
                await viewer.refetchReport()
              }}
              onTabChange={viewer.onInspectorTabChange}
              report={report}
              tabAccessory={mobileVideoToggle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** @deprecated Use SpottingReportViewer */
export const BugReportView = SpottingReportViewer

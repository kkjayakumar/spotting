/**
 * Spotting report inspector sidebar.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

"use client"

import { cn } from "@spotting/ui/lib/utils"
import { GlobeIcon, InfoIcon, MousePointerClickIcon, ServerIcon, TerminalIcon } from "lucide-react"
import type { ReactNode } from "react"

import type { InspectorTab } from "../constants"
import { NetworkInspectorPanel } from "./network-inspector"
import { BackendTracePanel } from "./backend-trace-panel"
import { ReportDetailsPanel } from "./report-details-panel"
import { ReproductionStepList } from "./reproduction-step-list"
import { SessionTimelineList } from "./session-timeline-list"
import type {
  ActionsChannelState,
  DebuggerTimelineEntry,
  NetworkChannelState,
  SpottingReportViewModel,
  TimelineChannelState,
} from "../types"

export interface InspectorSidebarProps {
  activeTab: InspectorTab
  actionsChannel: ActionsChannelState
  consoleChannel: TimelineChannelState
  networkChannel: NetworkChannelState
  onEntrySelect: (entry: DebuggerTimelineEntry) => void
  onTabChange: (tab: InspectorTab) => void
  report: SpottingReportViewModel
  tabAccessory?: ReactNode
  onReportUpdated?: () => void | Promise<void>
}

const TAB_CONFIG: Array<{
  id: InspectorTab
  label: string
  icon: ReactNode
}> = [
  { id: "details", label: "Info", icon: <InfoIcon className="size-3.5" /> },
  { id: "console", label: "Console", icon: <TerminalIcon className="size-3.5" /> },
  { id: "network", label: "Network", icon: <GlobeIcon className="size-3.5" /> },
  { id: "actions", label: "Actions", icon: <MousePointerClickIcon className="size-3.5" /> },
  { id: "backend", label: "Backend", icon: <ServerIcon className="size-3.5" /> },
]

export function InspectorSidebar({
  activeTab,
  actionsChannel,
  consoleChannel,
  networkChannel,
  onEntrySelect,
  onTabChange,
  report,
  tabAccessory,
  onReportUpdated,
}: InspectorSidebarProps) {
  return (
    <aside className="z-20 flex h-full w-full flex-col bg-background shadow-xl md:relative md:top-0 md:border-l md:shadow-none">
      <nav
        aria-label="Report inspector"
        className="flex items-center gap-1 border-b px-1 py-1"
      >
        {TAB_CONFIG.map((tab) => (
          <button
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[4px] py-1.5 font-medium text-xs transition-all",
              activeTab === tab.id
                ? "bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        {tabAccessory ? <div className="shrink-0">{tabAccessory}</div> : null}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === "details" ? (
          <ReportDetailsPanel onReportUpdated={onReportUpdated} report={report} />
        ) : null}
        {activeTab === "actions" ? (
          <ReproductionStepList
            actions={actionsChannel.actions}
            entries={actionsChannel.entries}
            highlightedEntryIds={actionsChannel.highlightedEntryIds}
            onSelect={onEntrySelect}
            selectedEntryId={actionsChannel.selectedEntryId}
          />
        ) : null}
        {activeTab === "console" ? (
          <SessionTimelineList
            emptyMessage="No console logs captured."
            entries={consoleChannel.entries}
            highlightedEntryIds={consoleChannel.highlightedEntryIds}
            icon={<TerminalIcon className="size-3" />}
            onSelect={onEntrySelect}
            selectedEntryId={consoleChannel.selectedEntryId}
          />
        ) : null}
        {activeTab === "network" ? (
          <NetworkInspectorPanel
            bugReportId={report.id}
            entries={networkChannel.entries}
            hasNextPage={networkChannel.hasNextPage}
            highlightedEntryIds={networkChannel.highlightedEntryIds}
            isFetchingNextPage={networkChannel.isFetchingNextPage}
            isLoading={networkChannel.isLoading}
            onEntrySelect={onEntrySelect}
            onLoadMore={networkChannel.onLoadMore}
            requests={networkChannel.requests}
            selectedEntryId={networkChannel.selectedEntryId}
          />
        ) : null}
        {activeTab === "backend" ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <ServerIcon className="size-6 text-muted-foreground" />
            <p className="font-medium text-foreground text-sm">No backend traces linked</p>
            <p className="max-w-xs text-muted-foreground text-xs">
              Connect your server's error tracker (e.g. an OpenTelemetry / Sentry exporter) to
              correlate backend traces with this session. None are linked to this report yet.
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

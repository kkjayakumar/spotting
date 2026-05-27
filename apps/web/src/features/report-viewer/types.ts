/**
 * Spotting report viewer types.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { SpottingApiClient } from "@/lib/api"

import type { InspectorTab } from "./constants"

export type { SpottingApiClient, InspectorTab }

export interface DeviceInfo {
  browser?: string
  os?: string
  viewport?: string
}

export interface SpottingReportViewModel {
  id: string
  title?: string | null
  description?: string | null
  status: string
  priority: string
  createdAt: string | Date
  url?: string
  metadata?: unknown
  deviceInfo?: DeviceInfo | null
  organization?: { id: string; name: string; slug?: string }
  reporter?: { id?: string; name?: string; email?: string }
  attachmentUrl?: string | null
  attachmentType?: string
  submissionStatus: string
  canEdit?: boolean
  tags: string[]
  visibility: string
  debuggerIngestionError: string | null
  debuggerIngestionStatus: string
  groupId?: string | null
  group?: { id: string; name: string } | null
}

/** @deprecated Use SpottingReportViewModel */
export type SharedBugReport = SpottingReportViewModel

export type SpottingDebuggerEvents = Awaited<
  ReturnType<SpottingApiClient["bugReport"]["getDebuggerEvents"]>
>

export type DebuggerAction = SpottingDebuggerEvents["actions"][number]
export type DebuggerLog = SpottingDebuggerEvents["logs"][number]

export type SpottingNetworkRequestsPage = Awaited<
  ReturnType<SpottingApiClient["bugReport"]["getNetworkRequests"]>
>

export type DebuggerNetworkRequest =
  SpottingNetworkRequestsPage["items"][number]

export type DebuggerTimelineKind = "action" | "log" | "network"

export interface DebuggerTimelineEntry {
  id: string
  kind: DebuggerTimelineKind
  label: string
  detail: string
  timestamp: string
  offset: number | null
}

export interface TimelineChannelState {
  entries: DebuggerTimelineEntry[]
  selectedEntryId: string | null
  highlightedEntryIds: string[]
}

export interface ActionsChannelState extends TimelineChannelState {
  actions: DebuggerAction[]
}

export interface NetworkChannelState extends TimelineChannelState {
  requests: DebuggerNetworkRequest[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  onLoadMore: () => void
}

export type TimelineSelectionByKind = Record<
  DebuggerTimelineKind,
  string | null
>

export const EMPTY_TIMELINE_SELECTION: TimelineSelectionByKind = {
  action: null,
  log: null,
  network: null,
}

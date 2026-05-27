"use client"

/**
 * Spotting report viewer data + interaction hook.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BUG_REPORT_SUBMISSION_STATUS_OPTIONS } from "@spotting/shared/constants/bug-report"
import { reportNonFatalError } from "@spotting/shared/lib/errors"
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { useCallback, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { reportQueries } from "@/lib/api"
import { retryBugReportDebuggerIngestion } from "@/lib/bug-report-api"

import {
  INSPECTOR_TABS,
  NETWORK_REQUESTS_PAGE_SIZE,
  type InspectorTab,
} from "../constants"
import { entryIdsHighlightedAtPlaybackMs } from "../lib/playback-highlight"
import {
  resolveVisibleVideoPlayer,
  seekPlayersToTimelineEntry,
} from "../lib/playback-sync"
import { readRecordingDurationMs } from "../lib/report-metadata"
import {
  coerceMissingOffsetsForVideo,
  mapActionToTimelineEntry,
  mapLogToTimelineEntry,
  mapNetworkToTimelineEntry,
} from "../lib/timeline-mappers"
import type {
  ActionsChannelState,
  DebuggerTimelineEntry,
  NetworkChannelState,
  SpottingReportViewModel,
  TimelineChannelState,
  TimelineSelectionByKind,
} from "../types"
import { EMPTY_TIMELINE_SELECTION } from "../types"

export function useSpottingReportViewer(reportId: string) {
  const reportQuery = useQuery(
    reportQueries.bugReport.getById.queryOptions({
      input: { id: reportId },
      enabled: Boolean(reportId),
    })
  )

  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(INSPECTOR_TABS).withDefault("details")
  )
  const [networkSearch] = useQueryState("networkSearch", parseAsString)

  const debuggerTabActive =
    activeTab === "actions" || activeTab === "console"
  const networkTabActive = activeTab === "network"

  const [debuggerDataEnabled, setDebuggerDataEnabled] = useState(debuggerTabActive)
  const [networkDataEnabled, setNetworkDataEnabled] = useState(networkTabActive)

  const debuggerQuery = useQuery(
    reportQueries.bugReport.getDebuggerEvents.queryOptions({
      input: { id: reportId },
      enabled: Boolean(reportId) && (debuggerDataEnabled || debuggerTabActive),
    })
  )

  const networkQuery = useInfiniteQuery(
    reportQueries.bugReport.getNetworkRequests.infiniteOptions({
      initialPageParam: 1,
      input: (pageParam) => ({
        id: reportId,
        page: pageParam,
        perPage: NETWORK_REQUESTS_PAGE_SIZE,
        search: networkSearch ?? undefined,
      }),
      queryKey: ["networkRequests", reportId, networkSearch ?? ""],
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasNextPage
          ? lastPage.pagination.page + 1
          : undefined,
      enabled: Boolean(reportId) && (networkDataEnabled || networkTabActive),
    })
  )

  const desktopVideoRef = useRef<HTMLVideoElement | null>(null)
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null)
  const [playbackMs, setPlaybackMs] = useState(0)
  const [mobileRecordingHidden, setMobileRecordingHidden] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [selectionByKind, setSelectionByKind] =
    useState<TimelineSelectionByKind>(EMPTY_TIMELINE_SELECTION)

  const retryIngestion = useMutation({
    mutationFn: () => retryBugReportDebuggerIngestion({ id: reportId }),
    onSuccess: async () => {
      await reportQuery.refetch()
      toast.success("Debugger ingestion retried")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to retry debugger ingestion")
    },
  })

  const report = reportQuery.data
  const videoAttached =
    report?.attachmentType === "video" && Boolean(report.attachmentUrl)
  const recordingDurationMs = readRecordingDurationMs(report?.metadata)
  const submissionReady =
    report?.submissionStatus === BUG_REPORT_SUBMISSION_STATUS_OPTIONS.ready

  const debuggerEvents = debuggerQuery.data ?? { actions: [], logs: [] }
  const networkRequests = useMemo(
    () => networkQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [networkQuery.data]
  )

  const actionRows = useMemo(
    () =>
      coerceMissingOffsetsForVideo(
        debuggerEvents.actions.map(mapActionToTimelineEntry),
        Boolean(videoAttached)
      ),
    [debuggerEvents.actions, videoAttached]
  )
  const logRows = useMemo(
    () =>
      coerceMissingOffsetsForVideo(
        debuggerEvents.logs.map(mapLogToTimelineEntry),
        Boolean(videoAttached)
      ),
    [debuggerEvents.logs, videoAttached]
  )
  const networkRows = useMemo(
    () =>
      coerceMissingOffsetsForVideo(
        networkRequests.map(mapNetworkToTimelineEntry),
        Boolean(videoAttached)
      ),
    [networkRequests, videoAttached]
  )

  const resolveVisiblePlayer = useCallback(
    () =>
      resolveVisibleVideoPlayer({
        desktopPlayer: desktopVideoRef.current,
        mobilePlayer: mobileVideoRef.current,
      }),
    []
  )

  const onInspectorTabChange = useCallback(
    (tab: InspectorTab) => {
      if (tab === "actions" || tab === "console") {
        setDebuggerDataEnabled(true)
      }
      if (tab === "network") {
        setNetworkDataEnabled(true)
      }

      setActiveTab(tab, { shallow: false }).catch((error: unknown) => {
        reportNonFatalError(
          "Spotting viewer: failed to persist inspector tab in URL",
          error
        )
      })
    },
    [setActiveTab]
  )

  const onTimelineEntrySelect = useCallback(
    (entry: DebuggerTimelineEntry) => {
      setSelectionByKind((current) => ({
        ...current,
        [entry.kind]: entry.id,
      }))

      seekPlayersToTimelineEntry({
        desktopPlayer: desktopVideoRef.current,
        mobilePlayer: mobileVideoRef.current,
        entry,
        resolveVisiblePlayer,
        recordingDurationMs,
        setPlaybackMs,
        videoAttached: Boolean(videoAttached),
      })
    },
    [recordingDurationMs, resolveVisiblePlayer, videoAttached]
  )

  const loadMoreNetwork = useCallback(() => {
    if (!networkQuery.hasNextPage || networkQuery.isFetching) {
      return
    }

    networkQuery.fetchNextPage({ cancelRefetch: false }).catch((error: unknown) => {
      reportNonFatalError(
        "Spotting viewer: failed to load next network page",
        error
      )
    })
  }, [networkQuery])

  const timelineChannels = useMemo(
    () => ({
      actions: {
        actions: debuggerEvents.actions,
        entries: actionRows,
        selectedEntryId: selectionByKind.action,
        highlightedEntryIds: videoAttached
          ? entryIdsHighlightedAtPlaybackMs({
              entries: actionRows,
              playbackMs,
              videoAttached: true,
            })
          : [],
      } satisfies ActionsChannelState,
      console: {
        entries: logRows,
        selectedEntryId: selectionByKind.log,
        highlightedEntryIds: videoAttached
          ? entryIdsHighlightedAtPlaybackMs({
              entries: logRows,
              playbackMs,
              videoAttached: true,
            })
          : [],
      } satisfies TimelineChannelState,
    }),
    [
      actionRows,
      debuggerEvents.actions,
      logRows,
      playbackMs,
      selectionByKind.action,
      selectionByKind.log,
      videoAttached,
    ]
  )

  const networkChannel = useMemo(
    () => ({
      entries: networkRows,
      requests: networkRequests,
      isLoading: networkQuery.isLoading,
      isFetchingNextPage: networkQuery.isFetchingNextPage,
      hasNextPage: Boolean(networkQuery.hasNextPage),
      onLoadMore: loadMoreNetwork,
      selectedEntryId: selectionByKind.network,
      highlightedEntryIds: videoAttached
        ? entryIdsHighlightedAtPlaybackMs({
            entries: networkRows,
            playbackMs,
            videoAttached: true,
          })
        : [],
    }) satisfies NetworkChannelState,
    [
      loadMoreNetwork,
      networkQuery.hasNextPage,
      networkQuery.isFetchingNextPage,
      networkQuery.isLoading,
      networkRequests,
      networkRows,
      playbackMs,
      selectionByKind.network,
      videoAttached,
    ]
  )

  return {
    report: report as SpottingReportViewModel | undefined,
    isLoading: reportQuery.isLoading,
    error: reportQuery.error,
    refetchReport: reportQuery.refetch,
    activeTab,
    onInspectorTabChange,
    onTimelineEntrySelect,
    timelineChannels,
    networkChannel,
    desktopVideoRef,
    mobileVideoRef,
    onPlaybackMsChange: setPlaybackMs,
    mobileRecordingHidden,
    toggleMobileRecording: () => setMobileRecordingHidden((value) => !value),
    editSheetOpen,
    setEditSheetOpen,
    submissionReady: Boolean(submissionReady),
    retryIngestionPending: retryIngestion.isPending,
    onRetryIngestion: () => retryIngestion.mutate(),
  }
}

export type SpottingReportViewerState = ReturnType<typeof useSpottingReportViewer>

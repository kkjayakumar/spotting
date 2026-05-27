"use client"

/**
 * Spotting network inspector panel.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { reportNonFatalError } from "@spotting/shared/lib/errors"
import { Input } from "@spotting/ui/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@spotting/ui/components/ui/resizable"
import { useDebouncedCallback } from "@spotting/ui/hooks/use-debounced-callback"
import { cn } from "@spotting/ui/lib/utils"
import { Search } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect, useMemo, useRef } from "react"

import { formatTimelineOffset } from "../../lib/format-time"
import { NetworkRequestDetails } from "./network-request-details"
import { EmptyState } from "./panel-sections"
import type { NetworkRequestsPanelProps } from "./types"
import { safeParseUrl, statusTone } from "./utils"

const REQUEST_LIST_DEFAULT_HEIGHT = "300px"
const REQUEST_LIST_MIN_HEIGHT = "190px"
const DETAILS_MIN_HEIGHT = "220px"
const SEARCH_DEBOUNCE_MS = 500

export function NetworkInspectorPanel({
  bugReportId,
  entries,
  requests,
  selectedEntryId,
  highlightedEntryIds,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onEntrySelect,
}: NetworkRequestsPanelProps) {
  const [searchParamValue, setSearchParamValue] = useQueryState(
    "networkSearch",
    parseAsString
  )
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const listContainerRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const requestsById = useMemo(
    () =>
      new Map(
        requests.map((request) => {
          return [request.id, request] as const
        })
      ),
    [requests]
  )

  const normalizedQuery = (searchParamValue ?? "").trim().toLowerCase()

  const syncSearchQuery = useDebouncedCallback((rawValue: string) => {
    const normalizedSearchValue = rawValue.trim()
    const nextSearchParamValue =
      normalizedSearchValue.length > 0 ? normalizedSearchValue : null
    const normalizedSearchParamValue = (searchParamValue ?? "").trim() || null

    if (nextSearchParamValue === normalizedSearchParamValue) {
      return
    }

    setSearchParamValue(nextSearchParamValue, { history: "replace" }).catch(
      (error: unknown) => {
        reportNonFatalError(
          "Failed to sync network search query state from panel input",
          error
        )
      }
    )
  }, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    const input = searchInputRef.current
    if (!input) {
      return
    }

    const nextInputValue = searchParamValue ?? ""
    if (input.value === nextInputValue) {
      return
    }

    input.value = nextInputValue
  }, [searchParamValue])

  const highlightedEntryIdSet = useMemo(
    () => new Set(highlightedEntryIds),
    [highlightedEntryIds]
  )

  const selectedEntry = useMemo(() => {
    if (selectedEntryId) {
      const selectedMatch = entries.find(
        (entry) => entry.id === selectedEntryId
      )
      if (selectedMatch) {
        return selectedMatch
      }
    }

    return entries[0] ?? null
  }, [entries, selectedEntryId])

  const selectedRequest = selectedEntry
    ? requestsById.get(selectedEntry.id)
    : null
  let emptyStateMessage = "No network requests captured."
  if (isLoading) {
    emptyStateMessage = "Loading network requests..."
  } else if (normalizedQuery) {
    emptyStateMessage = "No requests matched your search."
  }

  useEffect(() => {
    const sentinel = loadMoreRef.current
    const listContainer = listContainerRef.current

    if (!(sentinel && listContainer && hasNextPage) || isFetchingNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          onLoadMore()
        }
      },
      {
        root: listContainer,
        rootMargin: "120px 0px",
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore])

  useEffect(() => {
    if (!(selectedEntryId && listContainerRef.current)) {
      return
    }

    const escapedSelectedId = CSS.escape(selectedEntryId)
    const selectedRow = listContainerRef.current.querySelector<HTMLElement>(
      `[data-entry-id="${escapedSelectedId}"]`
    )

    selectedRow?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    })
  }, [selectedEntryId])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b bg-background p-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Captured Requests
          </p>
          <span className="rounded-full border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {entries.length}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-7 text-xs"
            onChange={(event) => {
              syncSearchQuery(event.target.value)
            }}
            placeholder="Filter by method, URL, or status..."
            ref={searchInputRef}
          />
        </div>
      </div>

      <ResizablePanelGroup className="min-h-0 flex-1" orientation="vertical">
        <ResizablePanel
          defaultSize={REQUEST_LIST_DEFAULT_HEIGHT}
          minSize={REQUEST_LIST_MIN_HEIGHT}
        >
          <div
            className="h-full overflow-y-auto border-b bg-background"
            ref={listContainerRef}
          >
            {entries.length === 0 ? (
              <EmptyState message={emptyStateMessage} />
            ) : (
              <div className="w-full min-w-max text-left text-[11px] font-mono leading-tight">
                <div className="flex border-b border-muted bg-muted/30 px-2 py-1 text-muted-foreground font-semibold sticky top-0 z-10">
                  <div className="w-[30%] shrink-0">Name</div>
                  <div className="w-[10%] shrink-0">Method</div>
                  <div className="w-[10%] shrink-0">Status</div>
                  <div className="w-[25%] shrink-0">Domain</div>
                  <div className="w-[15%] shrink-0 text-right">Time</div>
                </div>
                {entries.map((entry) => {
                  const request = requestsById.get(entry.id)
                  const status = request?.status ?? null
                  const duration = request?.duration ?? null
                  const parsed = safeParseUrl(request?.url)
                  const nameText = parsed
                    ? `${parsed.pathname.split('/').pop() || '/'}`
                    : (request?.url ?? entry.detail)
                  const fullUrl = request?.url ?? entry.detail
                  const isSelected = entry.id === selectedEntry?.id
                  const isHighlighted = highlightedEntryIdSet.has(entry.id)

                  let rowBg = "transparent"
                  if (isSelected) {
                    rowBg = "bg-primary/20 text-primary-foreground dark:bg-primary/30"
                  } else if (isHighlighted) {
                    rowBg = "bg-primary/10"
                  } else if (status && status >= 400) {
                    rowBg = "bg-red-500/10"
                  }

                  return (
                    <button
                      className={cn(
                        "flex w-full items-center px-2 py-1 text-left hover:bg-muted/50 focus:outline-none transition-none border-b border-transparent hover:border-muted",
                        rowBg
                      )}
                      data-entry-id={entry.id}
                      key={entry.id}
                      onClick={() => onEntrySelect(entry)}
                      type="button"
                    >
                      <div className="w-[30%] shrink-0 truncate pr-2 font-medium" title={fullUrl}>
                        {nameText}
                      </div>
                      <div className="w-[10%] shrink-0 pr-2">
                        {request?.method ?? entry.label}
                      </div>
                      <div className="w-[10%] shrink-0 pr-2">
                        {status !== null ? (
                          <span className={statusTone(status)}>{status}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                      <div className="w-[25%] shrink-0 truncate pr-2 text-muted-foreground">
                        {parsed?.host ?? "-"}
                      </div>
                      <div className="w-[15%] shrink-0 text-right pr-2 text-muted-foreground">
                        {typeof duration === "number" ? `${duration} ms` : "-"}
                      </div>
                    </button>
                  )
                })}
                {(hasNextPage || isFetchingNextPage) && (
                  <div className="flex justify-center border-t p-2">
                    <div className="w-full">
                      <div className="h-1 w-full" ref={loadMoreRef} />
                      <p className="text-center text-[10px] text-muted-foreground">
                        {isFetchingNextPage
                          ? "Loading more requests..."
                          : "Scroll for more requests"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel minSize={DETAILS_MIN_HEIGHT}>
          <div className="h-full overflow-y-auto bg-muted/20 p-3">
            <NetworkRequestDetails
              bugReportId={bugReportId}
              key={selectedEntry?.id ?? "empty"}
              request={selectedRequest ?? null}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

/** @deprecated Use NetworkInspectorPanel */
export const NetworkRequestsPanel = NetworkInspectorPanel

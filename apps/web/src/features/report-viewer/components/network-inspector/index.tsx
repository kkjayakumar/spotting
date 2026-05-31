"use client"

/**
 * Spotting network inspector panel (devtools-style).
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { reportNonFatalError } from "@spotting/shared/lib/errors"
import { Input } from "@spotting/ui/components/ui/input"
import { useDebouncedCallback } from "@spotting/ui/hooks/use-debounced-callback"
import { cn } from "@spotting/ui/lib/utils"
import {
  Braces,
  Cable,
  File as FileIcon,
  FileCode,
  FileText,
  Image as ImageIcon,
  type LucideIcon,
  Palette,
  Search,
  Type as TypeIcon,
} from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect, useMemo, useRef, useState } from "react"

import { NetworkRequestDetails } from "./network-request-details"
import { EmptyState } from "./panel-sections"
import type { NetworkRequestsPanelProps } from "./types"
import {
  deriveRequestType,
  formatResponseSize,
  networkRequestName,
  networkTypeLabel,
  safeParseUrl,
  statusTone,
  type NetworkTypeCategory,
} from "./utils"

const SEARCH_DEBOUNCE_MS = 500

type TypeChip = { id: "all" | NetworkTypeCategory; label: string }

const TYPE_CHIPS: TypeChip[] = [
  { id: "all", label: "All" },
  { id: "fetch-xhr", label: "Fetch/XHR" },
  { id: "ws", label: "WS" },
  { id: "js", label: "JS" },
  { id: "css", label: "CSS" },
  { id: "media", label: "Media" },
  { id: "font", label: "Font" },
  { id: "doc", label: "Doc" },
  { id: "other", label: "Other" },
]

const TYPE_META: Record<NetworkTypeCategory, { Icon: LucideIcon; color: string }> = {
  "fetch-xhr": { Icon: Braces, color: "text-violet-500" },
  ws: { Icon: Cable, color: "text-pink-500" },
  js: { Icon: FileCode, color: "text-amber-500" },
  css: { Icon: Palette, color: "text-blue-500" },
  media: { Icon: ImageIcon, color: "text-emerald-500" },
  font: { Icon: TypeIcon, color: "text-purple-400" },
  doc: { Icon: FileText, color: "text-sky-400" },
  other: { Icon: FileIcon, color: "text-muted-foreground" },
}

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
  const [typeFilter, setTypeFilter] = useState<"all" | NetworkTypeCategory>("all")
  const [errorsOnly, setErrorsOnly] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const listContainerRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const requestsById = useMemo(
    () => new Map(requests.map((request) => [request.id, request] as const)),
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

  // Join each timeline entry with its request payload, then apply client-side filters.
  const rows = useMemo(
    () =>
      entries.map((entry) => {
        const request = requestsById.get(entry.id)
        const category = request ? deriveRequestType(request) : "other"
        return { entry, request, category }
      }),
    [entries, requestsById]
  )

  const filteredRows = useMemo(
    () =>
      rows.filter(({ request, category }) => {
        if (errorsOnly && !((request?.status ?? 0) >= 400)) {
          return false
        }
        if (typeFilter !== "all" && category !== typeFilter) {
          return false
        }
        return true
      }),
    [rows, errorsOnly, typeFilter]
  )

  // Waterfall window across the visible rows.
  const { windowStart, windowSpan } = useMemo(() => {
    let start = Number.POSITIVE_INFINITY
    let end = 0
    for (const { request } of filteredRows) {
      if (!request) {
        continue
      }
      const offset = request.offset ?? 0
      const duration = request.duration ?? 0
      start = Math.min(start, offset)
      end = Math.max(end, offset + duration)
    }
    if (!Number.isFinite(start)) {
      start = 0
    }
    return { windowStart: start, windowSpan: Math.max(1, end - start) }
  }, [filteredRows])

  const selectedEntry = useMemo(() => {
    if (selectedEntryId) {
      const match = entries.find((entry) => entry.id === selectedEntryId)
      if (match) {
        return match
      }
    }
    return entries[0] ?? null
  }, [entries, selectedEntryId])

  const selectedRequest = selectedEntry ? requestsById.get(selectedEntry.id) : null

  let emptyStateMessage = "No network requests captured."
  if (isLoading) {
    emptyStateMessage = "Loading network requests..."
  } else if (normalizedQuery || typeFilter !== "all" || errorsOnly) {
    emptyStateMessage = "No requests matched your filters."
  }

  useEffect(() => {
    const sentinel = loadMoreRef.current
    const listContainer = listContainerRef.current
    if (!(sentinel && listContainer && hasNextPage) || isFetchingNextPage) {
      return
    }
    const observer = new IntersectionObserver(
      (observed) => {
        const [entry] = observed
        if (entry?.isIntersecting) {
          onLoadMore()
        }
      },
      { root: listContainer, rootMargin: "120px 0px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, onLoadMore])

  useEffect(() => {
    if (!(selectedEntryId && listContainerRef.current)) {
      return
    }
    const escapedSelectedId = CSS.escape(selectedEntryId)
    const selectedRow = listContainerRef.current.querySelector<HTMLElement>(
      `[data-entry-id="${escapedSelectedId}"]`
    )
    selectedRow?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedEntryId])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar: filter + errors-only */}
      <div className="flex items-center gap-2 border-b bg-background px-3 py-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-7 pl-7 text-xs"
            onChange={(event) => syncSearchQuery(event.target.value)}
            placeholder="Filter"
            ref={searchInputRef}
          />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-muted-foreground text-xs">
          <input
            checked={errorsOnly}
            className="size-3.5 accent-red-500"
            onChange={(event) => setErrorsOnly(event.target.checked)}
            type="checkbox"
          />
          Errors only
        </label>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-background px-3 py-1.5">
        {TYPE_CHIPS.map((chip) => (
          <button
            className={cn(
              "rounded-full px-2 py-0.5 font-medium text-[11px] transition-colors",
              typeFilter === chip.id
                ? "bg-emerald-500/15 text-emerald-500"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            key={chip.id}
            onClick={() => setTypeFilter(chip.id)}
            type="button"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="h-full overflow-auto bg-background" ref={listContainerRef}>
            {filteredRows.length === 0 ? (
              <EmptyState message={emptyStateMessage} />
            ) : (
              <div className="min-w-max text-left font-mono text-[11px] leading-tight">
                {/* Header */}
                <div className="sticky top-0 z-10 flex border-muted border-b bg-muted/40 px-2 py-1.5 font-semibold text-muted-foreground">
                  <div className="w-8 shrink-0 text-right pr-2">#</div>
                  <div className="w-[180px] shrink-0">Name</div>
                  <div className="w-14 shrink-0">Method</div>
                  <div className="w-12 shrink-0">Status</div>
                  <div className="w-36 shrink-0">Domain</div>
                  <div className="w-14 shrink-0">Type</div>
                  <div className="w-16 shrink-0 text-right pr-2">Size</div>
                  <div className="w-16 shrink-0 text-right pr-2">Time</div>
                  <div className="w-36 shrink-0">Waterfall</div>
                </div>

                {filteredRows.map(({ entry, request, category }, index) => {
                  const status = request?.status ?? null
                  const duration = request?.duration ?? null
                  const parsed = safeParseUrl(request?.url)
                  const name = networkRequestName(request?.url, entry.detail)
                  const fullUrl = request?.url ?? entry.detail
                  const isSelected = entry.id === selectedEntry?.id
                  const isHighlighted = highlightedEntryIdSet.has(entry.id)

                  const offset = request?.offset ?? 0
                  const barLeft = ((offset - windowStart) / windowSpan) * 100
                  const barWidth = Math.max(1.5, ((duration ?? 0) / windowSpan) * 100)

                  let rowBg = "transparent"
                  if (isSelected) {
                    rowBg = "bg-primary/20"
                  } else if (isHighlighted) {
                    rowBg = "bg-primary/10"
                  } else if (status && status >= 400) {
                    rowBg = "bg-red-500/10"
                  }

                  return (
                    <button
                      className={cn(
                        "flex w-full items-center border-transparent border-b px-2 py-1 text-left transition-none hover:bg-muted/50",
                        rowBg
                      )}
                      data-entry-id={entry.id}
                      key={entry.id}
                      onClick={() => {
                        onEntrySelect(entry)
                        setDetailOpen(true)
                      }}
                      type="button"
                    >
                      <div className="w-8 shrink-0 pr-2 text-right text-muted-foreground">
                        {index + 1}
                      </div>
                      <div
                        className="flex w-[180px] shrink-0 items-center gap-1.5 truncate pr-2 font-medium"
                        title={fullUrl}
                      >
                        {(() => {
                          const TypeGlyph = TYPE_META[category].Icon
                          return <TypeGlyph className={cn("size-3.5 shrink-0", TYPE_META[category].color)} />
                        })()}
                        <span className="truncate">{name}</span>
                      </div>
                      <div className="w-14 shrink-0 pr-1 text-muted-foreground">
                        {request?.method ?? entry.label}
                      </div>
                      <div className="w-12 shrink-0 pr-1">
                        {status === null ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <span className={statusTone(status)}>{status}</span>
                        )}
                      </div>
                      <div className="w-36 shrink-0 truncate pr-2 text-muted-foreground">
                        {parsed?.host ?? "-"}
                      </div>
                      <div className="w-14 shrink-0 pr-1 text-muted-foreground">
                        {networkTypeLabel(category)}
                      </div>
                      <div className="w-16 shrink-0 pr-2 text-right text-muted-foreground">
                        {request ? formatResponseSize(request) : "—"}
                      </div>
                      <div className="w-16 shrink-0 pr-2 text-right text-muted-foreground">
                        {typeof duration === "number" ? `${duration} ms` : "-"}
                      </div>
                      <div className="w-36 shrink-0 pr-1">
                        <div className="relative h-2 w-full rounded-sm bg-muted/50">
                          <div
                            className={cn(
                              "absolute top-0 h-2 min-w-[2px] rounded-sm",
                              status && status >= 400 ? "bg-red-500" : "bg-primary/70"
                            )}
                            style={{
                              left: `${Math.max(0, Math.min(100, barLeft))}%`,
                              width: `${Math.max(0, Math.min(100, barWidth))}%`,
                            }}
                          />
                        </div>
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
        {detailOpen && selectedRequest ? (
          <div className="absolute inset-0 z-20 bg-background">
            <NetworkRequestDetails
              bugReportId={bugReportId}
              key={selectedEntry?.id ?? "empty"}
              onClose={() => setDetailOpen(false)}
              request={selectedRequest}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** @deprecated Use NetworkInspectorPanel */
export const NetworkRequestsPanel = NetworkInspectorPanel

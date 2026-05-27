/**
 * Spotting session timeline list (console / generic events).
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

"use client"

import { cn } from "@spotting/ui/lib/utils"
import { type ReactNode, useEffect, useMemo, useRef } from "react"

import { formatTimelineOffset } from "../lib/format-time"
import type { DebuggerTimelineEntry } from "../types"

interface SessionTimelineListProps {
  emptyMessage: string
  entries: DebuggerTimelineEntry[]
  highlightedEntryIds: string[]
  icon: ReactNode
  onSelect: (entry: DebuggerTimelineEntry) => void
  selectedEntryId: string | null
}

function labelTone(label: string): string {
  const normalized = label.toLowerCase()
  if (normalized.includes("error") || normalized.includes("fail")) {
    return "text-red-500 dark:text-red-400"
  }
  if (normalized.includes("warn")) {
    return "text-orange-500 dark:text-orange-400"
  }
  return "text-foreground"
}

export function SessionTimelineList({
  emptyMessage,
  entries,
  highlightedEntryIds,
  icon,
  onSelect,
  selectedEntryId,
}: SessionTimelineListProps) {
  const highlightSet = useMemo(
    () => new Set(highlightedEntryIds),
    [highlightedEntryIds]
  )
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!(selectedEntryId && listRef.current)) {
      return
    }

    listRef.current
      .querySelector<HTMLElement>(`[data-timeline-id="${CSS.escape(selectedEntryId)}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedEntryId])

  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <div className="mb-2 rounded-full bg-muted p-2 opacity-50">{icon}</div>
        <p className="text-xs">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="divide-y border-t bg-background" ref={listRef}>
      {entries.map((entry) => {
        const selected = entry.id === selectedEntryId
        const highlighted = highlightSet.has(entry.id)

        return (
          <button
            className={cn(
              "flex w-full flex-col gap-1 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none",
              highlighted &&
                "bg-muted/40 shadow-[inset_2px_0_0_0] shadow-primary/50",
              selected && "bg-muted/70 shadow-[inset_2px_0_0_0] shadow-primary"
            )}
            data-timeline-id={entry.id}
            key={entry.id}
            onClick={() => onSelect(entry)}
            type="button"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className={cn("font-medium font-mono text-xs", labelTone(entry.label))}>
                {entry.label}
              </span>
              {typeof entry.offset === "number" ? (
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {formatTimelineOffset(entry.offset)}
                </span>
              ) : null}
            </div>
            <p className="line-clamp-2 break-all font-mono text-muted-foreground text-xs">
              {entry.detail}
            </p>
          </button>
        )
      })}
    </div>
  )
}

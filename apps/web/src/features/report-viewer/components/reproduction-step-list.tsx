/**
 * Spotting reproduction step list.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

"use client"

import { cn } from "@spotting/ui/lib/utils"
import { MousePointerClickIcon } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"

import { buildReproductionSteps } from "../lib/reproduction-steps"
import type { DebuggerAction, DebuggerTimelineEntry } from "../types"

interface ReproductionStepListProps {
  actions: DebuggerAction[]
  entries: DebuggerTimelineEntry[]
  highlightedEntryIds: string[]
  onSelect: (entry: DebuggerTimelineEntry) => void
  selectedEntryId: string | null
}

export function ReproductionStepList({
  actions,
  entries,
  highlightedEntryIds,
  onSelect,
  selectedEntryId,
}: ReproductionStepListProps) {
  const listRef = useRef<HTMLOListElement | null>(null)
  const highlightSet = useMemo(
    () => new Set(highlightedEntryIds),
    [highlightedEntryIds]
  )
  const steps = useMemo(
    () => buildReproductionSteps({ actions, entries }),
    [actions, entries]
  )

  useEffect(() => {
    if (!(selectedEntryId && listRef.current)) {
      return
    }

    listRef.current
      .querySelector<HTMLElement>(
        `[data-step-contains="${CSS.escape(selectedEntryId)}"]`
      )
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedEntryId])

  if (steps.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <div className="mb-2 rounded-full bg-muted p-2 opacity-50">
          <MousePointerClickIcon className="size-3" />
        </div>
        <p className="text-xs">No user actions captured.</p>
      </div>
    )
  }

  return (
    <ol className="divide-y border-t bg-background" ref={listRef}>
      {steps.map((step) => {
        const selected = step.actionIds.includes(selectedEntryId ?? "")
        const highlighted = step.actionIds.some((id) => highlightSet.has(id))

        return (
          <li key={step.id}>
            <button
              className={cn(
                "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30 focus:bg-muted/30 focus:outline-none",
                highlighted && "bg-primary/5",
                selected && "bg-muted/50 shadow-[inset_3px_0_0_0] shadow-primary"
              )}
              data-step-contains={step.actionIds.join(" ")}
              onClick={() => onSelect(step.selectedEntry)}
              type="button"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full font-medium font-mono text-[11px]",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.sequence}
              </span>
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-foreground text-sm leading-5">{step.title}</span>
                  {step.timeLabel ? (
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {step.timeLabel}
                    </span>
                  ) : null}
                </span>
                {step.summary ? (
                  <span className="block text-muted-foreground text-xs leading-4">
                    {step.summary}
                  </span>
                ) : null}
                {step.targetLabel && step.targetLabel !== step.summary ? (
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {step.targetLabel}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

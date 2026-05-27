/**
 * Spotting report viewer — reproduction step builder.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DebuggerAction, DebuggerTimelineEntry } from "../../types"
import { formatTimelineOffset } from "../../lib/format-time"
import { clusterActionsByTarget } from "./action-grouping"
import {
  buildStepSummary,
  buildStepTitle,
  findPreviousNavigation,
  formatStepTimeRange,
} from "./step-formatters"

export interface ReproductionStepItem {
  actionIds: string[]
  id: string
  sequence: number
  summary: string | null
  timeLabel: string | null
  title: string
  selectedEntry: DebuggerTimelineEntry
  targetLabel: string | null
}

export function buildReproductionSteps(input: {
  actions: DebuggerAction[]
  entries: DebuggerTimelineEntry[]
}): ReproductionStepItem[] {
  const entryLookup = new Map(
    input.entries.map((entry) => [entry.id, entry] as const)
  )
  const actionGroups = clusterActionsByTarget(input.actions)
  const steps: ReproductionStepItem[] = []

  for (let groupIndex = 0; groupIndex < actionGroups.length; groupIndex += 1) {
    const group = actionGroups[groupIndex]
    const first = group[0]
    const last = group.at(-1)

    if (!(first && last)) {
      continue
    }

    const selectedEntry =
      entryLookup.get(last.id) ?? entryLookup.get(first.id)

    if (!selectedEntry) {
      continue
    }

    const previousNavigation = findPreviousNavigation(actionGroups, groupIndex)

    steps.push({
      actionIds: group.map((action) => action.id),
      id: first.id,
      sequence: steps.length + 1,
      summary: buildStepSummary({
        action: first,
        groupSize: group.length,
        lastAction: last,
        previousNavigationAction: previousNavigation,
      }),
      timeLabel: formatStepTimeRange(group, entryLookup),
      title: buildStepTitle({
        action: first,
        groupSize: group.length,
        previousNavigationAction: previousNavigation,
      }),
      selectedEntry,
      targetLabel:
        first.type === "navigation" ? null : (first.target ?? null),
    })
  }

  return steps
}

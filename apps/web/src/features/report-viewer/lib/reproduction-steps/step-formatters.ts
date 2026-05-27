/**
 * Spotting reproduction step label formatters.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DebuggerAction, DebuggerTimelineEntry } from "../../types"
import { formatTimelineOffset } from "../../lib/format-time"
import { findPreviousNavigation } from "./action-grouping"

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function targetKind(target: string | null | undefined): string {
  if (!(target && target.length > 0)) {
    return "element"
  }

  if (target === "window") {
    return "page"
  }

  if (target.startsWith("#")) {
    return "field"
  }

  const tag = target.split(".", 2)[0]?.trim().toLowerCase()

  switch (tag) {
    case "a":
      return "link"
    case "button":
      return "button"
    case "form":
      return "form"
    case "input":
    case "textarea":
      return "field"
    case "select":
      return "select"
    default:
      return "element"
  }
}

function navigationModeLabel(mode: unknown): string | null {
  const normalized = nonEmptyString(mode)
  if (!normalized) {
    return null
  }

  const labels: Record<string, string> = {
    pushState: "via push state",
    replaceState: "via replace state",
    popstate: "via browser history",
    hashchange: "via hash change",
    initial: "initial page state",
  }

  return labels[normalized] ?? `via ${normalized}`
}

function isSamePathStateNavigation(
  action: DebuggerAction,
  previousNavigationAction: DebuggerAction | null
): boolean {
  if (action.type !== "navigation") {
    return false
  }

  const mode = nonEmptyString(action.metadata?.mode)
  const path = nonEmptyString(action.metadata?.path)
  const previousPath =
    previousNavigationAction?.type === "navigation"
      ? nonEmptyString(previousNavigationAction.metadata?.path)
      : null

  if (!(mode && path && previousPath) || path !== previousPath) {
    return false
  }

  return mode === "pushState" || mode === "replaceState" || mode === "hashchange"
}

function describeHistoryDelta(input: {
  currentHash: string | null
  currentSearch: string | null
  previousHash: string | null
  previousSearch: string | null
}): string | null {
  const searchChanged = input.currentSearch !== input.previousSearch
  const hashChanged = input.currentHash !== input.previousHash

  if (searchChanged && hashChanged) {
    return "query and hash updated"
  }

  if (searchChanged) {
    return "query updated"
  }

  if (hashChanged) {
    return "hash updated"
  }

  return "history state updated"
}

function formatInputLength(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null
  }

  const length = Math.floor(value)
  return length === 1
    ? "field length 1 character"
    : `field length ${length} characters`
}

export function buildStepTitle(input: {
  action: DebuggerAction
  groupSize: number
  previousNavigationAction: DebuggerAction | null
}): string {
  const kind = targetKind(input.action.target)

  switch (input.action.type) {
    case "click":
      return kind === "button" ? "Click button" : "Click element"
    case "input":
      return input.groupSize > 1 ? "Type into field" : "Enter text into field"
    case "change":
      return kind === "select" ? "Change selection" : "Change field"
    case "submit":
      return "Submit form"
    case "keydown":
      return "Use keyboard"
    case "navigation": {
      if (isSamePathStateNavigation(input.action, input.previousNavigationAction)) {
        return "Update page state"
      }

      const path = nonEmptyString(input.action.metadata?.path)
      return path ? `Navigate to ${path}` : "Navigate to a new page"
    }
    default:
      return "Interact with page"
  }
}

export function buildStepSummary(input: {
  action: DebuggerAction
  groupSize: number
  lastAction: DebuggerAction
  previousNavigationAction: DebuggerAction | null
}): string | null {
  switch (input.action.type) {
    case "navigation": {
      if (isSamePathStateNavigation(input.action, input.previousNavigationAction)) {
        const path = nonEmptyString(input.action.metadata?.path)
        const title = nonEmptyString(input.action.metadata?.title)
        const mode = navigationModeLabel(input.action.metadata?.mode)
        const previousSearch =
          input.previousNavigationAction?.type === "navigation"
            ? nonEmptyString(input.previousNavigationAction.metadata?.search)
            : null
        const currentSearch = nonEmptyString(input.action.metadata?.search)
        const previousHash =
          input.previousNavigationAction?.type === "navigation"
            ? nonEmptyString(input.previousNavigationAction.metadata?.hash)
            : null
        const currentHash = nonEmptyString(input.action.metadata?.hash)
        const change = describeHistoryDelta({
          currentHash,
          currentSearch,
          previousHash,
          previousSearch,
        })
        const parts = [title, path, change, mode].filter(Boolean)
        return parts.length > 0 ? parts.join(" • ") : null
      }

      const parts = [
        nonEmptyString(input.lastAction.metadata?.title),
        navigationModeLabel(input.lastAction.metadata?.mode),
      ].filter(Boolean)

      return parts.length > 0 ? parts.join(" • ") : null
    }
    case "input": {
      const parts = [
        input.groupSize > 1 ? `${input.groupSize} input events` : null,
        formatInputLength(input.lastAction.metadata?.valueLength),
      ].filter(Boolean)

      return parts.length > 0 ? parts.join(" • ") : null
    }
    default:
      return input.action.target ?? null
  }
}

export function formatStepTimeRange(
  actions: DebuggerAction[],
  entriesById: Map<string, DebuggerTimelineEntry>
): string | null {
  const offsets = actions.flatMap((action) => {
    const offset = entriesById.get(action.id)?.offset
    return typeof offset === "number" ? [offset] : []
  })

  if (offsets.length === 0) {
    return null
  }

  const start = offsets[0]
  const end = offsets.at(-1)

  if (typeof start !== "number" || typeof end !== "number") {
    return null
  }

  if (start === end) {
    return formatTimelineOffset(start)
  }

  return `${formatTimelineOffset(start)} -> ${formatTimelineOffset(end)}`
}

export { findPreviousNavigation }

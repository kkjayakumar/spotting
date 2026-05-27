/**
 * Spotting debugger event → timeline row mappers.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { reportNonFatalError } from "@spotting/shared/lib/errors"

import type {
  DebuggerAction,
  DebuggerLog,
  DebuggerNetworkRequest,
  DebuggerTimelineEntry,
} from "../types"

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

function parseHttpUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch (error) {
    reportNonFatalError(
      "Spotting viewer: invalid network URL in timeline mapper",
      { error, value },
      { once: true }
    )
    return null
  }
}

export function mapActionToTimelineEntry(
  action: DebuggerAction
): DebuggerTimelineEntry {
  const detailParts = [
    action.target ?? "unknown target",
    readOptionalString(action.metadata?.mode),
  ].filter(Boolean)

  return {
    id: action.id,
    kind: "action",
    label: action.type,
    detail: detailParts.join(" • "),
    timestamp: action.timestamp,
    offset: action.offset,
  }
}

export function mapLogToTimelineEntry(log: DebuggerLog): DebuggerTimelineEntry {
  return {
    id: log.id,
    kind: "log",
    label: log.level.toUpperCase(),
    detail: log.message,
    timestamp: log.timestamp,
    offset: log.offset,
  }
}

export function mapNetworkToTimelineEntry(
  request: DebuggerNetworkRequest
): DebuggerTimelineEntry {
  const parsed = parseHttpUrl(request.url)
  const pathLabel = parsed
    ? `${parsed.pathname}${parsed.search}`
    : request.url
  const statusPart =
    request.status !== null && request.status !== undefined
      ? `status:${request.status}`
      : "status:pending"
  const durationPart =
    typeof request.duration === "number" ? `${request.duration}ms` : null

  return {
    id: request.id,
    kind: "network",
    label: request.method.toUpperCase(),
    detail: [pathLabel, statusPart, durationPart].filter(Boolean).join(" • "),
    timestamp: request.timestamp,
    offset: request.offset,
  }
}

export function coerceMissingOffsetsForVideo(
  entries: DebuggerTimelineEntry[],
  videoAttached: boolean
): DebuggerTimelineEntry[] {
  if (!videoAttached) {
    return entries
  }

  return entries.map((entry) =>
    typeof entry.offset === "number" ? entry : { ...entry, offset: 0 }
  )
}

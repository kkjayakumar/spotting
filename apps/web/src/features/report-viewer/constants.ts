/**
 * Spotting report viewer layout and query constants.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const INSPECTOR_TABS = [
  "details",
  "actions",
  "console",
  "network",
] as const

export type InspectorTab = (typeof INSPECTOR_TABS)[number]

export const NETWORK_REQUESTS_PAGE_SIZE = 10

export const VIEWER_LAYOUT = {
  canvasMinWidth: "720px",
  sidebarDefaultWidth: "420px",
  sidebarMinWidth: "360px",
  sidebarMaxWidth: "1080px",
  networkListDefaultHeight: "300px",
  networkListMinHeight: "190px",
  networkDetailsMinHeight: "220px",
} as const

export const PLAYBACK_HIGHLIGHT_BUCKET_MS = 100

export const NETWORK_SEARCH_DEBOUNCE_MS = 500

/**
 * Spotting PostHog browser bootstrap.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import posthog from "posthog-js"

export interface SpottingPostHogConfig {
  key?: string
  host?: string
}

export function initPostHog(config: SpottingPostHogConfig): void {
  const { key, host } = config

  if (!key || !host) {
    return
  }

  posthog.init(key, {
    api_host: "/ph",
    ui_host: host,
    defaults: "2026-01-30",
  })
}

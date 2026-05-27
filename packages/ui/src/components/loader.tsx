/**
 * Spotting full-page loading indicator.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Loader2Icon } from "lucide-react"

export function Loader() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex h-full items-center justify-center pt-8"
      role="status"
    >
      <Loader2Icon aria-hidden className="size-5 animate-spin" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

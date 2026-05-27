/**
 * Spotting viewer loading state.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Loader2Icon } from "lucide-react"

export function ViewerLoadingState() {
  return (
    <div
      aria-busy="true"
      className="flex h-screen items-center justify-center bg-background"
      role="status"
    >
      <Loader2Icon aria-hidden className="size-8 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading report</span>
    </div>
  )
}

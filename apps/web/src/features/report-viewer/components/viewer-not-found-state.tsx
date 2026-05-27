/**
 * Spotting viewer not-found state.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Button } from "@spotting/ui/components/ui/button"
import { AlertCircleIcon } from "lucide-react"
import Link from "next/link"

export function ViewerNotFoundState() {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircleIcon className="size-12 text-destructive" />
        <div>
          <h1 className="font-semibold text-xl">Report not found</h1>
          <p className="text-muted-foreground text-sm">
            This share link is invalid or the report was removed.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/">Back to dashboard</Link>} variant="outline" />
      </div>
    </div>
  )
}

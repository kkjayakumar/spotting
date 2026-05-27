/**
 * Spotting report viewer header.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Button } from "@spotting/ui/components/ui/button"
import { Separator } from "@spotting/ui/components/ui/separator"
import { HomeIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { labelReportStatus } from "../lib/report-metadata"
import type { SpottingReportViewModel } from "../types"

interface ReportViewerHeaderProps {
  report: SpottingReportViewModel
  editAction?: ReactNode
  mobileTrigger?: ReactNode
}

export function ReportViewerHeader({
  report,
  editAction,
  mobileTrigger,
}: ReportViewerHeaderProps) {
  const title = report.title?.trim() || "Untitled report"

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {mobileTrigger ? <div className="md:hidden">{mobileTrigger}</div> : null}
        <Link
          className="shrink-0 font-semibold text-foreground transition-colors hover:text-primary"
          href="/"
        >
          Spotting
        </Link>
        <Separator className="h-5" orientation="vertical" />
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate font-medium text-sm" title={title}>
            {title}
          </h1>
          <span className="hidden shrink-0 rounded-full border bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground text-xs sm:inline-flex">
            {labelReportStatus(report.status)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <time
          className="hidden text-muted-foreground text-xs sm:inline-block"
          dateTime={new Date(report.createdAt).toISOString()}
        >
          {new Date(report.createdAt).toLocaleString()}
        </time>
        <Separator className="hidden sm:block" orientation="vertical" />
        {editAction}
        <Button
          nativeButton={false}
          render={
            <Link href="/">
              <HomeIcon />
              <span className="sr-only">Dashboard</span>
            </Link>
          }
          size="sm"
          variant="ghost"
        />
      </div>
    </header>
  )
}

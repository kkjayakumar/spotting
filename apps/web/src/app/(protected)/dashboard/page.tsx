import type { Metadata } from "next"

import { SpottingReportsList } from "@/features/reports/dashboard"

const PAGE_COPY = {
  title: "Reports",
  description: "Browse, filter, and manage captured bug reports for your team.",
} as const

export const metadata: Metadata = {
  title: PAGE_COPY.title,
  description: PAGE_COPY.description,
}

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">{PAGE_COPY.title}</h1>
          <p className="mt-1 text-muted-foreground">{PAGE_COPY.description}</p>
        </div>
      </header>
      <SpottingReportsList />
    </div>
  )
}

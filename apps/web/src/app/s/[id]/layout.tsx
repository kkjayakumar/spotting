import { reportNonFatalError } from "@spotting/shared/lib/errors"
import type { Metadata } from "next"
import { headers } from "next/headers"
import type { ReactNode } from "react"

import { fetchApiWithRequestHeaders } from "@/lib/api"

interface BugReportLayoutProps {
  children: ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: Pick<BugReportLayoutProps, "params">): Promise<Metadata> {
  const { id } = await params

  if (!id) {
    return { title: "Bug Report" }
  }

  try {
    const requestHeaders = await headers()
    const report = (await fetchApiWithRequestHeaders(`/v1/reports/${id}`, {
      headers: requestHeaders,
    })) as { title?: string } | null

    if (!report?.title?.trim()) {
      return { title: "Bug Report" }
    }

    return {
      title: report.title.trim(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Private reports 404 in metadata when the session cookie is not on this request yet.
    if (!message.includes("Report not found")) {
      reportNonFatalError(
        `Failed to generate metadata for bug report ${id}`,
        error,
      );
    }
    return { title: "Bug Report" };
  }
}

export default function BugReportLayout({ children }: BugReportLayoutProps) {
  return children
}

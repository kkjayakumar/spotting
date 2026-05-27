import { notFound } from "next/navigation"

import { SpottingReportViewer } from "@/features/report-viewer"

type SharedReportPageProps = {
  params: Promise<{ id: string }>
}

export default async function SharedReportPage({ params }: SharedReportPageProps) {
  const { id: reportId } = await params

  if (!reportId?.trim()) {
    notFound()
  }

  return <SpottingReportViewer reportId={reportId} />
}

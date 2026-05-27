import type { ReactNode } from "react"

type SharedReportLayoutProps = {
  children: ReactNode
}

export default function SharedReportLayout({
  children,
}: SharedReportLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">{children}</div>
  )
}

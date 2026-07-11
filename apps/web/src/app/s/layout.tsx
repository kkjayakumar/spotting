import type { ReactNode } from "react"
import { Plus_Jakarta_Sans, Roboto_Mono } from "next/font/google"

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-google-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const monoFont = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-google-mono",
  weight: ["400", "500", "700"],
  display: "swap",
})

type SharedReportLayoutProps = {
  children: ReactNode
}

export default function SharedReportLayout({
  children,
}: SharedReportLayoutProps) {
  return (
    <div className={`${sansFont.variable} ${monoFont.variable} google-theme min-h-screen bg-background text-foreground`}>
      {children}
    </div>
  )
}

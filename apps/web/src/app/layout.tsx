import { env } from "@spotting/env/web"
import "@spotting/ui/styles/dashboard.css"
import { siteConfig } from "@spotting/shared/config/site"
import type { Metadata } from "next"
import NextTopLoader from "nextjs-toploader"
import Providers from "@/components/providers"

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
        suppressHydrationWarning
      >
        <NextTopLoader color="#00BFFF" showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

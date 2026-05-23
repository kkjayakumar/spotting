import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getProtectedAuthData } from "@/app/(protected)/_lib/get-protected-auth-data"
import { extensionDistExists } from "@/lib/extension-dist"

import { BrowserExtensionCard } from "../_components/browser-extension-card"

export const metadata: Metadata = {
  title: "Browser extension",
  description: "Install the Spotting capture extension for Chromium browsers.",
}

export default async function BrowserExtensionSettingsPage() {
  const { organizations, session } = await getProtectedAuthData()

  if (!session) {
    redirect("/login")
  }

  if (organizations.length === 0) {
    redirect("/onboarding")
  }

  const downloadAvailable = await extensionDistExists()
  const storeUrl =
    process.env.NEXT_PUBLIC_BROWSER_EXTENSION_STORE_URL?.trim() || null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl tracking-tight">Browser extension</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Install the Spotting widget on any site for QA and capture workflows.
        </p>
      </div>

      <BrowserExtensionCard
        downloadAvailable={downloadAvailable}
        storeUrl={storeUrl}
      />
    </div>
  )
}

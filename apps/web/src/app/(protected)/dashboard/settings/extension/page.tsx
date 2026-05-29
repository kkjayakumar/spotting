import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getProtectedAuthData } from "@/app/(protected)/_lib/get-protected-auth-data"
import { extensionDownloadsAvailability } from "@/lib/extension-dist"

import { BrowserExtensionsPanel } from "../_components/browser-extensions-panel"

export const metadata: Metadata = {
  title: "Browser extension",
  description:
    "Download and install the Spotting capture extension for Chrome, Firefox, and Safari.",
}

export default async function BrowserExtensionSettingsPage() {
  const { organizations, session } = await getProtectedAuthData()

  if (!session) {
    redirect("/login")
  }

  if (organizations.length === 0) {
    redirect("/onboarding")
  }

  const availability = await extensionDownloadsAvailability()
  const chromeStoreUrl =
    process.env.NEXT_PUBLIC_BROWSER_EXTENSION_STORE_URL?.trim() || null
  const firefoxStoreUrl =
    process.env.NEXT_PUBLIC_FIREFOX_EXTENSION_STORE_URL?.trim() || null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl tracking-tight">Browser extension</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Download Spotting for your browser. Configure your API URL, dashboard URL, and{" "}
          <code className="text-xs">spk_…</code> public key in the extension popup.
        </p>
      </div>

      <BrowserExtensionsPanel
        availability={availability}
        chromeStoreUrl={chromeStoreUrl}
        firefoxStoreUrl={firefoxStoreUrl}
      />
    </div>
  )
}

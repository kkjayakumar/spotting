"use client"

import type { ReactNode } from "react"
import { Button } from "@spotting/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@spotting/ui/components/ui/card"
import { Download, ExternalLink, Puzzle } from "lucide-react"
import { toast } from "sonner"

import type { ExtensionTarget } from "@/lib/extension-dist"

type BrowserExtensionCardConfig = {
  target: ExtensionTarget
  title: string
  description: string
  downloadLabel: string
  storeUrl: string | null
  downloadAvailable: boolean
  installSteps: ReactNode
}

function readBrowserAuthToken(): string | null {
  try {
    return localStorage.getItem("spotting_token")
  } catch {
    return null
  }
}

function BrowserExtensionCard({
  title,
  description,
  downloadLabel,
  storeUrl,
  downloadAvailable,
  installSteps,
  target,
}: BrowserExtensionCardConfig) {
  const handleDownload = async () => {
    try {
      const token = readBrowserAuthToken()
      const res = await fetch(`/api/extension-download/${target}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (res.status === 401) {
        toast.error("Sign in again to download the extension.")
        return
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        toast.error(body?.error ?? `Download failed (${res.status})`)
        return
      }
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename="([^"]+)"/)
      const filename = match?.[1] ?? `spotting-extension-${target}.zip`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Download started.")
    } catch {
      toast.error("Could not download the extension package.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Puzzle className="size-5 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {storeUrl ? (
          <Button render={<a href={storeUrl} rel="noopener noreferrer" target="_blank" />}>
            <ExternalLink className="mr-2 size-4" />
            Install from store (permanent)
          </Button>
        ) : null}

        <div className="space-y-3">
          <p className="font-medium text-sm">Install from download</p>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground text-sm leading-relaxed">
            {installSteps}
          </ol>
          <Button
            disabled={!downloadAvailable}
            onClick={handleDownload}
            type="button"
            variant={storeUrl ? "outline" : "default"}
          >
            <Download className="mr-2 size-4" />
            {downloadLabel}
          </Button>
          {!downloadAvailable ? (
            <p className="text-muted-foreground text-xs">
              Build on the server first:{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                npm run build:{target} -w @spotting/extension
              </code>
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export type BrowserExtensionsPanelProps = {
  availability: Record<ExtensionTarget, boolean>
  chromeStoreUrl: string | null
  firefoxStoreUrl: string | null
}

export function BrowserExtensionsPanel({
  availability,
  chromeStoreUrl,
  firefoxStoreUrl,
}: BrowserExtensionsPanelProps) {
  return (
    <div className="space-y-6">
      <BrowserExtensionCard
        target="chrome"
        title="Chrome / Edge / Brave"
        description="Chromium-based browsers. Load unpacked for dev, or install from the store when published."
        downloadLabel="Download Chrome extension (ZIP)"
        storeUrl={chromeStoreUrl}
        downloadAvailable={availability.chrome}
        installSteps={
          <>
            <li>Download and unzip the package.</li>
            <li>
              Open <code className="text-xs">chrome://extensions</code> (or{" "}
              <code className="text-xs">edge://extensions</code>), enable{" "}
              <strong>Developer mode</strong>, then <strong>Load unpacked</strong> and
              select the folder containing <code className="text-xs">manifest.json</code>.
            </li>
            <li>
              Configure API URL, dashboard URL, and your <code className="text-xs">spk_…</code>{" "}
              key in the extension popup.
            </li>
          </>
        }
      />

      <BrowserExtensionCard
        target="firefox"
        title="Firefox"
        description="Permanent install requires a Mozilla-signed package (Add-ons site or signed XPI). Temporary dev install uses about:debugging."
        downloadLabel="Download Firefox extension (XPI)"
        storeUrl={firefoxStoreUrl}
        downloadAvailable={availability.firefox}
        installSteps={
          <>
            <li>
              <strong>Permanent (recommended):</strong> Submit the XPI to{" "}
              <a
                className="text-primary underline"
                href="https://addons.mozilla.org/developers/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Firefox Add-on Developer Hub
              </a>{" "}
              for signing, then install the signed file from{" "}
              <code className="text-xs">about:addons</code> → gear →{" "}
              <strong>Install Add-on From File…</strong>
            </li>
            <li>
              <strong>Or list on AMO</strong> so users install with one click (like Chrome Web
              Store).
            </li>
            <li>
              <strong>Temporary (dev/QA):</strong> Open{" "}
              <code className="text-xs">about:debugging#/runtime/this-firefox</code>, click{" "}
              <strong>Load Temporary Add-on…</strong>, and select{" "}
              <code className="text-xs">manifest.json</code> from the unzipped folder (removed
              when Firefox restarts).
            </li>
          </>
        }
      />

      <BrowserExtensionCard
        target="safari"
        title="Safari (macOS)"
        description="Safari requires an Xcode wrapper app. Download the Web Extension bundle, convert on a Mac, then distribute via App Store or signed notarization."
        downloadLabel="Download Safari extension (ZIP)"
        storeUrl={null}
        downloadAvailable={availability.safari}
        installSteps={
          <>
            <li>Download and unzip on a Mac with Xcode installed.</li>
            <li>
              Run{" "}
              <code className="text-xs">
                npm run safari:convert -w @spotting/extension
              </code>{" "}
              (see repo docs).
            </li>
            <li>Sign the generated app in Xcode and distribute via App Store or TestFlight.</li>
            <li>
              Enable the extension in Safari → Settings → Extensions after installation.
            </li>
          </>
        }
      />
    </div>
  )
}

"use client"

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

interface BrowserExtensionCardProps {
  storeUrl: string | null
  downloadAvailable: boolean
}

export function BrowserExtensionCard({
  storeUrl,
  downloadAvailable,
}: BrowserExtensionCardProps) {
  const handleDownload = async () => {
    try {
      const res = await fetch("/api/extension-zip", { credentials: "include" })
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
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "spotting-extension.zip"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Download started — unzip, then load the folder in your browser.")
    } catch {
      toast.error("Could not download the extension package.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Puzzle className="size-5 text-muted-foreground" />
          <CardTitle>Chromium browser extension</CardTitle>
        </div>
        <CardDescription>
          Capture bugs on any website (internal QA or third-party pages). Works in
          Chrome, Edge, Brave, Arc, Opera, and other Chromium-based browsers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {storeUrl ? (
          <div className="flex flex-wrap gap-2">
            <Button render={<a href={storeUrl} rel="noopener noreferrer" target="_blank" />}>
              <ExternalLink className="mr-2 size-4" />
              Install from store
            </Button>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="font-medium text-sm">Install from ZIP (unpacked)</p>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground text-sm leading-relaxed">
            <li>
              Build the extension once from the monorepo:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                bun run build:extension
              </code>
            </li>
            <li>
              Download the packaged folder as a ZIP using the button below (requires a
              recent build on this server).
            </li>
            <li>
              Unzip to a permanent folder (e.g.{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                spotting-extension
              </code>
              ).
            </li>
            <li>
              Open{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                chrome://extensions
              </code>{" "}
              or{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                edge://extensions
              </code>
              , turn on <strong>Developer mode</strong>, then{" "}
              <strong>Load unpacked</strong> and select the unzipped directory (the one
              that contains <code className="text-xs">manifest.json</code>).
            </li>
            <li>
              Open the Spotting popup, set <strong>API URL</strong> to the Hono backend
              (default <code className="text-xs">http://localhost:3000</code>),{" "}
              <strong>not</strong> the Next.js dashboard port (often{" "}
              <code className="text-xs">:3003</code>). Add your{" "}
              <code className="text-xs">crk_…</code> public key, save, then use{" "}
              <strong>Inject widget on this tab</strong>.
            </li>
          </ol>
          <Button
            disabled={!downloadAvailable}
            onClick={handleDownload}
            type="button"
            variant={storeUrl ? "outline" : "default"}
          >
            <Download className="mr-2 size-4" />
            Download extension (ZIP)
          </Button>
          {!downloadAvailable ? (
            <p className="text-muted-foreground text-xs">
              ZIP is unavailable until{" "}
              <code className="rounded bg-muted px-1 py-0.5">apps/extension/dist</code>{" "}
              exists on this machine (run{" "}
              <code className="rounded bg-muted px-1 py-0.5">bun run build:extension</code>{" "}
              from the repo root). You can still load unpacked from your local{" "}
              <code className="rounded bg-muted px-1 py-0.5">apps/extension/dist</code>{" "}
              folder.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

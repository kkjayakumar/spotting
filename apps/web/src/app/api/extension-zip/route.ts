import { authClient } from "@spotting/auth/client"
import { headers } from "next/headers"
import JSZip from "jszip"
import { access, readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"

async function resolveExtensionDistDir(): Promise<string | null> {
  const extra = process.env.SPOTTING_EXTENSION_DIST?.trim()
  const candidates = [
    extra && extra.length > 0 ? path.resolve(extra) : "",
    path.resolve(process.cwd(), "..", "extension", "dist"),
    path.resolve(process.cwd(), "extension-dist"),
  ].filter(Boolean)

  for (const dir of candidates) {
    try {
      await access(path.join(dir, "manifest.json"))
      return dir
    } catch {
      /* try next */
    }
  }
  return null
}

async function addDirectoryToZip(
  zip: JSZip,
  absoluteDir: string,
  zipPathPrefix: string
): Promise<void> {
  const entries = await readdir(absoluteDir, { withFileTypes: true })
  for (const entry of entries) {
    const abs = path.join(absoluteDir, entry.name)
    const zipEntry = zipPathPrefix
      ? `${zipPathPrefix}/${entry.name}`
      : entry.name
    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, abs, zipEntry)
    } else {
      zip.file(zipEntry, await readFile(abs))
    }
  }
}

export async function GET() {
  const h = await headers()
  const { data: session } = await authClient.getSession({
    fetchOptions: { headers: h },
  })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const distDir = await resolveExtensionDistDir()
  if (!distDir) {
    return NextResponse.json(
      {
        error:
          "Extension build not found. From the repo root run: bun run build:extension",
      },
      { status: 503 }
    )
  }

  const zip = new JSZip()
  await addDirectoryToZip(zip, distDir, "")
  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  })

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="spotting-extension.zip"',
      "Cache-Control": "no-store",
    },
  })
}

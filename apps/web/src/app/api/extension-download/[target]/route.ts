import JSZip from "jszip"
import { createReadStream } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"
import { NextResponse } from "next/server"

import {
  isExtensionTarget,
  resolveExtensionPackageFile,
  resolveExtensionTargetDir,
  type ExtensionTarget,
} from "@/lib/extension-dist"
import { fetchServerApi } from "@/lib/server-api-fetch"

async function addDirectoryToZip(
  zip: JSZip,
  absoluteDir: string,
  zipPathPrefix: string,
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

function downloadHeaders(filename: string, contentType: string) {
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  }
}

async function zipTargetDir(target: ExtensionTarget) {
  const distDir = await resolveExtensionTargetDir(target)
  if (!distDir) {
    return null
  }

  const zip = new JSZip()
  await addDirectoryToZip(zip, distDir, "")
  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  })

  const filename =
    target === "chrome"
      ? "spotting-extension-chrome.zip"
      : target === "firefox"
        ? "spotting-extension-firefox.zip"
        : "spotting-extension-safari.zip"

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: downloadHeaders(filename, "application/zip"),
  })
}

async function servePackageFile(target: ExtensionTarget) {
  const filePath = await resolveExtensionPackageFile(target)
  if (!filePath) {
    return null
  }

  const filename = path.basename(filePath)
  const contentType =
    target === "firefox"
      ? "application/x-xpinstall"
      : "application/zip"

  const stream = createReadStream(filePath)
  const body = Readable.toWeb(stream) as ReadableStream<Uint8Array>

  return new NextResponse(body, {
    status: 200,
    headers: downloadHeaders(filename, contentType),
  })
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ target: string }> },
) {
  const { target: rawTarget } = await context.params
  if (!isExtensionTarget(rawTarget)) {
    return NextResponse.json({ error: "Invalid browser target." }, { status: 400 })
  }

  try {
    const session = (await fetchServerApi("/v1/auth/me")) as { id?: string } | null
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const packaged = await servePackageFile(rawTarget)
  if (packaged) {
    return packaged
  }

  const zipped = await zipTargetDir(rawTarget)
  if (zipped) {
    return zipped
  }

  return NextResponse.json(
    {
      error: `Extension build not found for ${rawTarget}. From the repo root run: npm run build:${rawTarget} -w @spotting/extension`,
    },
    { status: 503 },
  )
}

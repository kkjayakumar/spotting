import { access } from "node:fs/promises"
import path from "node:path"

export type ExtensionTarget = "chrome" | "firefox" | "safari"

const TARGETS: ExtensionTarget[] = ["chrome", "firefox", "safari"]

export function isExtensionTarget(value: string): value is ExtensionTarget {
  return TARGETS.includes(value as ExtensionTarget)
}

function appPaths(): { root: string; extensionBase: string } {
  const cwd = process.cwd()
  const inWebWorkspace =
    cwd.endsWith(`${path.sep}apps${path.sep}web`) ||
    cwd.endsWith("apps/web")
  const root = inWebWorkspace ? path.resolve(cwd, "..", "..") : cwd
  return {
    root,
    extensionBase: path.join(root, "apps", "extension"),
  }
}

/** Resolve unpacked extension build for a browser target (manifest.json must exist). */
export async function resolveExtensionTargetDir(
  target: ExtensionTarget,
): Promise<string | null> {
  const extra = process.env.SPOTTING_EXTENSION_DIST?.trim()
  const { extensionBase } = appPaths()
  const candidates = [
    extra && target === "chrome" && extra.length > 0 ? path.resolve(extra) : "",
    path.join(extensionBase, "dist-targets", target),
    path.join(extensionBase, "dist"),
    path.resolve(process.cwd(), "extension-dist", target),
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

/** Pre-built package file from `npm run package:*` (release artifacts). */
export async function resolveExtensionPackageFile(
  target: ExtensionTarget,
): Promise<string | null> {
  const { extensionBase } = appPaths()
  const names: Record<ExtensionTarget, string> = {
    chrome: "spotting-extension-chrome.zip",
    firefox: "spotting-extension-firefox.xpi",
    safari: "spotting-extension-safari.zip",
  }
  const candidates = [
    path.join(extensionBase, "dist-packages", names[target]),
  ]

  for (const filePath of candidates) {
    try {
      await access(filePath)
      return filePath
    } catch {
      /* try next */
    }
  }
  return null
}

export async function extensionTargetExists(
  target: ExtensionTarget,
): Promise<boolean> {
  const packaged = await resolveExtensionPackageFile(target)
  if (packaged) return true
  return (await resolveExtensionTargetDir(target)) != null
}

export async function extensionDistExists(): Promise<boolean> {
  return extensionTargetExists("chrome")
}

export async function extensionDownloadsAvailability(): Promise<
  Record<ExtensionTarget, boolean>
> {
  const [chrome, firefox, safari] = await Promise.all(
    TARGETS.map((target) => extensionTargetExists(target)),
  )
  return { chrome, firefox, safari }
}

import { access } from "node:fs/promises"
import path from "node:path"

/** Resolve the built Chrome extension dist directory (manifest.json must exist). */
export async function resolveExtensionDistDir(): Promise<string | null> {
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

export async function extensionDistExists(): Promise<boolean> {
  return (await resolveExtensionDistDir()) != null
}

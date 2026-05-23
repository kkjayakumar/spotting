import { env } from "@spotting/env/web"

/** Suggested allowed origins for new capture keys (widget host pages, not the API). */
export function getDefaultCaptureOrigins(): string[] {
  const origins = new Set<string>()

  const add = (url: string) => {
    try {
      origins.add(new URL(url).origin)
    } catch {
      /* ignore invalid */
    }
  }

  add(env.NEXT_PUBLIC_APP_URL)
  add(env.NEXT_PUBLIC_SITE_URL)

  // Common local dev hosts (dashboard + API are different ports).
  add("http://localhost:3003")
  add("http://127.0.0.1:3003")
  add("http://localhost:3001")
  add("http://127.0.0.1:3001")

  return [...origins]
}

import { env } from "@spotting/env/web"
import { initPostHog } from "@spotting/shared/lib/posthog"

initPostHog({
  key: env.NEXT_PUBLIC_POSTHOG_KEY,
  host: env.NEXT_PUBLIC_POSTHOG_HOST,
})

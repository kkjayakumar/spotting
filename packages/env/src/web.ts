import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

/** Local dev / CI defaults when env vars are not injected (e.g. `bun run verify`). */
const DEFAULT_SITE_URL = "http://localhost:3003"
const DEFAULT_APP_URL = "http://localhost:3003"
const DEFAULT_SERVER_URL = "http://localhost:3000"

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SITE_URL: z.url().default(DEFAULT_SITE_URL),
    NEXT_PUBLIC_APP_URL: z.url().default(DEFAULT_APP_URL),
    NEXT_PUBLIC_SERVER_URL: z.url().default(DEFAULT_SERVER_URL),
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    NEXT_PUBLIC_Spotting_KEY: z.string().optional(),
    NEXT_PUBLIC_DEMO_URL: z.url().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED:
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED,
    NEXT_PUBLIC_Spotting_KEY: process.env.NEXT_PUBLIC_Spotting_KEY,
    NEXT_PUBLIC_DEMO_URL: process.env.NEXT_PUBLIC_DEMO_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  emptyStringAsUndefined: true,
})


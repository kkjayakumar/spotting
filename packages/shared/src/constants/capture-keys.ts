export const CAPTURE_KEY_PREFIX = "spk_" as const
export const CAPTURE_KEY_LIVE_PREFIX = "spk_live_" as const
export const LEGACY_CAPTURE_KEY_PREFIX = "crk_" as const

export type CaptureKeyPolicy = { allowLegacy?: boolean }

function captureKeyPattern(options?: CaptureKeyPolicy): RegExp {
  const allowLegacy = options?.allowLegacy !== false
  const prefix = allowLegacy ? "(?:spk_|crk_)" : "spk_"
  return new RegExp(`^${prefix}[a-zA-Z0-9_-]+$`)
}

export function captureBearerPattern(options?: CaptureKeyPolicy): RegExp {
  const allowLegacy = options?.allowLegacy !== false
  const prefix = allowLegacy ? "(?:spk_|crk_)" : "spk_"
  return new RegExp(`^Bearer\\s+(${prefix}[a-zA-Z0-9_-]+)$`)
}

export function isCapturePublicKey(token: string, options?: CaptureKeyPolicy): boolean {
  return captureKeyPattern(options).test(token)
}

export function isLegacyCapturePublicKey(token: string): boolean {
  return token.startsWith(LEGACY_CAPTURE_KEY_PREFIX)
}

export function generateCapturePublicKeyToken(): string {
  const id = globalThis.crypto.randomUUID().replace(/-/g, "")
  return `${CAPTURE_KEY_LIVE_PREFIX}${id}`
}

export function normalizeCapturePublicKeyInput(key: string, options?: CaptureKeyPolicy): string | null {
  const trimmed = key.trim()
  return isCapturePublicKey(trimmed, options) ? trimmed : null
}

export function capturePublicKeyValidationMessage(options?: CaptureKeyPolicy): string {
  if (options?.allowLegacy === false) {
    return "Public key must start with spk_ (e.g. spk_live_…)."
  }
  return "Public key must start with spk_ (legacy crk_ keys still work during migration)."
}

export function legacyCaptureKeysAllowedFromEnv(
  env?: Record<string, string | undefined>,
): boolean {
  const source =
    env ??
    (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process?.env ??
    {}
  return source.SPOTTING_ACCEPT_LEGACY_CRK_KEYS !== "false"
}

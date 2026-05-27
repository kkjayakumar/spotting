const ORIGIN_DELIMITER = /\r?\n|,/

export function parseCaptureOrigins(raw: string): string[] {
  const segments = raw
    .split(ORIGIN_DELIMITER)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

  return Array.from(new Set(segments))
}

export function serializeCaptureOrigins(origins: readonly string[]): string {
  return origins.join("\n")
}

/** @deprecated Use parseCaptureOrigins */
export const parsePublicKeyOrigins = parseCaptureOrigins

/** @deprecated Use serializeCaptureOrigins */
export const formatPublicKeyOrigins = serializeCaptureOrigins

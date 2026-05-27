export function extractRequestErrorMessage(error: unknown): string {
  if (error === null || error === undefined || typeof error !== "object") {
    return "Unknown error"
  }

  if ("message" in error && typeof error.message === "string") {
    const trimmed = error.message.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }

  if ("statusText" in error && typeof error.statusText === "string") {
    const trimmed = error.statusText.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }

  if ("code" in error && typeof error.code === "string") {
    return error.code
  }

  return "Unknown error"
}

/** @deprecated Use extractRequestErrorMessage */
export const getRequestErrorMessage = extractRequestErrorMessage

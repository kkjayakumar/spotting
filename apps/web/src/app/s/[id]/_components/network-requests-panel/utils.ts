import { reportNonFatalError } from "@spotting/shared/lib/errors"
import type { BodyPreview, DetailSection, KeyValueItem } from "./types"

const FORM_DATA_PATTERN = /^[^=&?#]+=[^=&]*(&[^=&?#]+=[^=&]*)*$/

export const DETAIL_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "request", label: "Request" },
  { id: "response", label: "Response" },
] as const satisfies ReadonlyArray<{ id: DetailSection; label: string }>

export function safeParseUrl(value: string | undefined): URL | null {
  if (!value) {
    return null
  }

  try {
    return new URL(value)
  } catch (error) {
    reportNonFatalError(
      "Failed to parse network request URL",
      { error, value },
      {
        once: true,
      }
    )
    return null
  }
}

export function statusTone(status: number): string {
  if (status >= 200 && status < 300) {
    return "text-green-500 font-semibold"
  }

  if (status >= 300 && status < 400) {
    return "text-blue-500 font-semibold"
  }

  if (status >= 400 && status < 500) {
    return "text-red-500 font-semibold"
  }

  if (status >= 500) {
    return "text-red-600 font-bold"
  }

  return "text-muted-foreground"
}

export function asKeyValueItems(
  value: Record<string, string> | null
): KeyValueItem[] {
  if (!value) {
    return []
  }

  return Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entryValue], index) => {
      return { id: `${key}-${index}`, key, value: entryValue }
    })
}

export function getQueryParams(url: string): KeyValueItem[] {
  const parsedUrl = safeParseUrl(url)
  if (!parsedUrl) {
    return []
  }

  const params: KeyValueItem[] = []
  let index = 0

  for (const [key, value] of parsedUrl.searchParams.entries()) {
    params.push({ id: `${key}-${index}`, key, value })
    index += 1
  }

  return params
}

export function getBodyParams(requestBody: string | null): KeyValueItem[] {
  if (!requestBody) {
    return []
  }

  const trimmed = requestBody.trim()
  if (!trimmed) {
    return []
  }

  const jsonParams = parseJsonParams(trimmed)
  if (jsonParams.length > 0) {
    return jsonParams
  }

  const formParams = parseFormParams(trimmed)
  if (formParams.length > 0) {
    return formParams
  }

  return []
}

export function formatBody(value: string | null): BodyPreview | null {
  if (!value) {
    return null
  }

  const raw = value.trim()
  if (!raw) {
    return null
  }

  if (!looksLikeJson(raw)) {
    return { raw, formatted: raw }
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      raw,
      formatted: JSON.stringify(parsed, null, 2),
    }
  } catch {
    return { raw, formatted: raw }
  }
}

function parseJsonParams(value: string): KeyValueItem[] {
  if (!looksLikeJsonObject(value)) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (!isRecord(parsed)) {
      return []
    }

    return Object.entries(parsed).map(([key, entryValue], index) => {
      return {
        id: `${key}-${index}`,
        key,
        value: stringifyScalar(entryValue),
      }
    })
  } catch {
    return []
  }
}

function parseFormParams(value: string): KeyValueItem[] {
  const looksLikeFormData = FORM_DATA_PATTERN.test(value)
  if (!looksLikeFormData) {
    return []
  }

  const params = new URLSearchParams(value)
  const result: KeyValueItem[] = []
  let index = 0

  for (const [key, entryValue] of params.entries()) {
    result.push({ id: `${key}-${index}`, key, value: entryValue })
    index += 1
  }

  return result
}

function stringifyScalar(value: unknown): string {
  if (typeof value === "string") {
    return value
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch (error) {
    reportNonFatalError(
      "Failed to stringify non-scalar request body param value",
      error,
      { once: true }
    )
    return "[unserializable]"
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function looksLikeJson(value: string): boolean {
  const firstChar = value[0]
  return (
    firstChar === "{" ||
    firstChar === "[" ||
    firstChar === '"' ||
    firstChar === "-" ||
    (firstChar >= "0" && firstChar <= "9") ||
    value.startsWith("true") ||
    value.startsWith("false") ||
    value.startsWith("null")
  )
}

function looksLikeJsonObject(value: string): boolean {
  return value.startsWith("{")
}

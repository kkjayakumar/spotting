export function toggleInSet<T extends string>(current: T[], value: T): T[] {
  if (current.includes(value)) {
    return current.filter((entry) => entry !== value)
  }
  return [...current, value]
}

export function splitBulkTags(raw: string): string[] {
  const normalized = raw
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

  return Array.from(new Set(normalized))
}

/** @deprecated Use toggleInSet */
export const toggleValue = toggleInSet

/** @deprecated Use splitBulkTags */
export const parseTagInput = splitBulkTags

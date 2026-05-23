/** Stable date text for SSR + client (avoids locale/timezone hydration mismatches). */
export function formatMediumDateUtc(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "—"
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parsed)
}

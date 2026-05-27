/**
 * Spotting organization slug utilities.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function toSlugSegments(name: string): string[] {
  return collapseWhitespace(name)
    .toLowerCase()
    .split(" ")
    .flatMap((segment) => segment.split(/[^a-z0-9]+/))
    .filter((segment) => segment.length > 0)
}

export function slugifyOrganizationName(name: string): string {
  return toSlugSegments(name).join("-").replace(/-+/g, "-").replace(/^-|-$/g, "")
}

export function shouldAutoSyncOrganizationSlug(
  currentSlug: string,
  previousName: string
): boolean {
  if (currentSlug.length === 0) {
    return true
  }

  return currentSlug === slugifyOrganizationName(previousName)
}

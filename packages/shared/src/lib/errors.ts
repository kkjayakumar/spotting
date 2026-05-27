/**
 * Spotting non-fatal error helpers.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface SpottingNonFatalLogOptions {
  /** Log at most once per context label for the lifetime of this module. */
  dedupe?: boolean
  /** @deprecated Use dedupe */
  once?: boolean
}

const seenContextLabels = new Set<string>()

function shouldSkipDuplicate(context: string, dedupe?: boolean): boolean {
  if (!dedupe) {
    return false
  }

  if (seenContextLabels.has(context)) {
    return true
  }

  seenContextLabels.add(context)
  return false
}

export function reportNonFatalError(
  context: string,
  error: unknown,
  options?: SpottingNonFatalLogOptions
): void {
  const dedupe = options?.dedupe ?? options?.once ?? false

  if (shouldSkipDuplicate(context, dedupe)) {
    return
  }

  console.warn(`[Spotting non-fatal] ${context}`, error)
}

type CodedError = Error & { code?: unknown }

export function isErrorWithCode(
  error: unknown,
  expectedCode: string
): error is CodedError {
  if (!(error instanceof Error)) {
    return false
  }

  if (!("code" in error)) {
    return false
  }

  return (error as CodedError).code === expectedCode
}

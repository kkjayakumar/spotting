/**
 * Spotting Postgres unique-constraint retry helper.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { isErrorWithCode } from "../errors"

const PG_UNIQUE_VIOLATION = "23505"
const DEFAULT_ATTEMPTS = 3

export interface UniqueViolationRetryOptions {
  maxAttempts?: number
}

export function isPostgresUniqueViolationError(error: unknown): boolean {
  return isErrorWithCode(error, PG_UNIQUE_VIOLATION)
}

export async function retryOnUniqueViolation<T>(
  task: () => Promise<T>,
  options?: UniqueViolationRetryOptions
): Promise<T> {
  const attempts = options?.maxAttempts ?? DEFAULT_ATTEMPTS

  for (let tryIndex = 1; tryIndex <= attempts; tryIndex += 1) {
    try {
      return await task()
    } catch (error) {
      const isLastTry = tryIndex === attempts
      if (isLastTry || !isPostgresUniqueViolationError(error)) {
        throw error
      }
    }
  }

  throw new Error("retryOnUniqueViolation: exhausted attempts without result")
}

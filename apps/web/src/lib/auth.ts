/**
 * Spotting auth form helpers.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const AUTH_MIN_PASSWORD_LENGTH = 8

const DEFAULT_AUTH_ERROR = "Something went wrong. Please try again."

function readMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }

  if (value instanceof Error && value.message.trim().length > 0) {
    return value.message
  }

  if (typeof value === "object" && value !== null && "message" in value) {
    const message = (value as { message?: unknown }).message
    if (typeof message === "string" && message.trim().length > 0) {
      return message
    }
  }

  return null
}

export function getAuthErrorMessage(
  error: unknown,
  fallbackMessage: string = DEFAULT_AUTH_ERROR
): string {
  if (!error) {
    return fallbackMessage
  }

  return readMessage(error) ?? fallbackMessage
}

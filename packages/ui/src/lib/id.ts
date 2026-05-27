/**
 * Spotting identifier generator.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { customAlphabet } from "nanoid"

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

const PREFIX_REGISTRY: Record<string, string> = {}

type GenerateIdOptions = {
  length?: number
  separator?: string
}

export function generateId(
  prefixOrOptions?: keyof typeof PREFIX_REGISTRY | GenerateIdOptions,
  options: GenerateIdOptions = {}
): string {
  const resolvedOptions =
    typeof prefixOrOptions === "object" ? prefixOrOptions : options
  const prefixKey =
    typeof prefixOrOptions === "object" ? undefined : prefixOrOptions

  const length = resolvedOptions.length ?? 12
  const separator = resolvedOptions.separator ?? "_"
  const randomPart = customAlphabet(ALPHABET, length)()

  if (prefixKey && prefixKey in PREFIX_REGISTRY) {
    return `${PREFIX_REGISTRY[prefixKey]}${separator}${randomPart}`
  }

  return randomPart
}

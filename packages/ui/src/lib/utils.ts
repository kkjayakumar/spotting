/**
 * Spotting Tailwind class merge helper.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...classNames: ClassValue[]): string {
  return twMerge(clsx(classNames))
}

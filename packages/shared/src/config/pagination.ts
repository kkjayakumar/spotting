/**
 * Spotting list pagination defaults.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const

export const paginationConfig = {
  defaultPage: 1,
  defaultPageSize: PAGE_SIZE_OPTIONS[0],
  maxPageSize: 100,
  pageSizeOptions: [...PAGE_SIZE_OPTIONS],
} as const

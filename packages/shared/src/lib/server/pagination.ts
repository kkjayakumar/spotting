/**
 * Spotting server-side pagination helpers.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { z } from "zod"
import { paginationConfig } from "../../config/pagination"

const paginationInputSchema = z
  .object({
    page: z.number().int().positive().optional(),
    perPage: z.number().int().positive().optional(),
  })
  .optional()

export const paginationParamsSchema = paginationInputSchema

export type PaginationParams = z.infer<typeof paginationParamsSchema>

export interface PaginationMeta {
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  totalItems: number
}

export interface PaginatedResult<TItem> {
  items: TItem[]
  pagination: PaginationMeta
}

function positiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return fallback
  }

  return Math.floor(value)
}

export function normalizePaginationParams(
  params: PaginationParams | undefined
): { page: number; perPage: number; offset: number; limit: number } {
  const page = positiveInt(params?.page, paginationConfig.defaultPage)
  const perPage = positiveInt(
    params?.perPage,
    paginationConfig.defaultPageSize
  )

  return {
    page,
    perPage,
    offset: (page - 1) * perPage,
    limit: perPage,
  }
}

export function buildPaginationMeta(
  totalCount: number,
  page: number,
  perPage: number
): PaginationMeta {
  const totalItems = Number.isFinite(totalCount) && totalCount >= 0 ? totalCount : 0
  const totalPages = perPage > 0 ? Math.max(1, Math.ceil(totalItems / perPage)) : 1
  const safePage = Math.min(Math.max(page, 1), totalPages)

  return {
    page: safePage,
    pageSize: perPage,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  }
}

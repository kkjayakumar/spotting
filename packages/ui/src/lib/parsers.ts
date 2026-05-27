/**
 * Spotting data-table URL state parsers.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createParser } from "nuqs/server"
import { z } from "zod"

import { dataTableConfig } from "../config/data-table"
import type {
  ExtendedColumnFilter,
  ExtendedColumnSort,
} from "../types/data-table"

const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
})

function toValidKeySet(keys?: string[] | Set<string>): Set<string> | null {
  if (!keys) {
    return null
  }

  return keys instanceof Set ? keys : new Set(keys)
}

function sortsEqual<TData>(
  left: ExtendedColumnSort<TData>[],
  right: ExtendedColumnSort<TData>[]
): boolean {
  if (left.length !== right.length) {
    return false
  }

  return left.every(
    (item, index) =>
      item.id === right[index]?.id && item.desc === right[index]?.desc
  )
}

export const getSortingStateParser = <TData>(
  columnIds?: string[] | Set<string>
) => {
  const validKeys = toValidKeySet(columnIds)

  return createParser({
    parse: (raw) => {
      try {
        const parsed = JSON.parse(raw)
        const result = z.array(sortItemSchema).safeParse(parsed)
        if (!result.success) {
          return null
        }

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null
        }

        return result.data as ExtendedColumnSort<TData>[]
      } catch {
        return null
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) => sortsEqual(a, b),
  })
}

const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
})

export type FilterItemSchema = z.infer<typeof filterItemSchema>

function filtersEqual<TData>(
  left: ExtendedColumnFilter<TData>[],
  right: ExtendedColumnFilter<TData>[]
): boolean {
  if (left.length !== right.length) {
    return false
  }

  return left.every(
    (filter, index) =>
      filter.id === right[index]?.id &&
      filter.value === right[index]?.value &&
      filter.variant === right[index]?.variant &&
      filter.operator === right[index]?.operator
  )
}

export const getFiltersStateParser = <TData>(
  columnIds?: string[] | Set<string>
) => {
  const validKeys = toValidKeySet(columnIds)

  return createParser({
    parse: (raw) => {
      try {
        const parsed = JSON.parse(raw)
        const result = z.array(filterItemSchema).safeParse(parsed)
        if (!result.success) {
          return null
        }

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null
        }

        return result.data as ExtendedColumnFilter<TData>[]
      } catch {
        return null
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) => filtersEqual(a, b),
  })
}

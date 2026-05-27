/**
 * Spotting data-table helpers.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Column } from "@tanstack/react-table"

import { dataTableConfig } from "../config/data-table"
import type {
  ExtendedColumnFilter,
  FilterOperator,
  FilterVariant,
} from "../types/data-table"

const OPERATOR_MAP: Record<
  FilterVariant,
  { label: string; value: FilterOperator }[]
> = {
  text: dataTableConfig.textOperators,
  number: dataTableConfig.numericOperators,
  range: dataTableConfig.numericOperators,
  date: dataTableConfig.dateOperators,
  dateRange: dataTableConfig.dateOperators,
  boolean: dataTableConfig.booleanOperators,
  select: dataTableConfig.selectOperators,
  multiSelect: dataTableConfig.multiSelectOperators,
}

function pinnedColumnShadow<TData>(
  column: Column<TData>,
  withBorder: boolean
): string | undefined {
  if (!withBorder) {
    return undefined
  }

  const pinSide = column.getIsPinned()
  if (pinSide === "left" && column.getIsLastColumn("left")) {
    return "-4px 0 4px -4px var(--border) inset"
  }

  if (pinSide === "right" && column.getIsFirstColumn("right")) {
    return "4px 0 4px -4px var(--border) inset"
  }

  return undefined
}

export function getColumnPinningStyle<TData>({
  column,
  withBorder = false,
}: {
  column: Column<TData>
  withBorder?: boolean
}): React.CSSProperties {
  const pinned = column.getIsPinned()

  return {
    boxShadow: pinnedColumnShadow(column, withBorder),
    left: pinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: pinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: pinned ? 0.97 : 1,
    position: pinned ? "sticky" : "relative",
    background: "var(--background)",
    width: column.getSize(),
    zIndex: pinned ? 1 : undefined,
  }
}

export function getFilterOperators(filterVariant: FilterVariant) {
  return OPERATOR_MAP[filterVariant] ?? dataTableConfig.textOperators
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
  const operators = getFilterOperators(filterVariant)
  return operators[0]?.value ?? (filterVariant === "text" ? "iLike" : "eq")
}

function filterHasValue<TData>(filter: ExtendedColumnFilter<TData>): boolean {
  if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
    return true
  }

  if (Array.isArray(filter.value)) {
    return filter.value.length > 0
  }

  return (
    filter.value !== "" && filter.value !== null && filter.value !== undefined
  )
}

export function getValidFilters<TData>(
  filters: ExtendedColumnFilter<TData>[]
): ExtendedColumnFilter<TData>[] {
  return filters.filter(filterHasValue)
}

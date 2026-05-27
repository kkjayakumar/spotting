"use client"

import {
  BUG_REPORT_SORT_OPTIONS,
  BUG_REPORT_STATUS_OPTIONS,
  BUG_REPORT_VISIBILITY_OPTIONS,
  type BugReportSort,
  type BugReportStatus,
  type BugReportVisibility,
} from "@spotting/shared/constants/bug-report"
import {
  PRIORITY_OPTIONS,
  type Priority,
} from "@spotting/shared/constants/priorities"
import { useDebounce } from "@spotting/ui/hooks/use-debounce"
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"
import { useEffect, useMemo, useState } from "react"

import {
  CLEARED_REPORT_FILTERS,
  type ReportListFilters,
} from "../lib/filter-options"
import { toggleInSet } from "../lib/list-helpers"

const STATUS_LITERALS = [
  BUG_REPORT_STATUS_OPTIONS.open,
  BUG_REPORT_STATUS_OPTIONS.inProgress,
  BUG_REPORT_STATUS_OPTIONS.resolved,
  BUG_REPORT_STATUS_OPTIONS.closed,
] as const satisfies readonly BugReportStatus[]

const PRIORITY_LITERALS = [
  PRIORITY_OPTIONS.critical,
  PRIORITY_OPTIONS.high,
  PRIORITY_OPTIONS.medium,
  PRIORITY_OPTIONS.low,
  PRIORITY_OPTIONS.none,
] as const satisfies readonly Priority[]

const VISIBILITY_LITERALS = [
  BUG_REPORT_VISIBILITY_OPTIONS.private,
  BUG_REPORT_VISIBILITY_OPTIONS.public,
] as const satisfies readonly BugReportVisibility[]

const SORT_LITERALS = [
  BUG_REPORT_SORT_OPTIONS.newest,
  BUG_REPORT_SORT_OPTIONS.oldest,
  BUG_REPORT_SORT_OPTIONS.updated,
  BUG_REPORT_SORT_OPTIONS.priorityHigh,
  BUG_REPORT_SORT_OPTIONS.priorityLow,
] as const satisfies readonly BugReportSort[]

export function useReportsUrlFilters() {
  const [query, setQuery] = useQueryStates(
    {
      search: parseAsString
        .withOptions({ clearOnDefault: true })
        .withDefault(""),
      sort: parseAsStringLiteral(SORT_LITERALS)
        .withOptions({ clearOnDefault: true })
        .withDefault(BUG_REPORT_SORT_OPTIONS.newest),
      groupId: parseAsString
        .withOptions({ clearOnDefault: true })
        .withDefault(""),
      statuses: parseAsArrayOf(parseAsStringLiteral(STATUS_LITERALS))
        .withOptions({ clearOnDefault: true })
        .withDefault([]),
      priorities: parseAsArrayOf(parseAsStringLiteral(PRIORITY_LITERALS))
        .withOptions({ clearOnDefault: true })
        .withDefault([]),
      visibilities: parseAsArrayOf(parseAsStringLiteral(VISIBILITY_LITERALS))
        .withOptions({ clearOnDefault: true })
        .withDefault([]),
    },
    { history: "replace", shallow: false }
  )

  const [searchDraft, setSearchDraft] = useState(query.search)
  const debouncedSearch = useDebounce(searchDraft)

  useEffect(() => {
    setSearchDraft(query.search)
  }, [query.search])

  useEffect(() => {
    if (debouncedSearch === query.search) {
      return
    }
    setQuery({ search: debouncedSearch }).catch(() => undefined)
  }, [debouncedSearch, query.search, setQuery])

  const filters = useMemo<ReportListFilters>(
    () => ({
      statuses: query.statuses,
      priorities: query.priorities,
      visibilities: query.visibilities,
    }),
    [query.statuses, query.priorities, query.visibilities]
  )

  const selectedGroupId = query.groupId.length > 0 ? query.groupId : null

  const facetCount =
    filters.statuses.length +
    filters.priorities.length +
    filters.visibilities.length

  return {
    searchValue: searchDraft,
    setSearchValue: setSearchDraft,
    debouncedSearch,
    sort: query.sort,
    selectedGroupId,
    setSelectedGroupId: (groupId: string | null) => {
      setQuery({ groupId: groupId ?? "" }).catch(() => undefined)
    },
    setSort: (value: BugReportSort) => {
      setQuery({ sort: value }).catch(() => undefined)
    },
    filters,
    clearFilters: () => {
      setQuery({
        statuses: CLEARED_REPORT_FILTERS.statuses,
        priorities: CLEARED_REPORT_FILTERS.priorities,
        visibilities: CLEARED_REPORT_FILTERS.visibilities,
      }).catch(() => undefined)
    },
    resetFiltersAndSearch: () => {
      setSearchDraft("")
      setQuery({
        search: "",
        groupId: "",
        statuses: CLEARED_REPORT_FILTERS.statuses,
        priorities: CLEARED_REPORT_FILTERS.priorities,
        visibilities: CLEARED_REPORT_FILTERS.visibilities,
      }).catch(() => undefined)
    },
    hasActiveFilters:
      facetCount > 0 || debouncedSearch.length > 0 || selectedGroupId !== null,
    toggleStatus: (value: ReportListFilters["statuses"][number]) =>
      setQuery({ statuses: toggleInSet(filters.statuses, value) }).catch(
        () => undefined
      ),
    togglePriority: (value: ReportListFilters["priorities"][number]) =>
      setQuery({ priorities: toggleInSet(filters.priorities, value) }).catch(
        () => undefined
      ),
    toggleVisibility: (value: ReportListFilters["visibilities"][number]) =>
      setQuery({
        visibilities: toggleInSet(filters.visibilities, value),
      }).catch(() => undefined),
  }
}

/** @deprecated Use useReportsUrlFilters */
export const useBugReportsFilters = useReportsUrlFilters

"use client"

import type { BugReportSort } from "@spotting/shared/constants/bug-report"
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useRef } from "react"

import { fetchApi, reportQueries } from "@/lib/api"
import { REPORTS_PAGE_SIZE } from "../constants"
import type { ReportListFilters } from "../lib/filter-options"
import type { ReportListPage } from "../types"

interface UseReportsInfiniteQueryInput {
  search: string
  sort: BugReportSort
  filters: ReportListFilters
  groupId: string | null
}

function buildReportsListPath(page: number, groupId: string | null) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(REPORTS_PAGE_SIZE),
  })
  if (groupId) {
    params.set("groupId", groupId)
  }
  return `/v1/reports?${params.toString()}`
}

export function useReportsInfiniteQuery({
  search,
  sort,
  filters,
  groupId,
}: UseReportsInfiniteQueryInput) {
  const queryClient = useQueryClient()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const listQuery = useInfiniteQuery({
    queryKey: [
      "spotting.reports.list",
      search,
      sort,
      filters,
      groupId,
      REPORTS_PAGE_SIZE,
    ],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const payload = (await fetchApi(
        buildReportsListPath(pageParam, groupId)
      )) as ReportListPage | null

      if (!payload) {
        return {
          items: [],
          page: pageParam,
          pageSize: REPORTS_PAGE_SIZE,
          total: 0,
          totalPages: 1,
        } satisfies ReportListPage
      }

      return payload
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })

  const statsQuery = useQuery(
    reportQueries.bugReport.getDashboardStats.queryOptions()
  )

  const reports = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data]
  )

  useEffect(() => {
    const node = sentinelRef.current
    if (!(node && listQuery.hasNextPage) || listQuery.isFetchingNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          listQuery.fetchNextPage()
        }
      },
      { rootMargin: "300px 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [
    listQuery.fetchNextPage,
    listQuery.hasNextPage,
    listQuery.isFetchingNextPage,
  ])

  const refreshAll = async () => {
    await Promise.all([
      listQuery.refetch(),
      statsQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: ["spotting.report-groups"] }),
    ])
  }

  return {
    sentinelRef,
    reports,
    stats: statsQuery.data,
    refreshAll,
    isError: listQuery.isError,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    errorMessage: listQuery.error?.message,
    refetch: listQuery.refetch,
  }
}

/** @deprecated Use useReportsInfiniteQuery */
export const useBugReportsData = useReportsInfiniteQuery

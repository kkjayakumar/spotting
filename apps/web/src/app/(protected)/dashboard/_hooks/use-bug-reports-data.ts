"use client"

import type { BugReportSort } from "@spotting/shared/constants/bug-report"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef } from "react"

import type { BugReportListResponse } from "../_components/bug-reports/types"
import type { DashboardFilters } from "../_components/bug-reports/filters"
import { fetchApi, orpc } from "@/utils/orpc"

const PAGE_SIZE = 12

interface UseBugReportsDataInput {
  search: string
  sort: BugReportSort
  filters: DashboardFilters
}

export function useBugReportsData({
  search,
  sort,
  filters,
}: UseBugReportsDataInput) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const query = useInfiniteQuery({
    queryKey: ["bugReport.list", search, sort, filters, PAGE_SIZE],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const data = (await fetchApi(
        `/v1/reports?page=${pageParam}&pageSize=${PAGE_SIZE}`
      )) as BugReportListResponse | null
      if (!data) {
        return {
          items: [],
          page: pageParam,
          pageSize: PAGE_SIZE,
          total: 0,
          totalPages: 1,
        } satisfies BugReportListResponse
      }
      return data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
  })

  const statsQuery = useQuery(orpc.bugReport.getDashboardStats.queryOptions())

  const reports = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  )

  useEffect(() => {
    const target = loadMoreRef.current
    if (!(target && query.hasNextPage) || query.isFetchingNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          query.fetchNextPage()
        }
      },
      { rootMargin: "300px 0px" }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage])

  const refetchAll = async () => {
    await Promise.all([query.refetch(), statsQuery.refetch()])
  }

  return {
    loadMoreRef,
    reports,
    stats: statsQuery.data,
    refetchAll,
    isError: query.isError,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    errorMessage: query.error?.message,
    refetch: query.refetch,
  }
}

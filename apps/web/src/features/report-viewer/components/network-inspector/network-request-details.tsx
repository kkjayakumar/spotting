"use client"

/**
 * Spotting network request detail (devtools-style: Headers / Request / Response).
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { reportNonFatalError } from "@spotting/shared/lib/errors"
import { cn } from "@spotting/ui/lib/utils"
import { useQuery } from "@tanstack/react-query"
import {
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { type ReactNode, useState } from "react"

import { reportQueries } from "@/lib/api"
import { PayloadSection } from "./panel-sections"
import type { NetworkRequestDetailsProps } from "./types"
import { formatBody, getBodyParams, getQueryParams, statusTone } from "./utils"

const DETAIL_SECTION_VALUES = ["overview", "request", "response"] as const
const DETAIL_TABS: Array<{ id: (typeof DETAIL_SECTION_VALUES)[number]; label: string }> = [
  { id: "overview", label: "Headers" },
  { id: "request", label: "Request" },
  { id: "response", label: "Response" },
]

// Sensitive headers are masked in the UI ("Auto-filtered"), matching devtools privacy behavior.
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "proxy-authorization",
  "x-api-key",
  "x-auth-token",
  "x-csrf-token",
  "x-xsrf-token",
])

function isSensitive(key: string): boolean {
  return SENSITIVE_HEADERS.has(key.toLowerCase())
}

interface NetworkRequestDetailsExtraProps {
  onClose?: () => void
}

export function NetworkRequestDetails({
  bugReportId,
  request,
  onClose,
}: NetworkRequestDetailsProps & NetworkRequestDetailsExtraProps) {
  const [activeSection, setActiveSection] = useQueryState(
    "networkSection",
    parseAsStringLiteral(DETAIL_SECTION_VALUES).withDefault("overview")
  )
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const shouldLoadPayload =
    Boolean(request) && (activeSection === "request" || activeSection === "response")

  const payloadQuery = useQuery(
    reportQueries.bugReport.getNetworkRequestPayload.queryOptions({
      input: {
        id: bugReportId,
        requestId: request?.id ?? "__pending_request__",
      },
      enabled: shouldLoadPayload,
      staleTime: Number.POSITIVE_INFINITY,
    })
  )

  if (!request) {
    return null
  }

  const requestBodyValue = payloadQuery.data?.requestBody ?? null
  const responseBodyValue = payloadQuery.data?.responseBody ?? null
  const queryParams = getQueryParams(request.url)
  const requestHeaders = Object.entries(request.requestHeaders ?? {})
  const responseHeaders = Object.entries(request.responseHeaders ?? {})
  const requestBodyPreview = formatBody(requestBodyValue)
  const responseBodyPreview = formatBody(responseBodyValue)
  const bodyParams = getBodyParams(requestBodyValue)

  const copy = async (key: string, value: string | null | undefined) => {
    if (!(value && navigator.clipboard)) {
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current))
      }, 1400)
    } catch (error) {
      reportNonFatalError("Failed to copy network detail value", error)
    }
  }

  const buildCurl = () => {
    const parts = [`curl '${request.url}'`]
    if (request.method && request.method.toUpperCase() !== "GET") {
      parts.push(`-X ${request.method.toUpperCase()}`)
    }
    for (const [key, value] of requestHeaders) {
      const headerValue = isSensitive(key) ? "<redacted>" : value
      parts.push(`-H '${key}: ${headerValue}'`)
    }
    if (requestBodyValue) {
      parts.push(`--data '${requestBodyValue.replace(/'/g, "'\\''")}'`)
    }
    return parts.join(" \\\n  ")
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: "var(--card)" }}
    >
      {/* Tab bar: close · Headers/Request/Response · Copy cURL */}
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        {onClose ? (
          <button
            aria-label="Close request details"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        {DETAIL_TABS.map((tab) => (
          <button
            className={cn(
              "rounded px-2.5 py-1 font-medium text-xs transition-colors",
              activeSection === tab.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
        <button
          className="ml-auto flex items-center gap-1 rounded border px-2 py-1 font-medium text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => copy("curl", buildCurl())}
          type="button"
        >
          {copiedKey === "curl" ? <Check className="size-3" /> : <Terminal className="size-3" />}
          Copy cURL
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {activeSection === "overview" && (
          <>
            <Section defaultOpen title="General">
              <GeneralRow label="Request URL" value={request.url} mono />
              <GeneralRow label="Request Method" value={request.method.toUpperCase()} mono />
              <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-2 px-3 py-1.5">
                <span className="text-muted-foreground text-xs">Status Code</span>
                {request.status === null ? (
                  <span className="font-mono text-muted-foreground text-xs">—</span>
                ) : (
                  <span className="flex items-center gap-1.5 font-mono text-xs">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        request.status < 400 ? "bg-emerald-500" : "bg-red-500"
                      )}
                    />
                    <span className={statusTone(request.status)}>{request.status}</span>
                  </span>
                )}
              </div>
              {typeof request.duration === "number" ? (
                <GeneralRow label="Duration" value={`${request.duration} ms`} mono />
              ) : null}
            </Section>

            <HeaderSection title="Response Headers" headers={responseHeaders} />
            <HeaderSection title="Request Headers" headers={requestHeaders} />
          </>
        )}

        {activeSection === "request" && (
          <div className="space-y-2 p-2">
            {queryParams.length > 0 ? (
              <HeaderSection
                title="Query String Parameters"
                headers={queryParams.map((p) => [p.key, p.value] as [string, string])}
              />
            ) : null}
            <PayloadSection
              copied={copiedKey === "request-body"}
              emptyMessage={
                payloadQuery.isLoading
                  ? "Loading request body..."
                  : payloadQuery.isError
                    ? "Could not load request body."
                    : "No request payload captured."
              }
              isLoading={payloadQuery.isLoading}
              onCopy={() => copy("request-body", requestBodyPreview?.raw)}
              payload={requestBodyPreview}
              title="Request Payload"
            />
            {bodyParams.length > 0 ? (
              <HeaderSection
                title="Form Data"
                headers={bodyParams.map((p) => [p.key, p.value] as [string, string])}
              />
            ) : null}
          </div>
        )}

        {activeSection === "response" && (
          <div className="space-y-2 p-2">
            <PayloadSection
              copied={copiedKey === "response-body"}
              emptyMessage={
                payloadQuery.isLoading
                  ? "Loading response body..."
                  : payloadQuery.isError
                    ? "Could not load response body."
                    : "No response payload captured."
              }
              isLoading={payloadQuery.isLoading}
              onCopy={() => copy("response-body", responseBodyPreview?.raw)}
              payload={responseBodyPreview}
              title="Response Payload"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b">
      <button
        className="flex w-full items-center gap-1 bg-muted/40 px-2 py-1.5 text-left font-semibold text-foreground text-xs hover:bg-muted/60"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
        {title}
      </button>
      {open ? <div className="py-0.5">{children}</div> : null}
    </section>
  )
}

function GeneralRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-2 px-3 py-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("break-all text-foreground text-xs", mono && "font-mono")}>{value}</span>
    </div>
  )
}

function HeaderSection({ title, headers }: { title: string; headers: Array<[string, string]> }) {
  const sorted = [...headers].sort(([a], [b]) => a.localeCompare(b))
  return (
    <Section title={`${title}`}>
      {sorted.length === 0 ? (
        <p className="px-3 py-2 font-mono text-[11px] text-muted-foreground">No headers captured.</p>
      ) : (
        sorted.map(([key, value], index) => (
          <div
            className="grid grid-cols-[160px_minmax(0,1fr)] gap-2 px-3 py-1 font-mono text-[11px]"
            key={`${key}-${index}`}
          >
            <span className="break-all text-muted-foreground">{key}:</span>
            {isSensitive(key) ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                ***** Auto-filtered
                <ShieldCheck className="size-3 text-emerald-500" />
              </span>
            ) : (
              <span className="break-all text-foreground">{value}</span>
            )}
          </div>
        ))
      )}
    </Section>
  )
}

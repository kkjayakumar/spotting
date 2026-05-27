"use client"

/**
 * Spotting rough-notation highlighter wrapper.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useInView } from "motion/react"
import { useEffect, useRef, type ReactNode } from "react"
import { annotate } from "rough-notation"
import type { RoughAnnotation } from "rough-notation/lib/model"

type HighlightAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket"

interface HighlighterProps {
  children: ReactNode
  action?: HighlightAction
  color?: string
  strokeWidth?: number
  animationDuration?: number
  iterations?: number
  padding?: number
  multiline?: boolean
  isView?: boolean
}

export function Highlighter({
  children,
  action = "highlight",
  color = "#ffd1dc",
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
}: HighlighterProps) {
  const hostRef = useRef<HTMLSpanElement>(null)
  const annotationRef = useRef<RoughAnnotation | null>(null)
  const isVisible = useInView(hostRef, { once: true, margin: "-10%" })
  const shouldRender = !isView || isVisible

  useEffect(() => {
    if (!shouldRender) {
      return
    }

    const element = hostRef.current
    if (!element) {
      return
    }

    const annotation = annotate(element, {
      type: action,
      color,
      strokeWidth,
      animationDuration,
      iterations,
      padding,
      multiline,
    })

    annotationRef.current = annotation
    annotation.show()

    const resizeObserver = new ResizeObserver(() => {
      annotation.hide()
      annotation.show()
    })

    resizeObserver.observe(element)
    resizeObserver.observe(document.body)

    return () => {
      annotate(element, { type: action }).remove()
      resizeObserver.disconnect()
    }
  }, [
    action,
    animationDuration,
    color,
    iterations,
    multiline,
    padding,
    shouldRender,
    strokeWidth,
  ])

  return (
    <span ref={hostRef} className="relative inline-block bg-transparent">
      {children}
    </span>
  )
}

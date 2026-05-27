/**
 * Spotting mobile viewport hook.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useEffect, useState } from "react"

const MOBILE_MAX_WIDTH_PX = 767

function readIsMobileViewport(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => readIsMobileViewport())

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`)

    const sync = () => setIsMobile(mediaQuery.matches)
    sync()

    mediaQuery.addEventListener("change", sync)
    return () => mediaQuery.removeEventListener("change", sync)
  }, [])

  return isMobile
}

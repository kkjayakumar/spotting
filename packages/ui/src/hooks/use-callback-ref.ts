/**
 * Spotting stable callback ref hook.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useEffect, useMemo, useRef } from "react"

export function useCallbackRef<T extends (...args: never[]) => unknown>(
  callback: T | undefined
): T {
  const latestCallback = useRef(callback)

  useEffect(() => {
    latestCallback.current = callback
  })

  return useMemo(
    () => ((...args) => latestCallback.current?.(...args)) as T,
    []
  )
}

/**
 * Spotting localStorage state hook.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useCallback, useEffect, useState } from "react"

type Updater<T> = T | ((previous: T) => T)

function readStoredValue<T>(storageKey: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback
  }

  const raw = window.localStorage.getItem(storageKey)
  if (raw === null) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function useLocalStorage<T>(storageKey: string, initialValue: T) {
  const [value, setValue] = useState<T>(() =>
    readStoredValue(storageKey, initialValue)
  )

  useEffect(() => {
    setValue(readStoredValue(storageKey, initialValue))
  }, [initialValue, storageKey])

  const setStoredValue = useCallback(
    (next: Updater<T>) => {
      setValue((previous) => {
        const resolved = next instanceof Function ? next(previous) : next
        window.localStorage.setItem(storageKey, JSON.stringify(resolved))
        return resolved
      })
    },
    [storageKey]
  )

  const removeStoredValue = useCallback(() => {
    window.localStorage.removeItem(storageKey)
    setValue(initialValue)
  }, [initialValue, storageKey])

  return {
    value,
    setValue: setStoredValue,
    removeValue: removeStoredValue,
  } as const
}

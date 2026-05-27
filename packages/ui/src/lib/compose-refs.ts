/**
 * Spotting React ref composition utilities.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useCallback, type Ref, type RefCallback } from "react"

type MaybeRef<T> = Ref<T> | undefined

function assignRef<T>(ref: MaybeRef<T>, value: T): void | (() => void) {
  if (typeof ref === "function") {
    return ref(value)
  }

  if (ref != null && typeof ref === "object") {
    ref.current = value
  }

  return undefined
}

export function composeRefs<T>(...refs: MaybeRef<T>[]): RefCallback<T> {
  return (node) => {
    const cleanups: Array<void | (() => void)> = []

    for (const ref of refs) {
      cleanups.push(assignRef(ref, node))
    }

    const hasCleanup = cleanups.some((cleanup) => typeof cleanup === "function")

    if (!hasCleanup) {
      return
    }

    return () => {
      for (let index = 0; index < refs.length; index += 1) {
        const cleanup = cleanups[index]
        if (typeof cleanup === "function") {
          cleanup()
          continue
        }

        assignRef(refs[index], null)
      }
    }
  }
}

export function useComposedRefs<T>(...refs: MaybeRef<T>[]): RefCallback<T> {
  return useCallback(composeRefs(...refs), refs)
}

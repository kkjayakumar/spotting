/**
 * Spotting reproduction step action clustering.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DebuggerAction } from "../../types"

const INPUT_EVENT = "input"

function canMergeInputGroup(
  previous: DebuggerAction,
  current: DebuggerAction
): boolean {
  return (
    previous.type === INPUT_EVENT &&
    current.type === INPUT_EVENT &&
    previous.target === current.target
  )
}

export function clusterActionsByTarget(
  actions: DebuggerAction[]
): DebuggerAction[][] {
  const groups: DebuggerAction[][] = []

  for (const action of actions) {
    const lastGroup = groups.at(-1)
    const previousAction = lastGroup?.at(-1)

    if (lastGroup && previousAction && canMergeInputGroup(previousAction, action)) {
      lastGroup.push(action)
      continue
    }

    groups.push([action])
  }

  return groups
}

export function findPreviousNavigation(
  groups: DebuggerAction[][],
  currentIndex: number
): DebuggerAction | null {
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const candidate = groups[index]?.[0]
    if (candidate?.type === "navigation") {
      return candidate
    }
  }

  return null
}

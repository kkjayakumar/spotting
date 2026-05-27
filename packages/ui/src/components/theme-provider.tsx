"use client"

/**
 * Spotting theme provider wrapper.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps, ReactNode } from "react"

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider> & {
  children: ReactNode
}

export function ThemeProvider({ children, ...providerProps }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...providerProps}>{children}</NextThemesProvider>
  )
}

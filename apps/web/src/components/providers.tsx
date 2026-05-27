"use client"

import { ThemeProvider } from "@spotting/ui/components/theme-provider"
import { Toaster } from "@spotting/ui/components/ui/sonner"
import { TooltipProvider } from "@spotting/ui/components/ui/tooltip"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { queryClient } from "@/lib/api"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        enableSystem
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <ReactQueryDevtools />
          </TooltipProvider>
        </QueryClientProvider>
        <Toaster richColors />
      </ThemeProvider>
    </NuqsAdapter>
  )
}

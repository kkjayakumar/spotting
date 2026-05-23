"use client"

import { cn } from "@spotting/ui/lib/utils"
import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { dashboardSettingsNavItems } from "@/lib/dashboard-settings-nav"

export function SettingsNavigation() {
  const pathname = usePathname()

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-white/25 bg-card/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-card/60">
        <div className="border-b border-white/15 px-4 py-4 dark:border-white/10">
          <p className="font-semibold text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Settings
          </p>
          <p className="mt-1 text-muted-foreground text-xs tracking-wide">
            Choose which area you want to configure.
          </p>
        </div>
        <nav className="grid gap-2 p-2">
          {dashboardSettingsNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                className={cn(
                  "rounded-xl border px-3 py-3 transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/15 backdrop-blur-sm"
                    : "border-transparent bg-background/30 hover:border-border/80 hover:bg-muted/50 dark:bg-background/20"
                )}
                href={item.href as Route}
                key={item.href}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 rounded-md p-1.5",
                      isActive ? "bg-primary/15 text-primary" : "bg-muted/80"
                    )}
                  >
                    <item.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm tracking-wide">
                      {item.title}
                    </p>
                    <p className="text-muted-foreground text-xs tracking-wide">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

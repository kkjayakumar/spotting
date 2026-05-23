"use client"

import { Button } from "@spotting/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@spotting/ui/components/ui/dropdown-menu"
import { cn } from "@spotting/ui/lib/utils"
import { LogOut, Settings2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { dashboardSettingsNavItems } from "@/lib/dashboard-settings-nav"

const glassMenuContent =
  "min-w-56 rounded-2xl border border-white/25 bg-background/75 p-1 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-background/65"

const glassMenuLabel =
  "px-2 py-1.5 font-semibold text-xs uppercase tracking-[0.2em] text-muted-foreground"

export function DashboardSettingsMenu() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isUnderSettings = pathname.startsWith("/dashboard/settings")

  const handleLogout = async () => {
    setOpen(false)
    await authClient.signOut()
    window.location.assign("/login")
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Settings menu"
            className={cn(
              "rounded-xl border border-white/20 bg-background/50 shadow-sm backdrop-blur-md transition-colors hover:bg-background/80 dark:border-white/10",
              isUnderSettings && "border-primary/35 bg-primary/10"
            )}
            size="icon"
            variant="ghost"
          />
        }
      >
        <Settings2 className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={glassMenuContent} sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className={glassMenuLabel}>Settings</DropdownMenuLabel>
          {dashboardSettingsNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <DropdownMenuItem
                className={cn(
                  "cursor-pointer rounded-xl px-3 py-2.5 text-sm tracking-wide",
                  isActive && "bg-primary/10"
                )}
                key={item.href}
                onClick={() => {
                  setOpen(false)
                  router.push(item.href)
                }}
              >
                <item.icon className="mr-2 size-4 opacity-80" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium leading-none">{item.title}</span>
                  <span className="text-muted-foreground text-xs font-normal tracking-wide">
                    {item.description}
                  </span>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border/60" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer rounded-xl px-3 py-2.5 text-sm tracking-wide text-destructive focus:text-destructive"
            onClick={handleLogout}
            variant="destructive"
          >
            <LogOut className="mr-2 size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

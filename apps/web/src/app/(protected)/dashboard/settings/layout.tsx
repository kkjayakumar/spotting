import { SettingsNavigation } from "./_components/settings-navigation"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 pt-4">
      <div className="space-y-2 rounded-2xl border border-white/20 bg-gradient-to-br from-background/90 via-background/70 to-background/40 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:from-background/80 dark:via-background/55 dark:to-background/35">
        <h1 className="font-bold text-3xl tracking-[0.02em] text-foreground/95">
          Settings
        </h1>
        <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed tracking-wide">
          Manage personal preferences and organization administration.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <SettingsNavigation />
        <div className="min-w-0 max-w-[860px]">{children}</div>
      </div>
    </div>
  )
}

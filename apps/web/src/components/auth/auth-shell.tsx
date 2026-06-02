import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@spotting/ui/components/ui/card"
import type { ReactNode } from "react"

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="flex w-full flex-col items-center p-4">
      <div className="mb-10 flex flex-col items-center gap-4 group cursor-default">
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute h-32 w-32 animate-[ping_3s_ease-in-out_infinite] rounded-full bg-[#00BFFF]/20" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-[#00BFFF]/20 bg-[#00BFFF]/10 shadow-[0_0_30px_rgba(0,191,255,0.3)]">
            <svg 
              className="h-16 w-16 text-[#00BFFF] filter drop-shadow-[0_0_10px_rgba(0,191,255,0.5)]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
              <path d="M3 7l6 5" />
              <path d="M3 17l6 -5" />
              <path d="M21 7l-6 5" />
              <path d="M21 17l-6 -5" />
              <path d="M12 4v5" />
              <path d="M12 15v5" />
            </svg>
          </div>
        </div>
        <h1 className="font-black font-mono text-5xl tracking-tighter text-white drop-shadow-[0_0_15px_rgba(0,191,255,0.3)]">
          SPOT<span className="text-[#00BFFF]">TING</span>
        </h1>
      </div>

      <Card className="w-full max-w-[440px] border border-white/20 bg-black/60 text-slate-100 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-all hover:border-white/30 [&_[data-slot=field-label]]:text-slate-200 [&_[data-slot=field-error]]:text-red-300 [&_a.font-medium]:text-[#00BFFF] [&_a.font-medium]:hover:text-sky-300">
        <CardHeader className="space-y-2 pt-8 text-center">
          <CardTitle className="font-bold text-4xl tracking-tight text-white drop-shadow-md">
            {title}
          </CardTitle>
          <CardDescription className="text-slate-300 font-medium text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-4 pb-10">{children}</CardContent>
      </Card>
    </div>
  )
}

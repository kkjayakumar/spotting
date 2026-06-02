import { SpiderWebBackground } from "@/components/spider-web-background"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-950">
      <SpiderWebBackground />
      {children}
    </div>
  )
}

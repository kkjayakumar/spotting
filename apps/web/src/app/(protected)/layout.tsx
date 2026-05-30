import { Plus_Jakarta_Sans, Roboto_Mono } from "next/font/google"
import { redirect } from "next/navigation"

import { getProtectedAuthData } from "@/app/(protected)/_lib/get-protected-auth-data"

export const dynamic = "force-dynamic"

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-google-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const monoFont = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-google-mono",
  weight: ["400", "500", "700"],
  display: "swap",
})

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = await getProtectedAuthData()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className={`${sansFont.variable} ${monoFont.variable} google-theme h-full w-full`}>
      {children}
    </div>
  )
}

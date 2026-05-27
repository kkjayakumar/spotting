import { redirect } from "next/navigation"

import { getProtectedAuthData } from "@/app/(protected)/_lib/get-protected-auth-data"

interface OnboardingLayoutProps {
  children: React.ReactNode
}

export default async function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  const auth = await getProtectedAuthData()
  const hasOrganization = auth.organizations.length > 0

  if (hasOrganization) {
    redirect("/")
  }

  return children
}

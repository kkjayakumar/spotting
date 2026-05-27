import { authClient } from "@spotting/auth/client"

import { ModeToggle } from "@spotting/ui/components/mode-toggle"

import {

  SidebarInset,

  SidebarProvider,

  SidebarTrigger,

} from "@spotting/ui/components/ui/sidebar"

import { redirect } from "next/navigation"



import { getProtectedAuthData } from "@/app/(protected)/_lib/get-protected-auth-data"

import { AppSidebar } from "@/components/app-sidebar"

import { UnverifiedEmailBanner } from "@/components/auth/unverified-email-banner"

import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs"

import { DashboardSettingsMenu } from "@/components/dashboard-settings-menu"

import { Shell } from "@/components/shell"

import { SpiderWebBackground } from "@/components/spider-web-background"



export default async function DashboardLayout({

  children,

}: {

  children: React.ReactNode

}) {

  const { organizations, session } = await getProtectedAuthData()



  if (!session) {

    redirect("/login")

  }



  if (organizations.length === 0) {

    redirect("/onboarding")

  }



  const activeOrganization =

    organizations.find(

      (organization) => organization.id === session.session.activeOrganizationId

    ) ?? organizations[0]



  return (

    <SidebarProvider className="min-h-svh items-stretch">

      <SpiderWebBackground />

      <AppSidebar

        activeOrganization={activeOrganization}

        organizations={organizations}

        user={session.user}

      />

      <SidebarInset>

        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/20 bg-background/70 px-4 shadow-sm backdrop-blur-xl transition-[width,height] ease-linear dark:border-white/10 dark:bg-background/55 supports-[backdrop-filter]:bg-background/55 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">

          <div className="flex min-w-0 flex-1 items-center gap-2">

            <SidebarTrigger className="-ml-1 shrink-0" />

            <ModeToggle className="shrink-0" />

            <div className="min-w-0 [&_.font-medium]:tracking-wide">

              <DashboardBreadcrumbs />

            </div>

          </div>

          <div className="flex shrink-0 items-center gap-2">

            <DashboardSettingsMenu />

          </div>

        </header>

        <Shell>

          <UnverifiedEmailBanner initialVerified={session.user.emailVerified} />

          {children}

        </Shell>

      </SidebarInset>

    </SidebarProvider>

  )

}


"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@spotting/ui/components/ui/breadcrumb"
import { usePathname } from "next/navigation"

function getBreadcrumbMeta(pathname: string): {
  parent: string
  parentHref: string
  current: string
} {
  if (pathname.startsWith("/dashboard/settings/user")) {
    return {
      parent: "Settings",
      parentHref: "/dashboard/settings/user",
      current: "User",
    }
  }

  if (pathname.startsWith("/dashboard/settings/organization")) {
    return {
      parent: "Settings",
      parentHref: "/dashboard/settings/organization",
      current: "Organization",
    }
  }

  if (pathname.startsWith("/dashboard/settings/keys")) {
    return {
      parent: "Settings",
      parentHref: "/dashboard/settings/keys",
      current: "Public Keys",
    }
  }

  if (pathname.startsWith("/dashboard/settings/extension")) {
    return {
      parent: "Settings",
      parentHref: "/dashboard/settings/extension",
      current: "Browser extension",
    }
  }

  if (pathname.startsWith("/dashboard/settings/billing")) {
    return {
      parent: "Settings",
      parentHref: "/dashboard/settings/billing",
      current: "Billing",
    }
  }

  if (pathname.startsWith("/dashboard/settings")) {
    return {
      parent: "Settings",
      parentHref: "/dashboard/settings/user",
      current: "Overview",
    }
  }

  return {
    parent: "Bug Reports",
    parentHref: "/dashboard",
    current: "All Bug Reports",
  }
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname()
  const breadcrumbMeta = getBreadcrumbMeta(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink
            className="font-medium tracking-wide text-foreground/90"
            href={breadcrumbMeta.parentHref}
          >
            {breadcrumbMeta.parent}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium tracking-wide text-muted-foreground">
            {breadcrumbMeta.current}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

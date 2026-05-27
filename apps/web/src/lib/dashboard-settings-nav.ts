import {
  Building2,
  KeyRound,
  Puzzle,
  UserRound,
} from "lucide-react"

export const dashboardSettingsNavItems = [
  {
    href: "/dashboard/settings/user" as const,
    title: "User",
    description: "Profile and password",
    icon: UserRound,
  },
  {
    href: "/dashboard/settings/organization" as const,
    title: "Organization",
    description: "Workspace, members, invites",
    icon: Building2,
  },
  {
    href: "/dashboard/settings/keys" as const,
    title: "Public Keys",
    description: "Widget keys, origins, embeds",
    icon: KeyRound,
  },
  {
    href: "/dashboard/settings/extension" as const,
    title: "Browser extension",
    description: "Chromium capture extension",
    icon: Puzzle,
  },
] as const

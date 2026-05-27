const KNOWN_ORG_ROLES: Readonly<Record<string, string>> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
}

export function displayOrgRole(role: string): string {
  const known = KNOWN_ORG_ROLES[role]
  if (known) {
    return known
  }

  return role
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/** @deprecated Use displayOrgRole */
export const formatRoleLabel = displayOrgRole

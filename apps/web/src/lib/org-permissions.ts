export type OrgMemberRole = "owner" | "admin" | "member" | string | null | undefined

export function canManageProjects(role: OrgMemberRole): boolean {
  return role === "owner" || role === "admin"
}

export function canDeleteReports(role: OrgMemberRole): boolean {
  return role === "owner" || role === "admin"
}

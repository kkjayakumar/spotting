export type OrgMemberRole = "owner" | "admin" | "member" | string

export interface OrgMemberRecord {
  memberId: string
  userId: string
  name: string
  email: string
  role: OrgMemberRole
  joinedAt: string
}

export interface OrgInviteRecord {
  invitationId: string
  email: string
  role: OrgMemberRole
  status: string
  createdAt: string
  expiresAt: string
}

/** @deprecated Use OrgMemberRole */
export type OrganizationRole = OrgMemberRole

/** @deprecated Use OrgMemberRecord */
export type OrganizationMemberRow = OrgMemberRecord

/** @deprecated Use OrgInviteRecord */
export type OrganizationInvitationRow = OrgInviteRecord

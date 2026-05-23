export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type Membership = {
  id: string;
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
};

export type Invite = {
  id: string;
  organizationId: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
};

export const store = {
  users: [] as User[],
  sessions: [] as Session[],
  organizations: [] as Organization[],
  memberships: [] as Membership[],
  invites: [] as Invite[],
};

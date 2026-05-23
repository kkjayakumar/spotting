export const FIXTURE_IDS = {
  userOwner: "user_owner",
  orgPrimary: "org_primary",
  reportPrimary: "report_primary",
  invitePrimary: "invite_primary",
  uploadPrimary: "upload_primary",
} as const;

export const FIXTURE_TIME = {
  now: new Date("2026-01-01T00:00:00.000Z"),
  nextWeek: new Date("2026-01-08T00:00:00.000Z"),
} as const;

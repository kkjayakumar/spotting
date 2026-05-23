import type { Context } from "hono";
import { Hono } from "hono";
import {
  InviteRole,
  InvitationStatus,
  MembershipRole,
  Prisma,
  ReportPriority,
  ReportStatus,
  ReportVisibility,
} from "./prisma-exports";
import { requireSession, tryReadSession } from "./auth";
import { createCapturePublicRouter } from "./capture-public";
import { prisma } from "./db";
import {
  issueAndSendEmailVerificationOtp,
  mapVerificationError,
  verifyEmailOtp,
} from "./email-verification";
import { isEmailConfigured } from "./email";
import { requireOrgMembership, requireOrgRole } from "./permissions";
import {
  buildDebuggerEventsFromCapture,
  getNetworkRequestPayloadFromCapture,
  listNetworkRequestsFromCapture,
} from "./report-capture-metadata";
import { serializeReportForApi, serializeReportsForApi } from "./report-artifacts";
import { createPresignedUploadUrl } from "./s3";
import {
  apiError,
  optionalEnumValue,
  optionalTrimmedString,
  parsePositiveInt,
  readJsonBody,
  requireNonEmptyString,
} from "./validation";

const v1 = new Hono();

async function resolveReportOrgId(userId: string, orgIdHeader: string | undefined) {
  if (orgIdHeader) {
    await requireOrgMembership(userId, orgIdHeader);
    return orgIdHeader;
  }

  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) {
    throw apiError(
      400,
      "BAD_REQUEST",
      "No organization found. Create one first or pass x-org-id header.",
    );
  }
  return membership.organizationId;
}

async function requireReport(reportId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw apiError(404, "NOT_FOUND", "Report not found");
  return report;
}

/** Same visibility rules as GET /reports/:id (org member or public report). */
async function requireReportForViewer(reportId: string, c: Context) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    throw apiError(404, "NOT_FOUND", "Report not found");
  }

  const session = await tryReadSession(c);
  if (session) {
    try {
      await requireOrgMembership(session.userId, report.organizationId);
      return report;
    } catch {
      /* not a member — fall through to public visibility check */
    }
  }

  if (report.visibility === ReportVisibility.public) {
    return report;
  }

  throw apiError(404, "NOT_FOUND", "Report not found");
}

v1.post("/auth/signup", async (c) => {
  const body = await readJsonBody<{ email?: string; password?: string; name?: string }>(c);
  const email = requireNonEmptyString(body.email, "email", { lowercase: true });
  const password = requireNonEmptyString(body.password, "password", { minLength: 6 });
  const name = requireNonEmptyString(body.name, "name");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw apiError(409, "CONFLICT", "Email already exists");

  const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
  const user = await prisma.user.create({ data: { email, name, passwordHash } });
  const verificationOtp = await issueAndSendEmailVerificationOtp({
    userId: user.id,
    email: user.email,
    name: user.name,
  });
  const sessionToken = crypto.randomUUID();
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: sessionToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return c.json(
    {
      user: { id: user.id, email: user.email, name: user.name, emailVerified: false },
      sessionToken,
      ...(!isEmailConfigured() ? { verificationOtp } : {}),
    },
    201,
  );
});

v1.post("/auth/signin", async (c) => {
  const body = await readJsonBody<{ email?: string; password?: string }>(c);
  const email = requireNonEmptyString(body.email, "email", { lowercase: true });
  const password = requireNonEmptyString(body.password, "password");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw apiError(401, "UNAUTHORIZED", "Invalid credentials");
  const isValidPassword = await Bun.password.verify(password, user.passwordHash);
  if (!isValidPassword) throw apiError(401, "UNAUTHORIZED", "Invalid credentials");

  const sessionToken = crypto.randomUUID();
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: sessionToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: Boolean(user.emailVerifiedAt),
    },
    sessionToken,
  });
});

v1.post("/auth/refresh", async (c) => {
  const { userId, token } = await requireSession(c);
  await prisma.session.deleteMany({ where: { refreshTokenHash: token } });
  const newToken = crypto.randomUUID();
  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: newToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
  return c.json({ sessionToken: newToken });
});

v1.post("/auth/signout", async (c) => {
  const { token } = await requireSession(c);
  await prisma.session.deleteMany({ where: { refreshTokenHash: token } });
  return c.json({ ok: true });
});

v1.get("/auth/me", async (c) => {
  const { userId } = await requireSession(c);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw apiError(404, "NOT_FOUND", "User not found");
  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: Boolean(user.emailVerifiedAt),
  });
});

v1.patch("/auth/me", async (c) => {
  const { userId } = await requireSession(c);
  const body = await readJsonBody<{ name?: string }>(c);
  const name = optionalTrimmedString(body.name);
  if (!name) {
    throw apiError(400, "VALIDATION_ERROR", "Invalid request", [
      { field: "name", issue: "is required" },
    ]);
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name },
  });
  return c.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    emailVerified: Boolean(updated.emailVerifiedAt),
  });
});

v1.post("/auth/change-password", async (c) => {
  const { userId } = await requireSession(c);
  const body = await readJsonBody<{ currentPassword?: string; newPassword?: string }>(c);
  const currentPassword = requireNonEmptyString(body.currentPassword, "currentPassword");
  const newPassword = requireNonEmptyString(body.newPassword, "newPassword", { minLength: 6 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw apiError(404, "NOT_FOUND", "User not found");
  const isValid = await Bun.password.verify(currentPassword, user.passwordHash);
  if (!isValid) {
    throw apiError(401, "UNAUTHORIZED", "Current password is incorrect");
  }
  const passwordHash = await Bun.password.hash(newPassword, { algorithm: "bcrypt", cost: 10 });
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  return c.json({ ok: true });
});

v1.post("/auth/resend-verification", async (c) => {
  const { userId } = await requireSession(c);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw apiError(404, "NOT_FOUND", "User not found");
  if (user.emailVerifiedAt) return c.json({ ok: true, alreadyVerified: true });
  try {
    await issueAndSendEmailVerificationOtp({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    throw apiError(
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to send verification email",
    );
  }
  return c.json({ ok: true });
});

v1.post("/auth/verify-email", async (c) => {
  const { userId } = await requireSession(c);
  const body = await readJsonBody<{ token?: string; otp?: string }>(c);
  const otp = optionalTrimmedString(body.otp) ?? optionalTrimmedString(body.token);
  if (!otp) {
    throw apiError(400, "VALIDATION_ERROR", "Verification code is required", [
      { field: "otp", issue: "required" },
    ]);
  }

  try {
    await verifyEmailOtp(userId, otp);
  } catch (error) {
    const mapped = mapVerificationError(error);
    throw apiError(mapped.status, mapped.code, mapped.message);
  }

  return c.json({ ok: true, emailVerified: true });
});

v1.post("/orgs", async (c) => {
  const { userId } = await requireSession(c);
  const body = await readJsonBody<{ name?: string; slug?: string }>(c);
  const name = requireNonEmptyString(body.name, "name");
  const slug = requireNonEmptyString(body.slug, "slug", { lowercase: true });
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) throw apiError(409, "CONFLICT", "Slug already exists");
  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      memberships: { create: { userId, role: MembershipRole.owner } },
    },
  });
  return c.json({ id: organization.id, name: organization.name, slug: organization.slug }, 201);
});

v1.get("/orgs", async (c) => {
  const { userId } = await requireSession(c);
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { organization: true },
  });
  return c.json(
    memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
    })),
  );
});

v1.post("/orgs/:orgId/switch", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  await requireOrgMembership(userId, orgId);
  return c.json({ activeOrganizationId: orgId });
});

v1.get("/orgs/:orgId/members", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  await requireOrgMembership(userId, orgId);
  const members = await prisma.membership.findMany({
    where: { organizationId: orgId },
    include: { user: true },
  });
  return c.json(members);
});

v1.patch("/orgs/:orgId/members/:memberId", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  const memberId = c.req.param("memberId");
  const actorMembership = await requireOrgRole(userId, orgId, [
    MembershipRole.owner,
    MembershipRole.admin,
  ]);
  const body = await readJsonBody<{ role?: string }>(c);
  const newRole = optionalEnumValue(body.role, [MembershipRole.admin, MembershipRole.member], "role");
  if (!newRole) {
    throw apiError(400, "VALIDATION_ERROR", "Invalid request", [
      { field: "role", issue: "must be admin or member" },
    ]);
  }
  const target = await prisma.membership.findFirst({
    where: { id: memberId, organizationId: orgId },
  });
  if (!target) {
    throw apiError(404, "NOT_FOUND", "Member not found");
  }
  if (target.role === MembershipRole.owner) {
    throw apiError(403, "FORBIDDEN", "Cannot change the organization owner role");
  }
  if (
    actorMembership.role === MembershipRole.admin &&
    target.role === MembershipRole.admin &&
    target.userId !== userId
  ) {
    throw apiError(403, "FORBIDDEN", "Only an owner can change another admin");
  }
  await prisma.membership.update({
    where: { id: memberId },
    data: { role: newRole },
  });
  return c.json({ ok: true });
});

v1.delete("/orgs/:orgId/members/:memberId", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  const memberId = c.req.param("memberId");
  const actorMembership = await requireOrgRole(userId, orgId, [
    MembershipRole.owner,
    MembershipRole.admin,
  ]);
  const target = await prisma.membership.findFirst({
    where: { id: memberId, organizationId: orgId },
  });
  if (!target) {
    throw apiError(404, "NOT_FOUND", "Member not found");
  }
  if (target.role === MembershipRole.owner) {
    throw apiError(403, "FORBIDDEN", "Cannot remove the organization owner");
  }
  if (
    actorMembership.role === MembershipRole.admin &&
    target.role === MembershipRole.admin &&
    target.userId !== userId
  ) {
    throw apiError(403, "FORBIDDEN", "Only an owner can remove an admin");
  }
  await prisma.membership.delete({ where: { id: memberId } });
  return c.body(null, 204);
});

v1.post("/orgs/:orgId/invites", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  await requireOrgRole(userId, orgId, [MembershipRole.owner, MembershipRole.admin]);
  const body = await readJsonBody<{ email?: string; role?: "admin" | "member" }>(c);
  const email = requireNonEmptyString(body.email, "email", { lowercase: true });
  const role = optionalEnumValue(body.role, ["admin", "member"] as const, "role") ?? "member";
  const invite = await prisma.invitation.create({
    data: {
      organizationId: orgId,
      email,
      role: role === "admin" ? InviteRole.admin : InviteRole.member,
      status: InvitationStatus.pending,
      inviterUserId: userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
  return c.json(invite, 201);
});

v1.get("/orgs/:orgId/invites", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  await requireOrgRole(userId, orgId, [MembershipRole.owner, MembershipRole.admin]);
  const invites = await prisma.invitation.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return c.json(invites);
});

v1.get("/me/invites", async (c) => {
  const { userId } = await requireSession(c);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw apiError(404, "NOT_FOUND", "User not found");
  const invites = await prisma.invitation.findMany({
    where: { email: user.email, status: InvitationStatus.pending },
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });
  return c.json(invites);
});

v1.post("/orgs/invites/:inviteId/accept", async (c) => {
  const { userId } = await requireSession(c);
  const inviteId = c.req.param("inviteId");
  const invite = await prisma.invitation.findUnique({ where: { id: inviteId } });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!invite || !user) throw apiError(404, "NOT_FOUND", "Invite not found");
  if (invite.status !== InvitationStatus.pending) {
    throw apiError(409, "CONFLICT", "Invite is no longer pending");
  }
  if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) {
    await prisma.invitation.update({
      where: { id: invite.id },
      data: { status: InvitationStatus.cancelled },
    });
    throw apiError(410, "GONE", "Invite has expired");
  }
  if (invite.email !== user.email) throw apiError(403, "FORBIDDEN", "Invite email mismatch");
  await prisma.invitation.update({
    where: { id: invite.id },
    data: { status: InvitationStatus.accepted },
  });
  const existing = await prisma.membership.findUnique({
    where: { organizationId_userId: { organizationId: invite.organizationId, userId: user.id } },
  });
  if (!existing) {
    await prisma.membership.create({
      data: {
        organizationId: invite.organizationId,
        userId: user.id,
        role: invite.role === InviteRole.admin ? MembershipRole.admin : MembershipRole.member,
      },
    });
  }
  return c.json({ ok: true });
});

v1.post("/orgs/invites/:inviteId/reject", async (c) => {
  const { userId } = await requireSession(c);
  const invite = await prisma.invitation.findUnique({ where: { id: c.req.param("inviteId") } });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!invite || !user) throw apiError(404, "NOT_FOUND", "Invite not found");
  if (invite.email !== user.email) throw apiError(403, "FORBIDDEN", "Invite email mismatch");
  if (invite.status !== InvitationStatus.pending) {
    throw apiError(409, "CONFLICT", "Invite is no longer pending");
  }
  await prisma.invitation.update({
    where: { id: invite.id },
    data: { status: InvitationStatus.rejected },
  });
  return c.json({ ok: true });
});

v1.delete("/orgs/invites/:inviteId", async (c) => {
  const inviteId = c.req.param("inviteId");
  const { userId } = await requireSession(c);
  const invite = await prisma.invitation.findUnique({ where: { id: inviteId } });
  if (!invite) throw apiError(404, "NOT_FOUND", "Invite not found");
  await requireOrgRole(userId, invite.organizationId, [MembershipRole.owner, MembershipRole.admin]);
  await prisma.invitation.delete({ where: { id: inviteId } });
  return c.body(null, 204);
});

v1.post("/reports/upload-sessions", async (c) => {
  const { userId } = await requireSession(c);
  const body = await readJsonBody<{ reportId?: string; contentType?: string; fileName?: string }>(c);
  const reportId = requireNonEmptyString(body.reportId, "reportId");
  const contentType = requireNonEmptyString(body.contentType, "contentType");
  const report = await requireReport(reportId);
  await requireOrgMembership(userId, report.organizationId);

  const uploadSession = await prisma.uploadSession.create({
    data: {
      reportId,
      uploadKey: `${report.organizationId}/${report.id}/${crypto.randomUUID()}-${body.fileName ?? "artifact"}`,
      contentType,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  const { uploadUrl } = await createPresignedUploadUrl(uploadSession.uploadKey, contentType, 900);
  return c.json({
    sessionId: uploadSession.id,
    uploadUrl,
    uploadKey: uploadSession.uploadKey,
    expiresAt: uploadSession.expiresAt.toISOString(),
  });
});

v1.post("/reports/upload-sessions/:sessionId/finalize", async (c) => {
  const { userId } = await requireSession(c);
  const sessionId = c.req.param("sessionId");
  const uploadSession = await prisma.uploadSession.findUnique({
    where: { id: sessionId },
    include: { report: true },
  });
  if (!uploadSession) throw apiError(404, "NOT_FOUND", "Upload session not found");
  await requireOrgMembership(userId, uploadSession.report.organizationId);
  if (uploadSession.finalizedAt) throw apiError(409, "CONFLICT", "Upload session already finalized");
  if (uploadSession.expiresAt.getTime() <= Date.now()) {
    throw apiError(410, "GONE", "Upload session has expired");
  }
  await prisma.uploadSession.update({ where: { id: sessionId }, data: { finalizedAt: new Date() } });
  return c.json({ ok: true, sessionId });
});

v1.post("/reports", async (c) => {
  const { userId } = await requireSession(c);
  const body = await readJsonBody<{
    organizationId?: string;
    title?: string;
    description?: string;
    priority?: string;
    visibility?: string;
    pageUrl?: string;
    metadataJson?: unknown;
  }>(c);
  const title = requireNonEmptyString(body.title, "title");
  const priority =
    optionalEnumValue(body.priority, Object.values(ReportPriority), "priority") ?? ReportPriority.medium;
  const visibility =
    optionalEnumValue(body.visibility, Object.values(ReportVisibility), "visibility") ??
    ReportVisibility.private;
  const organizationId = await resolveReportOrgId(
    userId,
    optionalTrimmedString(body.organizationId) ?? c.req.header("x-org-id"),
  );

  const report = await prisma.report.create({
    data: {
      organizationId,
      reporterUserId: userId,
      title,
      description: optionalTrimmedString(body.description),
      priority,
      visibility,
      pageUrl: optionalTrimmedString(body.pageUrl),
      metadataJson:
        body.metadataJson === undefined
          ? undefined
          : body.metadataJson === null
            ? Prisma.JsonNull
            : (body.metadataJson as Prisma.InputJsonValue),
    },
  });
  return c.json(report, 201);
});

v1.get("/reports/stats", async (c) => {
  const { userId } = await requireSession(c);
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);
  const baseWhere: Prisma.ReportWhereInput = {
    organizationId: { in: orgIds },
  };

  const [total, open, mine, untriaged] = await Promise.all([
    prisma.report.count({ where: baseWhere }),
    prisma.report.count({
      where: { ...baseWhere, status: ReportStatus.open },
    }),
    prisma.report.count({
      where: { ...baseWhere, reporterUserId: userId },
    }),
    prisma.report.count({
      where: {
        ...baseWhere,
        status: ReportStatus.open,
        uploadSessions: { none: { finalizedAt: { not: null } } },
      },
    }),
  ]);

  return c.json({ total, open, untriaged, mine });
});

v1.get("/reports", async (c) => {
  const { userId } = await requireSession(c);
  const page = parsePositiveInt(c.req.query("page"), "page", { min: 1, fallback: 1 });
  const pageSize = parsePositiveInt(c.req.query("pageSize"), "pageSize", {
    min: 1,
    max: 100,
    fallback: 10,
  });
  const status = optionalEnumValue(c.req.query("status"), Object.values(ReportStatus), "status");
  const priority = optionalEnumValue(c.req.query("priority"), Object.values(ReportPriority), "priority");
  const sort = c.req.query("sort") ?? "createdAt:desc";
  const [sortFieldRaw, sortDirectionRaw] = sort.split(":");
  const sortField = optionalEnumValue(sortFieldRaw, ["createdAt", "updatedAt"] as const, "sort field");
  const sortDirection = optionalEnumValue(sortDirectionRaw, ["asc", "desc"] as const, "sort direction");
  if (!sortField || !sortDirection) {
    throw apiError(400, "VALIDATION_ERROR", "Invalid sort", [
      { field: "sort", issue: "must be createdAt:asc|desc or updatedAt:asc|desc" },
    ]);
  }

  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  const where: Prisma.ReportWhereInput = {
    organizationId: { in: memberships.map((m) => m.organizationId) },
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  };
  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { [sortField]: sortDirection },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        uploadSessions: { orderBy: { createdAt: "desc" } },
      },
    }),
  ]);
  const items = await serializeReportsForApi(reports);
  return c.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

v1.get("/reports/:reportId", async (c) => {
  const reportId = c.req.param("reportId");
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      uploadSessions: { orderBy: { createdAt: "desc" } },
      organization: { select: { id: true, name: true, slug: true } },
      reporterUser: { select: { id: true, name: true, email: true } },
    },
  });
  if (!report) {
    throw apiError(404, "NOT_FOUND", "Report not found");
  }

  const session = await tryReadSession(c);
  if (session) {
    try {
      await requireOrgMembership(session.userId, report.organizationId);
      return c.json(await serializeReportForApi(report));
    } catch {
      /* not a member — fall through to public visibility check */
    }
  }

  if (report.visibility === ReportVisibility.public) {
    return c.json(await serializeReportForApi(report));
  }

  throw apiError(404, "NOT_FOUND", "Report not found");
});

v1.get("/reports/:reportId/events", async (c) => {
  const reportId = c.req.param("reportId");
  const report = await requireReportForViewer(reportId, c);
  const events = buildDebuggerEventsFromCapture({
    metadataJson: report.metadataJson,
    pageUrl: report.pageUrl,
    reportCreatedAt: report.createdAt,
  });
  return c.json(events);
});

v1.get("/reports/:reportId/network", async (c) => {
  const reportId = c.req.param("reportId");
  const report = await requireReportForViewer(reportId, c);
  const page = parsePositiveInt(c.req.query("page"), "page", {
    min: 1,
    fallback: 1,
  });
  const pageSize = parsePositiveInt(c.req.query("pageSize"), "pageSize", {
    min: 1,
    max: 100,
    fallback: 10,
  });
  const search = optionalTrimmedString(c.req.query("search"));
  const result = listNetworkRequestsFromCapture({
    metadataJson: report.metadataJson,
    reportCreatedAt: report.createdAt,
    page,
    pageSize,
    search: search ?? undefined,
  });
  return c.json(result);
});

v1.get("/reports/:reportId/network/:requestId", async (c) => {
  const reportId = c.req.param("reportId");
  const requestId = c.req.param("requestId");
  const report = await requireReportForViewer(reportId, c);
  const payload = getNetworkRequestPayloadFromCapture(
    report.metadataJson,
    requestId,
  );
  return c.json(payload);
});

v1.patch("/reports/:reportId", async (c) => {
  const { userId } = await requireSession(c);
  const reportId = c.req.param("reportId");
  const current = await requireReport(reportId);
  await requireOrgMembership(userId, current.organizationId);
  const body = await readJsonBody<{
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    visibility?: string;
    pageUrl?: string;
    metadataJson?: unknown;
  }>(c);

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      title: optionalTrimmedString(body.title) ?? current.title,
      description: optionalTrimmedString(body.description) ?? current.description,
      priority: optionalEnumValue(body.priority, Object.values(ReportPriority), "priority") ?? current.priority,
      status: optionalEnumValue(body.status, Object.values(ReportStatus), "status") ?? current.status,
      visibility:
        optionalEnumValue(body.visibility, Object.values(ReportVisibility), "visibility") ?? current.visibility,
      pageUrl: optionalTrimmedString(body.pageUrl) ?? current.pageUrl,
      metadataJson:
        body.metadataJson === undefined
          ? undefined
          : body.metadataJson === null
            ? Prisma.JsonNull
            : (body.metadataJson as Prisma.InputJsonValue),
    },
  });
  return c.json(updated);
});

v1.patch("/reports/:reportId/status", async (c) => {
  const { userId } = await requireSession(c);
  const reportId = c.req.param("reportId");
  const body = await readJsonBody<{ status?: string }>(c);
  const nextStatus = optionalEnumValue(body.status, Object.values(ReportStatus), "status");
  if (!nextStatus) throw apiError(400, "VALIDATION_ERROR", "Valid status is required");
  const current = await requireReport(reportId);
  await requireOrgRole(userId, current.organizationId, [MembershipRole.owner, MembershipRole.admin]);
  const updated = await prisma.report.update({ where: { id: reportId }, data: { status: nextStatus } });
  return c.json(updated);
});

v1.get("/reports/:reportId/share", async (c) => {
  const { userId } = await requireSession(c);
  const report = await requireReport(c.req.param("reportId"));
  await requireOrgMembership(userId, report.organizationId);
  return c.json({ shareUrl: `http://localhost:3001/s/${report.id}` });
});

function parseAllowedOriginsField(value: unknown): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw apiError(400, "VALIDATION_ERROR", "Invalid allowedOrigins", [
      { field: "allowedOrigins", issue: "must be an array of strings" },
    ]);
  }
  const out: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const v = value[i];
    if (typeof v !== "string") {
      throw apiError(400, "VALIDATION_ERROR", "Invalid allowedOrigins", [
        { field: `allowedOrigins[${i}]`, issue: "must be a string" },
      ]);
    }
    const t = v.trim();
    if (t.length > 0) {
      out.push(t);
    }
  }
  return out;
}

function serializeCapturePublicKey(row: {
  id: string;
  token: string;
  label: string;
  allowedOrigins: unknown;
  revokedAt: Date | null;
  createdAt: Date;
}) {
  const allowedOrigins = Array.isArray(row.allowedOrigins)
    ? (row.allowedOrigins as string[])
    : [];
  return {
    id: row.id,
    label: row.label,
    key: row.token,
    allowedOrigins,
    status: row.revokedAt ? "revoked" : "active",
    createdAt: row.createdAt.toISOString(),
  };
}

async function requireCapturePublicKey(orgId: string, keyId: string) {
  const row = await prisma.capturePublicKey.findFirst({
    where: { id: keyId, organizationId: orgId },
  });
  if (!row) {
    throw apiError(404, "NOT_FOUND", "Public key not found");
  }
  return row;
}

v1.get("/orgs/:orgId/capture-keys", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  await requireOrgMembership(userId, orgId);
  const rows = await prisma.capturePublicKey.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return c.json(rows.map(serializeCapturePublicKey));
});

v1.post("/orgs/:orgId/capture-keys", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  await requireOrgRole(userId, orgId, [MembershipRole.owner, MembershipRole.admin]);
  const body = await readJsonBody<{ label?: string; allowedOrigins?: unknown }>(c);
  const label = requireNonEmptyString(body.label, "label");
  const allowedOrigins = parseAllowedOriginsField(body.allowedOrigins);
  const token = `crk_live_${crypto.randomUUID().replace(/-/g, "")}`;
  const row = await prisma.capturePublicKey.create({
    data: {
      organizationId: orgId,
      token,
      label,
      allowedOrigins,
    },
  });
  return c.json(serializeCapturePublicKey(row), 201);
});

v1.patch("/orgs/:orgId/capture-keys/:keyId", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  const keyId = c.req.param("keyId");
  await requireOrgRole(userId, orgId, [MembershipRole.owner, MembershipRole.admin]);
  await requireCapturePublicKey(orgId, keyId);
  const body = await readJsonBody<{ label?: string; allowedOrigins?: unknown }>(c);
  const label =
    body.label !== undefined ? requireNonEmptyString(body.label, "label") : undefined;
  const allowedOrigins =
    body.allowedOrigins !== undefined
      ? parseAllowedOriginsField(body.allowedOrigins)
      : undefined;
  if (label === undefined && allowedOrigins === undefined) {
    throw apiError(400, "VALIDATION_ERROR", "No fields to update", [
      { issue: "provide label and/or allowedOrigins" },
    ]);
  }
  const row = await prisma.capturePublicKey.update({
    where: { id: keyId },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(allowedOrigins !== undefined ? { allowedOrigins } : {}),
    },
  });
  return c.json(serializeCapturePublicKey(row));
});

v1.delete("/orgs/:orgId/capture-keys/:keyId", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  const keyId = c.req.param("keyId");
  await requireOrgRole(userId, orgId, [MembershipRole.owner, MembershipRole.admin]);
  await requireCapturePublicKey(orgId, keyId);
  await prisma.capturePublicKey.delete({ where: { id: keyId } });
  return c.body(null, 204);
});

v1.post("/orgs/:orgId/capture-keys/:keyId/revoke", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  const keyId = c.req.param("keyId");
  await requireOrgRole(userId, orgId, [MembershipRole.owner, MembershipRole.admin]);
  await requireCapturePublicKey(orgId, keyId);
  const row = await prisma.capturePublicKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
  return c.json(serializeCapturePublicKey(row));
});

v1.post("/orgs/:orgId/capture-keys/:keyId/rotate", async (c) => {
  const { userId } = await requireSession(c);
  const orgId = c.req.param("orgId");
  const keyId = c.req.param("keyId");
  await requireOrgRole(userId, orgId, [MembershipRole.owner, MembershipRole.admin]);
  await requireCapturePublicKey(orgId, keyId);
  const token = `crk_live_${crypto.randomUUID().replace(/-/g, "")}`;
  const row = await prisma.capturePublicKey.update({
    where: { id: keyId },
    data: { token, revokedAt: null },
  });
  return c.json(serializeCapturePublicKey(row));
});

v1.route("/capture", createCapturePublicRouter());

export { v1 };

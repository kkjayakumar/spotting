import type { Context } from "hono";
import { prisma } from "./db";
import { apiError } from "./validation";

function readBearerToken(c: Context): string | null {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length).trim();
}

/** Valid session from `Authorization: Bearer`, or `null` if missing/invalid/expired (does not throw). */
export async function tryReadSession(
  c: Context,
): Promise<{ userId: string; token: string } | null> {
  const token = readBearerToken(c);
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: token },
  });
  if (!session) {
    return null;
  }
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({
      where: { refreshTokenHash: token },
    });
    return null;
  }

  return { userId: session.userId, token: session.refreshTokenHash };
}

export async function requireSession(c: Context): Promise<{ userId: string; token: string }> {
  const token = readBearerToken(c);
  if (!token) {
    throw apiError(401, "UNAUTHORIZED", "Missing bearer token");
  }

  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: token },
  });
  if (!session) {
    throw apiError(401, "UNAUTHORIZED", "Invalid session token");
  }
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({
      where: { refreshTokenHash: token },
    });
    throw apiError(401, "UNAUTHORIZED", "Session expired. Please sign in again.");
  }

  return { userId: session.userId, token: session.refreshTokenHash };
}

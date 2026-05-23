import { beforeEach, describe, expect, it, mock } from "bun:test";
import { HTTPException } from "hono/http-exception";

const findUnique = mock(async (): Promise<{ userId: string; refreshTokenHash: string; expiresAt: Date } | null> => null);
const deleteMany = mock(async () => ({ count: 0 }));

mock.module("./db", () => ({
  prisma: {
    session: {
      findUnique,
      deleteMany,
    },
  },
}));

const { requireSession, tryReadSession } = await import("./auth");

function ctxWithAuthHeader(value?: string) {
  return {
    req: {
      header: (name: string) => (name.toLowerCase() === "authorization" ? value : undefined),
    },
  } as never;
}

describe("requireSession", () => {
  beforeEach(() => {
    findUnique.mockReset();
    deleteMany.mockReset();
  });

  it("fails when bearer token is missing", async () => {
    await expect(requireSession(ctxWithAuthHeader())).rejects.toBeInstanceOf(HTTPException);
    await expect(requireSession(ctxWithAuthHeader("Token abc"))).rejects.toBeInstanceOf(HTTPException);
  });

  it("fails when session token is unknown", async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(requireSession(ctxWithAuthHeader("Bearer bad-token"))).rejects.toBeInstanceOf(HTTPException);
    expect(findUnique).toHaveBeenCalledWith({ where: { refreshTokenHash: "bad-token" } });
  });

  it("deletes expired sessions and rejects request", async () => {
    findUnique.mockResolvedValueOnce({
      userId: "user_1",
      refreshTokenHash: "expired-token",
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(requireSession(ctxWithAuthHeader("Bearer expired-token"))).rejects.toBeInstanceOf(
      HTTPException,
    );
    expect(deleteMany).toHaveBeenCalledWith({ where: { refreshTokenHash: "expired-token" } });
  });

  it("returns userId/token for valid sessions", async () => {
    findUnique.mockResolvedValueOnce({
      userId: "user_1",
      refreshTokenHash: "valid-token",
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(requireSession(ctxWithAuthHeader("Bearer valid-token"))).resolves.toEqual({
      userId: "user_1",
      token: "valid-token",
    });
  });
});

describe("tryReadSession", () => {
  beforeEach(() => {
    findUnique.mockReset();
    deleteMany.mockReset();
  });

  it("returns null when bearer token is missing or malformed", async () => {
    await expect(tryReadSession(ctxWithAuthHeader())).resolves.toBeNull();
    await expect(tryReadSession(ctxWithAuthHeader("Token abc"))).resolves.toBeNull();
  });

  it("returns null when session token is unknown", async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(tryReadSession(ctxWithAuthHeader("Bearer bad-token"))).resolves.toBeNull();
  });

  it("returns null for expired sessions and deletes them", async () => {
    findUnique.mockResolvedValueOnce({
      userId: "user_1",
      refreshTokenHash: "expired-token",
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(tryReadSession(ctxWithAuthHeader("Bearer expired-token"))).resolves.toBeNull();
    expect(deleteMany).toHaveBeenCalledWith({ where: { refreshTokenHash: "expired-token" } });
  });

  it("returns userId/token for valid sessions", async () => {
    findUnique.mockResolvedValueOnce({
      userId: "user_1",
      refreshTokenHash: "valid-token",
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(tryReadSession(ctxWithAuthHeader("Bearer valid-token"))).resolves.toEqual({
      userId: "user_1",
      token: "valid-token",
    });
  });
});

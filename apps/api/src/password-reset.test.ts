import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  user: {
    findUnique: vi.fn(async ({ where }: { where: { email?: string } }) =>
      where.email === "owner@spotting.dev"
        ? {
            id: "user_1",
            email: "owner@spotting.dev",
            name: "Owner",
            passwordHash: "old-hash",
          }
        : null,
    ),
    update: vi.fn(async () => ({ id: "user_1" })),
  },
  passwordResetToken: {
    deleteMany: vi.fn(async () => ({ count: 0 })),
    create: vi.fn(async () => ({ id: "prt_1" })),
    findUnique: vi.fn(async ({ where }: { where: { tokenHash: string } }) =>
      where.tokenHash === "123456"
        ? {
            id: "prt_1",
            userId: "user_1",
            tokenHash: "123456",
            expiresAt: new Date(Date.now() + 60_000),
            consumedAt: null,
          }
        : null,
    ),
    update: vi.fn(async () => ({ id: "prt_1" })),
  },
  session: {
    deleteMany: vi.fn(async () => ({ count: 1 })),
  },
};

vi.mock("./db", () => ({ prisma: prismaMock }));
vi.mock("./email", () => ({
  sendPasswordResetEmail: vi.fn(async () => undefined),
}));
vi.mock("./password", () => ({
  hashPassword: vi.fn(async () => "new-hash"),
}));

const { requestPasswordResetOtp, resetPasswordWithOtp } = await import(
  "./password-reset"
);

describe("password reset service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("silently succeeds for unknown emails", async () => {
    await expect(
      requestPasswordResetOtp("missing@spotting.dev"),
    ).resolves.toBeUndefined();
    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("issues reset OTP for known users", async () => {
    await requestPasswordResetOtp("owner@spotting.dev");
    expect(prismaMock.passwordResetToken.create).toHaveBeenCalled();
  });

  it("resets password with a valid OTP", async () => {
    await resetPasswordWithOtp({
      email: "owner@spotting.dev",
      otp: "123456",
      password: "newpass123",
    });
    expect(prismaMock.user.update).toHaveBeenCalled();
    expect(prismaMock.session.deleteMany).toHaveBeenCalled();
  });
});

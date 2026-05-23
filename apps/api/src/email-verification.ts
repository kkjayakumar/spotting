import { prisma } from "./db";
import { sendVerificationEmail } from "./email";
import type { ApiErrorCode } from "./validation";

const OTP_TTL_MS = 1000 * 60 * 30;

/** Fallback when EmailVerificationToken table is unavailable (tests). */
const inMemoryVerificationOtps = new Map<
  string,
  { userId: string; expiresAtMs: number; consumedAtMs: number | null }
>();

function generateOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return n.toString().padStart(6, "0");
}

function hasTokenStore(): boolean {
  const store = (prisma as { emailVerificationToken?: unknown }).emailVerificationToken;
  return (
    Boolean(store) &&
    typeof (store as { deleteMany?: unknown }).deleteMany === "function" &&
    typeof (store as { create?: unknown }).create === "function" &&
    typeof (store as { findUnique?: unknown }).findUnique === "function"
  );
}

export async function issueAndSendEmailVerificationOtp(input: {
  userId: string;
  email: string;
  name: string;
}): Promise<string> {
  const { userId, email, name } = input;
  const otp = generateOtp();

  if (hasTokenStore()) {
    await prisma.emailVerificationToken.deleteMany({
      where: { userId, consumedAt: null },
    });
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: otp,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
  } else {
    inMemoryVerificationOtps.set(otp, {
      userId,
      expiresAtMs: Date.now() + OTP_TTL_MS,
      consumedAtMs: null,
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { verificationSentAt: new Date() },
  });

  await sendVerificationEmail({
    to: email,
    name,
    code: otp,
  });

  return otp;
}

export async function verifyEmailOtp(userId: string, otp: string): Promise<void> {
  const normalized = otp.trim();

  if (hasTokenStore()) {
    const verification = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: normalized },
    });
    if (!verification || verification.userId !== userId) {
      throw new Error("INVALID_OTP");
    }
    if (verification.consumedAt) {
      throw new Error("OTP_ALREADY_USED");
    }
    if (verification.expiresAt.getTime() <= Date.now()) {
      throw new Error("OTP_EXPIRED");
    }
    await prisma.emailVerificationToken.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() },
    });
  } else {
    const verification = inMemoryVerificationOtps.get(normalized);
    if (!verification || verification.userId !== userId) {
      throw new Error("INVALID_OTP");
    }
    if (verification.consumedAtMs) {
      throw new Error("OTP_ALREADY_USED");
    }
    if (verification.expiresAtMs <= Date.now()) {
      throw new Error("OTP_EXPIRED");
    }
    verification.consumedAtMs = Date.now();
    inMemoryVerificationOtps.set(normalized, verification);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
}

export function mapVerificationError(error: unknown): {
  status: 400 | 409 | 410 | 500;
  code: ApiErrorCode;
  message: string;
} {
  const key = error instanceof Error ? error.message : "";
  switch (key) {
    case "INVALID_OTP":
      return {
        status: 400,
        code: "BAD_REQUEST",
        message: "Invalid verification code",
      };
    case "OTP_ALREADY_USED":
      return {
        status: 409,
        code: "CONFLICT",
        message: "Verification code already used",
      };
    case "OTP_EXPIRED":
      return {
        status: 410,
        code: "GONE",
        message: "Verification code expired. Request a new one.",
      };
    default:
      return {
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Could not verify email",
      };
  }
}

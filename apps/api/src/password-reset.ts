/**
 * Spotting password reset OTP flow.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { prisma } from "./db";
import { sendPasswordResetEmail } from "./email";
import { hashPassword } from "./password";
import type { ApiErrorCode } from "./validation";

const OTP_TTL_MS = 1000 * 60 * 30;

const inMemoryResetOtps = new Map<
  string,
  { userId: string; expiresAtMs: number; consumedAtMs: number | null }
>();

function generateOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return n.toString().padStart(6, "0");
}

function hasResetTokenStore(): boolean {
  const store = (prisma as { passwordResetToken?: unknown }).passwordResetToken;
  return (
    Boolean(store) &&
    typeof (store as { deleteMany?: unknown }).deleteMany === "function" &&
    typeof (store as { create?: unknown }).create === "function" &&
    typeof (store as { findUnique?: unknown }).findUnique === "function"
  );
}

export async function requestPasswordResetOtp(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return;
  }

  const otp = generateOtp();

  if (hasResetTokenStore()) {
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, consumedAt: null },
    });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: otp,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
  } else {
    inMemoryResetOtps.set(otp, {
      userId: user.id,
      expiresAtMs: Date.now() + OTP_TTL_MS,
      consumedAtMs: null,
    });
  }

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    code: otp,
  });
}

export async function resetPasswordWithOtp(input: {
  email: string;
  otp: string;
  password: string;
}): Promise<void> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const otp = input.otp.trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error("INVALID_OTP");
  }

  if (hasResetTokenStore()) {
    const token = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: otp },
    });
    if (!token || token.userId !== user.id) {
      throw new Error("INVALID_OTP");
    }
    if (token.consumedAt) {
      throw new Error("OTP_ALREADY_USED");
    }
    if (token.expiresAt.getTime() <= Date.now()) {
      throw new Error("OTP_EXPIRED");
    }
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });
  } else {
    const token = inMemoryResetOtps.get(otp);
    if (!token || token.userId !== user.id) {
      throw new Error("INVALID_OTP");
    }
    if (token.consumedAtMs) {
      throw new Error("OTP_ALREADY_USED");
    }
    if (token.expiresAtMs <= Date.now()) {
      throw new Error("OTP_EXPIRED");
    }
    token.consumedAtMs = Date.now();
    inMemoryResetOtps.set(otp, token);
  }

  const passwordHash = await hashPassword(input.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await prisma.session.deleteMany({ where: { userId: user.id } });
}

export function mapPasswordResetError(error: unknown): {
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
        message: "Invalid reset code",
      };
    case "OTP_ALREADY_USED":
      return {
        status: 409,
        code: "CONFLICT",
        message: "Reset code already used",
      };
    case "OTP_EXPIRED":
      return {
        status: 410,
        code: "GONE",
        message: "Reset code expired. Request a new one.",
      };
    default:
      return {
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Could not reset password",
      };
  }
}

import * as z from "zod"

import { organizationFormSchema } from "@/lib/schema/organization"

const CAPTURE_ORIGIN_SPLIT_PATTERN = /\r?\n|,/

function parseCaptureOriginLines(value: string): string[] {
  return value
    .split(CAPTURE_ORIGIN_SPLIT_PATTERN)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

/** Empty string = allow all domains (API stores `[]`). */
function hasOnlyValidCaptureOrigins(value: string): boolean {
  const entries = parseCaptureOriginLines(value)
  if (entries.length === 0) {
    return true
  }

  return entries.every((entry) => {
    if (entry === "*") {
      return true
    }
    try {
      const parsedOrigin = new URL(entry)
      return (
        parsedOrigin.protocol === "http:" || parsedOrigin.protocol === "https:"
      )
    } catch {
      return false
    }
  })
}

const captureOriginsFieldSchema = z
  .string()
  .refine(hasOnlyValidCaptureOrigins, {
    message: "Use one valid HTTP(S) origin per line, or leave empty for any domain.",
  })

export const userNameFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export const userPasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const organizationSettingsFormSchema = organizationFormSchema

export const captureKeyCreateFormSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(80),
  allowedOrigins: captureOriginsFieldSchema,
})

export const captureKeyOriginsFormSchema = z.object({
  allowedOrigins: captureOriginsFieldSchema,
})

export const inviteMemberFormSchema = z.object({
  email: z.email("Enter a valid email address"),
  role: z.enum(["admin", "member"]),
})

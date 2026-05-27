/**
 * Spotting auth form schemas.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { z } from "zod"

import { AUTH_MIN_PASSWORD_LENGTH } from "@/lib/auth"

const emailField = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address")

const passwordField = z
  .string()
  .min(AUTH_MIN_PASSWORD_LENGTH, `Password must be at least ${AUTH_MIN_PASSWORD_LENGTH} characters`)

export const loginFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
})

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    }
  })

export const verifyEmailOtpFormSchema = z.object({
  otp: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be 6 digits"),
})

export const forgotPasswordRequestSchema = z.object({
  email: emailField,
})

export const forgotPasswordResetSchema = z
  .object({
    email: emailField,
    otp: z.string().length(6, "Code must be 6 digits"),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    }
  })

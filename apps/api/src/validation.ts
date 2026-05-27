import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "GONE"
  | "INTERNAL_ERROR";

type ErrorDetail = { field?: string; issue: string };
type ApiStatus = 400 | 401 | 403 | 404 | 409 | 410 | 500;

export function apiError(
  status: ApiStatus,
  code: ApiErrorCode,
  message: string,
  details?: ErrorDetail[],
): HTTPException {
  return new HTTPException(status, {
    message,
    cause: {
      code,
      details: details ?? [],
    },
  });
}

export async function readJsonBody<T>(c: Context): Promise<T> {
  try {
    return (await c.req.json()) as T;
  } catch {
    throw apiError(400, "BAD_REQUEST", "Malformed JSON request body");
  }
}

export function requireNonEmptyString(
  value: unknown,
  field: string,
  options?: { lowercase?: boolean; minLength?: number },
): string {
  if (typeof value !== "string") {
    throw apiError(400, "VALIDATION_ERROR", `Invalid ${field}`, [
      { field, issue: "must be a string" },
    ]);
  }
  let normalized = value.trim();
  if (options?.lowercase) normalized = normalized.toLowerCase();
  if (!normalized) {
    throw apiError(400, "VALIDATION_ERROR", `Invalid ${field}`, [
      { field, issue: "is required" },
    ]);
  }
  if (options?.minLength && normalized.length < options.minLength) {
    throw apiError(400, "VALIDATION_ERROR", `Invalid ${field}`, [
      { field, issue: `must be at least ${options.minLength} characters` },
    ]);
  }
  return normalized;
}

export function optionalTrimmedString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw apiError(400, "VALIDATION_ERROR", "Invalid string field", [
      { issue: "must be a string" },
    ]);
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function optionalEnumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw apiError(400, "VALIDATION_ERROR", `Invalid ${field}`, [
      { field, issue: `must be one of: ${allowed.join(", ")}` },
    ]);
  }
  return value as T;
}

export function parsePositiveInt(
  value: string | undefined,
  field: string,
  options?: { min?: number; max?: number; fallback?: number },
): number {
  const fallback = options?.fallback ?? 1;
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw apiError(400, "VALIDATION_ERROR", `Invalid ${field}`, [
      { field, issue: "must be an integer" },
    ]);
  }
  const min = options?.min ?? 1;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;
  if (parsed < min || parsed > max) {
    throw apiError(400, "VALIDATION_ERROR", `Invalid ${field}`, [
      { field, issue: `must be between ${min} and ${max}` },
    ]);
  }
  return parsed;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function emailsMatch(left: string, right: string): boolean {
  return normalizeEmail(left) === normalizeEmail(right);
}

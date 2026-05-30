import { NextResponse } from "next/server"

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const COOKIE_NAME = "spotting_token"

function sessionCookieOptions() {
  return {
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  }
}

export async function POST(request: Request) {
  let token: unknown
  try {
    const body = (await request.json()) as { token?: unknown }
    token = body.token
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, token, sessionCookieOptions())
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  })
  return response
}

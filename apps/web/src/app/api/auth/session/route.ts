import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

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

  const cookieStore = await cookies()
  cookieStore.set("spotting_token", token, {
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("spotting_token")
  return NextResponse.json({ ok: true })
}

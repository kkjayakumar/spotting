import { NextResponse } from "next/server"

import { readSessionToken } from "@/lib/read-session-token"
import { getServerApiOrigin } from "@/lib/server-api-origin"

export const dynamic = "force-dynamic"

export async function GET() {
  const token = await readSessionToken()
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const api = getServerApiOrigin()
  const upstream = await fetch(`${api}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  const body = await upstream.text()
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  })
}

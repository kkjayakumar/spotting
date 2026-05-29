import { NextResponse } from "next/server"

/** @deprecated Use /api/extension-download/chrome */
export async function GET(request: Request) {
  const url = new URL(request.url)
  return NextResponse.redirect(
    new URL("/api/extension-download/chrome", url.origin),
    307,
  )
}

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Forward spotting_token to Authorization for SSR/RSC API calls.
 * Complements cookies() in server components (some deployments omit Cookie from headers()).
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("spotting_token")?.value
  if (!token) {
    return NextResponse.next()
  }

  const headers = new Headers(request.headers)
  if (!headers.get("authorization")) {
    headers.set("authorization", `Bearer ${token}`)
  }

  return NextResponse.next({
    request: { headers },
  })
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/invite/:path*",
  ],
}

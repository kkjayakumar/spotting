/** Sync bearer token into an HttpOnly cookie so SSR protected routes can authenticate. */
export async function syncSessionCookie(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "include",
    })
    return response.ok
  } catch {
    return false
  }
}

/** Set session cookie then hard-navigate (avoids client-side redirect loops). */
export async function finishAuthRedirect(path: string): Promise<void> {
  try {
    const token = localStorage.getItem("spotting_token")
    if (token) {
      await syncSessionCookie(token)
    }
  } catch {
    /* localStorage blocked */
  }
  window.location.assign(path)
}

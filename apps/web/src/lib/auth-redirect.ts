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
  let token: string | null = null
  try {
    token = localStorage.getItem("spotting_token")
  } catch {
    /* localStorage blocked */
  }

  if (token) {
    const synced = await syncSessionCookie(token)
    if (!synced && typeof document !== "undefined") {
      const secure =
        window.location.protocol === "https:" ? "; Secure" : ""
      document.cookie = `${"spotting_token"}=${token}; path=/; max-age=604800; SameSite=Lax${secure}`
    }
  }

  window.location.assign(path)
}

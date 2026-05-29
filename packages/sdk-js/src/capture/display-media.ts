/**
 * Safari requires getDisplayMedia() to be invoked synchronously inside a user-gesture
 * handler. Call requestDisplayMediaStream() directly from click/tap handlers — do not
 * await other work before calling it.
 */
export function requestDisplayMediaStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    return Promise.reject(
      new Error("Screen capture is not supported in this browser."),
    );
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
  const isFirefox = ua.includes("firefox");

  // Firefox is strict about optional displaySurface constraints; keep the request minimal.
  if (isFirefox) {
    return navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
  }

  return navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: "browser",
    },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: "include",
    surfaceSwitching: "exclude",
    monitorTypeSurfaces: "exclude",
  } as DisplayMediaStreamOptions);
}

export function isUserGestureMediaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "NotAllowedError" ||
    error.message.includes("user gesture") ||
    error.message.includes("getDisplayMedia must be called")
  );
}

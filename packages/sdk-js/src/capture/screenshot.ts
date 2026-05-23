/**
 * Captures a single video frame via getDisplayMedia (user picks tab/window).
 * Returns PNG blob or null if cancelled.
 */
export async function captureScreenshotPng(): Promise<Blob | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Screen capture is not supported in this browser.");
  }

  let stream: MediaStream | null = null;
  try {
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
        preferCurrentTab: true,
      } as MediaStreamConstraints & { preferCurrentTab?: boolean });
    } catch {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
    }
  } catch (e) {
    const err = e as DOMException;
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      throw new Error(
        "Screen capture was blocked. Allow screen sharing when prompted, or check browser permissions.",
      );
    }
    if (err.name === "AbortError") {
      return null;
    }
    throw new Error(
      err.message || "Could not start screen capture for screenshot.",
    );
  }

  const track = stream.getVideoTracks()[0];
  if (!track) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("No video track from screen capture.");
  }

  const video = document.createElement("video");
  video.playsInline = true;
  video.muted = true;
  video.srcObject = stream;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not load capture preview."));
      void video.play().catch(reject);
    });

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create screenshot canvas.");
    }
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png");
    });
    if (!blob || blob.size === 0) {
      throw new Error("Screenshot was empty.");
    }
    return blob;
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

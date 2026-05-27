import { isUserGestureMediaError, requestDisplayMediaStream } from "./display-media";

function mapDisplayMediaError(error: unknown): Error {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return new Error(
        "Screen capture was blocked. Allow screen sharing when prompted, or check browser permissions.",
      );
    }
    if (error.name === "AbortError") {
      return new Error("Screenshot cancelled.");
    }
    if (isUserGestureMediaError(error)) {
      return new Error(
        "Safari requires a direct click on the page to capture the screen. Use the on-page prompt or widget button.",
      );
    }
  }
  if (error instanceof Error) return error;
  return new Error("Could not start screen capture for screenshot.");
}

export async function captureScreenshotFromStream(
  stream: MediaStream,
): Promise<Blob | null> {
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

/** Prefer requestDisplayMediaStream() from a click handler, then captureScreenshotFromStream(). */
export async function captureScreenshotPng(): Promise<Blob | null> {
  try {
    const stream = await requestDisplayMediaStream();
    return await captureScreenshotFromStream(stream);
  } catch (error) {
    if (error instanceof Error && error.message === "Screenshot cancelled.") {
      return null;
    }
    throw mapDisplayMediaError(error);
  }
}

export async function captureScreenshotFromStreamPromise(
  streamPromise: Promise<MediaStream>,
): Promise<Blob | null> {
  try {
    const stream = await streamPromise;
    return await captureScreenshotFromStream(stream);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    throw mapDisplayMediaError(error);
  }
}

import { isUserGestureMediaError, requestDisplayMediaStream } from "./display-media";

export interface RecorderState {
  stop: () => Promise<Blob | null>;
  isRecording: () => boolean;
}

export type AttachRecorderOptions = {
  onShareEnded?: (blob: Blob | null) => void;
};

let mediaRecorder: MediaRecorder | null = null;
let chunks: BlobPart[] = [];
let stream: MediaStream | null = null;
let stopping = false;
let activeStopPromise: Promise<Blob | null> | null = null;

function isFirefox(): boolean {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
  return ua.includes("firefox");
}

function pickMime(): string | undefined {
  // Firefox can report support for codec strings but still produce empty blobs
  // for display-media tab streams; let Firefox choose defaults.
  if (isFirefox()) {
    return undefined;
  }

  const cands = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  for (const m of cands) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

function mapDisplayMediaError(error: unknown): Error {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return new Error(
        "Recording was blocked. Allow screen sharing when prompted.",
      );
    }
    if (error.name === "AbortError") {
      return new Error("Recording was cancelled.");
    }
    if (isUserGestureMediaError(error)) {
      return new Error(
        "Click Allow recording on the page first, then choose a tab or window in the browser picker.",
      );
    }
  }
  if (error instanceof Error) return error;
  return new Error("Could not start screen recording.");
}

function buildBlob(rec: MediaRecorder): Blob | null {
  if (chunks.length === 0) {
    return null;
  }
  return new Blob(chunks, { type: rec.mimeType || "video/webm" });
}

function buildBlobFromChunks(mimeType?: string): Blob | null {
  if (chunks.length === 0) {
    return null;
  }
  return new Blob(chunks, { type: mimeType || "video/webm" });
}

export async function attachRecorderToStream(
  displayStream: MediaStream,
  options?: AttachRecorderOptions,
): Promise<RecorderState> {
  stream = displayStream;
  chunks = [];
  stopping = false;
  const mimeType = pickMime();
  mediaRecorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Firefox often emits no data with short timeslices on display-media streams.
  if (isFirefox()) {
    mediaRecorder.start();
  } else {
    mediaRecorder.start(250);
  }

  const stop = async (): Promise<Blob | null> => {
    if (stopping) {
      return activeStopPromise;
    }
    stopping = true;

    const rec = mediaRecorder;
    const s = stream;
    mediaRecorder = null;
    stream = null;

    if (!rec || rec.state === "inactive") {
      s?.getTracks().forEach((t) => t.stop());
      const blob = buildBlobFromChunks(rec?.mimeType);
      chunks = [];
      stopping = false;
      return blob;
    }

    activeStopPromise = new Promise<Blob | null>((resolve) => {
      let settled = false;
      const settle = (blob: Blob | null) => {
        if (settled) {
          return;
        }
        settled = true;
        s?.getTracks().forEach((t) => t.stop());
        chunks = [];
        stopping = false;
        activeStopPromise = null;
        resolve(blob);
      };

      rec.addEventListener(
        "stop",
        () => {
          settle(buildBlob(rec));
        },
        { once: true },
      );

      try {
        if (rec.state === "recording") {
          rec.requestData();
          if (isFirefox()) {
            rec.requestData();
          }
        }
        rec.stop();
      } catch {
        settle(buildBlobFromChunks(rec.mimeType));
      }

      // Firefox occasionally misses the "stop" event callback despite recorder stop.
      const fallbackMs = isFirefox() ? 2500 : 1500;
      setTimeout(() => {
        settle(buildBlobFromChunks(rec.mimeType));
      }, fallbackMs);
    });
    return await activeStopPromise;
  };

  for (const track of displayStream.getVideoTracks()) {
    track.addEventListener(
      "ended",
      () => {
        if (mediaRecorder?.state === "recording" && !stopping) {
          void stop().then((blob) => options?.onShareEnded?.(blob));
        }
      },
      { once: true },
    );
  }

  return {
    stop,
    isRecording: () => mediaRecorder?.state === "recording",
  };
}

/** Prefer calling requestDisplayMediaStream() from a click handler, then attachRecorderToStream(). */
export async function startScreenRecording(): Promise<RecorderState> {
  try {
    const displayStream = await requestDisplayMediaStream();
    await stopScreenRecording();
    return attachRecorderToStream(displayStream);
  } catch (error) {
    throw mapDisplayMediaError(error);
  }
}

export async function startScreenRecordingFromStreamPromise(
  streamPromise: Promise<MediaStream>,
  options?: AttachRecorderOptions,
): Promise<RecorderState> {
  try {
    await stopScreenRecording();
    const displayStream = await streamPromise;
    return attachRecorderToStream(displayStream, options);
  } catch (error) {
    throw mapDisplayMediaError(error);
  }
}

export async function stopScreenRecording(): Promise<Blob | null> {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    chunks = [];
    return null;
  }
  return await new Promise<Blob | null>((resolve) => {
    const rec = mediaRecorder!;
    const s = stream!;
    rec.addEventListener(
      "stop",
      () => {
        s.getTracks().forEach((t) => t.stop());
        stream = null;
        mediaRecorder = null;
        const blob = buildBlob(rec);
        chunks = [];
        resolve(blob);
      },
      { once: true },
    );
    try {
      if (rec.state === "recording") {
        rec.requestData();
      }
      rec.stop();
    } catch {
      s.getTracks().forEach((t) => t.stop());
      stream = null;
      mediaRecorder = null;
      chunks = [];
      resolve(null);
    }
  });
}

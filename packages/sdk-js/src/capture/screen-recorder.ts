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

function pickMime(): string | undefined {
  const cands = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
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

  // Smaller slices so short recordings still produce data before stop.
  mediaRecorder.start(250);

  const stop = async (): Promise<Blob | null> => {
    if (stopping) {
      return null;
    }
    stopping = true;

    const rec = mediaRecorder;
    const s = stream;
    mediaRecorder = null;
    stream = null;

    if (!rec || rec.state === "inactive") {
      s?.getTracks().forEach((t) => t.stop());
      chunks = [];
      stopping = false;
      return null;
    }

    return await new Promise<Blob | null>((resolve) => {
      rec.addEventListener(
        "stop",
        () => {
          s?.getTracks().forEach((t) => t.stop());
          const blob = buildBlob(rec);
          chunks = [];
          stopping = false;
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
        s?.getTracks().forEach((t) => t.stop());
        chunks = [];
        stopping = false;
        resolve(null);
      }
    });
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

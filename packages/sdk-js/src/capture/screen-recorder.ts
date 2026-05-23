export interface RecorderState {
  stop: () => Promise<Blob | null>;
  isRecording: () => boolean;
}

let mediaRecorder: MediaRecorder | null = null;
let chunks: BlobPart[] = [];
let stream: MediaStream | null = null;

function pickMime(): string | undefined {
  const cands = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const m of cands) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

export async function startScreenRecording(): Promise<RecorderState> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Screen recording is not supported in this browser");
  }

  await stopScreenRecording();

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
      preferCurrentTab: true,
    } as MediaStreamConstraints & { preferCurrentTab?: boolean });
  } catch (e) {
    const err = e as DOMException;
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      throw new Error(
        "Recording was blocked. Allow screen sharing when prompted.",
      );
    }
    if (err.name === "AbortError") {
      throw new Error("Recording was cancelled.");
    }
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
    } catch (inner) {
      const innerErr = inner as DOMException;
      throw new Error(
        innerErr.message || "Could not start screen recording.",
      );
    }
  }

  chunks = [];
  const mimeType = pickMime();
  mediaRecorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start(1000);

  const stop = async (): Promise<Blob | null> => {
    const rec = mediaRecorder;
    const s = stream;
    mediaRecorder = null;
    stream = null;
    if (!rec || rec.state === "inactive") {
      s?.getTracks().forEach((t) => t.stop());
      return null;
    }
    return await new Promise<Blob | null>((resolve) => {
      rec.addEventListener(
        "stop",
        () => {
          s?.getTracks().forEach((t) => t.stop());
          const blob =
            chunks.length > 0
              ? new Blob(chunks, { type: rec.mimeType || "video/webm" })
              : null;
          chunks = [];
          resolve(blob);
        },
        { once: true },
      );
      rec.stop();
    });
  };

  return {
    stop,
    isRecording: () => mediaRecorder?.state === "recording",
  };
}

export async function stopScreenRecording(): Promise<Blob | null> {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
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
        const blob =
          chunks.length > 0
            ? new Blob(chunks, { type: rec.mimeType || "video/webm" })
            : null;
        chunks = [];
        resolve(blob);
      },
      { once: true },
    );
    rec.stop();
  });
}

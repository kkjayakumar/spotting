import { requestDisplayMediaStream } from "../capture/display-media";

export type CaptureGestureAction = "record" | "screenshot";

const PROMPT_ID = "spotting-capture-gesture-prompt";

function removeExistingPrompt() {
  document.getElementById(PROMPT_ID)?.remove();
}

/**
 * Safari rejects getDisplayMedia from extension popups. Show a one-click on-page prompt
 * and invoke getDisplayMedia synchronously inside that click handler.
 */
export function promptCaptureUserGesture(
  action: CaptureGestureAction,
): Promise<MediaStream> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Screen capture is not available here."));
  }

  removeExistingPrompt();

  return new Promise((resolve, reject) => {
    const overlay = document.createElement("div");
    overlay.id = PROMPT_ID;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:24px",
      "background:rgba(2,6,23,0.72)",
      "backdrop-filter:blur(6px)",
    ].join(";");

    const card = document.createElement("div");
    card.style.cssText = [
      "width:min(420px,100%)",
      "padding:20px",
      "border-radius:16px",
      "background:#0f172a",
      "color:#e2e8f0",
      "border:1px solid rgba(148,163,184,0.25)",
      "box-shadow:0 24px 64px rgba(0,0,0,0.45)",
      "font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    ].join(";");

    const title = document.createElement("p");
    title.textContent =
      action === "record" ? "Start tab recording" : "Capture screenshot";
    title.style.cssText = "margin:0 0 8px;font-size:16px;color:#fff";

    const copy = document.createElement("p");
    copy.textContent =
      "Click Allow below, then choose the tab or window to share in your browser picker.";
    copy.style.cssText = "margin:0 0 16px;font-size:13px;color:#94a3b8;font-weight:400";

    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";
    cancel.style.cssText =
      "flex:1;padding:10px 12px;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:transparent;color:#e2e8f0;cursor:pointer";

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.textContent =
      action === "record" ? "Allow recording" : "Allow screenshot";
    confirm.style.cssText =
      "flex:1;padding:10px 12px;border-radius:10px;border:none;background:#00BFFF;color:#020617;font-weight:700;cursor:pointer";

    const cleanup = () => {
      overlay.remove();
    };

    cancel.addEventListener("click", () => {
      cleanup();
      reject(
        new Error(
          action === "record" ? "Recording cancelled." : "Screenshot cancelled.",
        ),
      );
    });

    confirm.addEventListener("click", () => {
      let streamPromise: Promise<MediaStream>;
      try {
        streamPromise = requestDisplayMediaStream();
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error("Screen capture failed."));
        return;
      }

      cleanup();
      resolve(streamPromise);
    });

    row.append(cancel, confirm);
    card.append(title, copy, row);
    overlay.append(card);
    document.documentElement.appendChild(overlay);
    confirm.focus();
  });
}

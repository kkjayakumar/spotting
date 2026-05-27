const INDICATOR_ID = "spotting-headless-recording-indicator";

export function showHeadlessRecordingIndicator(): void {
  if (typeof document === "undefined") {
    return;
  }
  removeHeadlessRecordingIndicator();

  const badge = document.createElement("div");
  badge.id = INDICATOR_ID;
  badge.setAttribute("role", "status");
  badge.setAttribute("aria-live", "polite");
  badge.style.cssText = [
    "position:fixed",
    "left:16px",
    "bottom:16px",
    "z-index:2147483646",
    "display:inline-flex",
    "align-items:center",
    "gap:8px",
    "padding:10px 14px",
    "border-radius:999px",
    "background:rgba(15,23,42,0.94)",
    "color:#f8fafc",
    "border:1px solid rgba(220,38,38,0.45)",
    "box-shadow:0 8px 32px rgba(0,0,0,0.35)",
    "font:600 13px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    "pointer-events:none",
  ].join(";");

  const dot = document.createElement("span");
  dot.style.cssText =
    "width:10px;height:10px;border-radius:999px;background:#ef4444;box-shadow:0 0 0 0 rgba(239,68,68,0.6);animation:spotting-rec-pulse 1.4s infinite";
  dot.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.textContent = "Spotting · Recording";

  const style = document.createElement("style");
  style.textContent =
    "@keyframes spotting-rec-pulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,0.55)}70%{box-shadow:0 0 0 10px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}";

  badge.append(style, dot, label);
  document.documentElement.appendChild(badge);
}

export function removeHeadlessRecordingIndicator(): void {
  document.getElementById(INDICATOR_ID)?.remove();
}

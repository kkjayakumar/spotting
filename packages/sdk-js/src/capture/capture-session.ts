import { clearConsoleLog } from "./console-interceptor";
import { clearNetworkLog, snapshotResourceTimings } from "./network-interceptor";
import { clearUserActionLog, recordSessionNavigation } from "./user-actions";

let sessionStartedAt: number | null = null;
let sessionEndedAt: number | null = null;

export function markCaptureSessionStart() {
  sessionStartedAt = Date.now();
  sessionEndedAt = null;
  clearNetworkLog();
  clearConsoleLog();
  clearUserActionLog();
  // Seed the cleared log with resources already loaded on the page (js/css/font/img/doc),
  // so the Network panel shows ALL types — not only requests made during the recording.
  snapshotResourceTimings();
  recordSessionNavigation();
}

export function markCaptureSessionEnd() {
  sessionEndedAt = Date.now();
}

export function getCaptureSessionStartedAt(): number | null {
  return sessionStartedAt;
}

export function getCaptureSessionEndedAt(): number | null {
  return sessionEndedAt;
}

export function getCaptureSessionDurationMs(): number | null {
  if (sessionStartedAt === null) return null;
  const end = sessionEndedAt ?? Date.now();
  return Math.max(0, end - sessionStartedAt);
}

export function resetCaptureSession() {
  sessionStartedAt = null;
  sessionEndedAt = null;
}

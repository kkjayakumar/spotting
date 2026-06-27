export type NetworkResourceType =
  | "fetch"
  | "xhr"
  | "ws"
  | "script"
  | "css"
  | "img"
  | "media"
  | "font"
  | "doc"
  | "other";

export interface NetworkLogEntry {
  id: string;
  t: number;
  type: NetworkResourceType;
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  correlationId?: string;
  error?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
}

export interface ConsoleLogEntry {
  id: string;
  t: number;
  level: "log" | "warn" | "error" | "info" | "debug";
  args: string[];
}

export interface UserActionLogEntry {
  id: string;
  t: number;
  type: string;
  target: string | null;
  metadata?: Record<string, unknown>;
}

export interface CaptureMetadata {
  network: NetworkLogEntry[];
  console: ConsoleLogEntry[];
  actions?: UserActionLogEntry[];
  userAgent: string;
  language: string;
  viewport: { w: number; h: number };
  recordingMimeType?: string;
  /** Wall-clock ms when screen recording started (video timeline zero). */
  captureSessionStartedAt?: number;
  captureSessionEndedAt?: number;
  /** Recording length in ms (for video scrubber). */
  durationMs?: number;
  correlationId?: string;
}

export interface SpottingInitOptions {
  /** Public key (e.g. spk_live_â€¦) */
  publicKey: string;
  /** API base URL without trailing slash (e.g. http://localhost:3002) */
  apiBaseUrl: string;
  /** Optional label shown on the floating button */
  buttonLabel?: string;
  /** Dashboard base URL for â€œview reportâ€ links (e.g. http://localhost:3003) */
  dashboardUrl?: string;
  /** Max stored network events (default 200) */
  maxNetworkEvents?: number;
  /** Max stored console events (default 400) */
  maxConsoleEvents?: number;
  /**
   * No floating widget on the page (extension popup owns the UI).
   * Capture hooks still run in the background.
   */
  headless?: boolean;
}

export interface SubmitCaptureInput {
  title: string;
  description?: string;
  /** Page URL at submit time (default: location.href) */
  pageUrl?: string;
  /** Optional PNG screenshot (from getDisplayMedia or extension) */
  screenshotBlob?: Blob | null;
  /** Optional WebM / screen recording */
  recordingBlob?: Blob | null;
}


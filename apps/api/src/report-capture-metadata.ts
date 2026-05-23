/** Map SDK capture metadata (stored on Report.metadataJson) to debugger UI shapes. */

type JsonRecord = Record<string, unknown>;

export type CaptureConsoleEntry = {
  id: string;
  t: number;
  level: string;
  args: string[];
};

export type CaptureNetworkEntry = {
  id: string;
  t: number;
  type: string;
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  error?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
};

export type DebuggerActionDto = {
  id: string;
  type: string;
  target: string | null;
  timestamp: string;
  offset: number;
  metadata?: JsonRecord;
};

export type DebuggerLogDto = {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  offset: number;
};

export type DebuggerNetworkRequestDto = {
  id: string;
  method: string;
  url: string;
  status: number | null;
  duration: number | null;
  timestamp: string;
  offset: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
};

function asRecord(value: unknown): JsonRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => (typeof v === "string" ? v : String(v)));
}

function headersRecord(value: unknown): Record<string, string> | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === "string") out[key] = val;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseConsoleEntry(raw: unknown): CaptureConsoleEntry | null {
  const row = asRecord(raw);
  if (!row || typeof row.id !== "string") return null;
  const t = typeof row.t === "number" ? row.t : Number(row.t);
  if (!Number.isFinite(t)) return null;
  const level = typeof row.level === "string" ? row.level : "log";
  return {
    id: row.id,
    t,
    level,
    args: asStringArray(row.args),
  };
}

function parseNetworkEntry(raw: unknown): CaptureNetworkEntry | null {
  const row = asRecord(raw);
  if (!row || typeof row.id !== "string") return null;
  const t = typeof row.t === "number" ? row.t : Number(row.t);
  if (!Number.isFinite(t)) return null;
  const method = typeof row.method === "string" ? row.method : "GET";
  const url = typeof row.url === "string" ? row.url : "";
  if (!url) return null;
  return {
    id: row.id,
    t,
    type: typeof row.type === "string" ? row.type : "fetch",
    method,
    url,
    status: typeof row.status === "number" ? row.status : undefined,
    durationMs: typeof row.durationMs === "number" ? row.durationMs : undefined,
    error: typeof row.error === "string" ? row.error : undefined,
    requestHeaders: headersRecord(row.requestHeaders),
    responseHeaders: headersRecord(row.responseHeaders),
    requestBody: typeof row.requestBody === "string" ? row.requestBody : undefined,
    responseBody:
      typeof row.responseBody === "string" ? row.responseBody : undefined,
  };
}

export function parseCaptureMetadata(metadataJson: unknown) {
  const meta = asRecord(metadataJson) ?? {};
  const network = Array.isArray(meta.network)
    ? meta.network
        .map(parseNetworkEntry)
        .filter((e): e is CaptureNetworkEntry => e !== null)
    : [];
  const consoleEntries = Array.isArray(meta.console)
    ? meta.console
        .map(parseConsoleEntry)
        .filter((e): e is CaptureConsoleEntry => e !== null)
    : [];
  return { network, console: consoleEntries };
}

function sessionStartFromMetadata(metadataJson: unknown): number | null {
  const meta = asRecord(metadataJson);
  if (!meta) return null;
  const v = meta.captureSessionStartedAt;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function actionTimesFromMetadata(metadataJson: unknown): number[] {
  const meta = asRecord(metadataJson) ?? {};
  if (!Array.isArray(meta.actions)) return [];
  return meta.actions
    .map((raw) => {
      const row = asRecord(raw);
      if (!row) return NaN;
      const t = typeof row.t === "number" ? row.t : Number(row.t);
      return t;
    })
    .filter(Number.isFinite);
}

function computeBaseTimeMs(
  metadataJson: unknown,
  network: CaptureNetworkEntry[],
  consoleEntries: CaptureConsoleEntry[],
  reportCreatedAt: Date,
): number {
  const sessionStart = sessionStartFromMetadata(metadataJson);
  if (sessionStart !== null) {
    return sessionStart;
  }

  const times = [
    ...network.map((n) => n.t),
    ...consoleEntries.map((c) => c.t),
    ...actionTimesFromMetadata(metadataJson),
  ].filter(Number.isFinite);
  if (times.length > 0) {
    return Math.min(...times);
  }
  return reportCreatedAt.getTime();
}

function navigationMetadataFromUrl(pageUrl: string): JsonRecord {
  try {
    const url = new URL(pageUrl);
    return {
      path: `${url.pathname}${url.search}`,
      search: url.search || null,
      hash: url.hash || null,
      title: pageUrl,
      mode: "initial",
    };
  } catch {
    return { path: pageUrl, title: pageUrl, mode: "initial" };
  }
}

function parseUserActionEntry(raw: unknown): {
  id: string;
  t: number;
  type: string;
  target: string | null;
  metadata?: JsonRecord;
} | null {
  const row = asRecord(raw);
  if (!row || typeof row.id !== "string" || typeof row.type !== "string") {
    return null;
  }
  const t = typeof row.t === "number" ? row.t : Number(row.t);
  if (!Number.isFinite(t)) return null;
  return {
    id: row.id,
    t,
    type: row.type,
    target: typeof row.target === "string" ? row.target : null,
    metadata: asRecord(row.metadata) ?? undefined,
  };
}

export function buildDebuggerEventsFromCapture(input: {
  metadataJson: unknown;
  pageUrl: string | null;
  reportCreatedAt: Date;
}): { actions: DebuggerActionDto[]; logs: DebuggerLogDto[] } {
  const meta = asRecord(input.metadataJson) ?? {};
  const { network, console: consoleEntries } = parseCaptureMetadata(
    input.metadataJson,
  );
  const capturedActions = Array.isArray(meta.actions)
    ? meta.actions
        .map(parseUserActionEntry)
        .filter((e): e is NonNullable<typeof e> => e !== null)
    : [];
  const baseT = computeBaseTimeMs(
    input.metadataJson,
    network,
    consoleEntries,
    input.reportCreatedAt,
  );

  const logs: DebuggerLogDto[] = consoleEntries
    .sort((a, b) => a.t - b.t)
    .map((entry) => ({
      id: entry.id,
      level: entry.level,
      message: entry.args.length > 0 ? entry.args.join(" ") : "(empty)",
      timestamp: new Date(entry.t).toISOString(),
      offset: Math.max(0, entry.t - baseT),
    }));

  const actions: DebuggerActionDto[] = capturedActions
    .sort((a, b) => a.t - b.t)
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      target: entry.target,
      timestamp: new Date(entry.t).toISOString(),
      offset: Math.max(0, entry.t - baseT),
      metadata: entry.metadata,
    }));

  if (actions.length === 0 && input.pageUrl) {
    actions.push({
      id: "capture-page",
      type: "navigation",
      target: null,
      timestamp: new Date(baseT).toISOString(),
      offset: 0,
      metadata: navigationMetadataFromUrl(input.pageUrl),
    });
  }

  return { actions, logs };
}

function matchesNetworkSearch(entry: CaptureNetworkEntry, search: string): boolean {
  const q = search.toLowerCase();
  const status = entry.status !== undefined ? String(entry.status) : "";
  return (
    entry.method.toLowerCase().includes(q) ||
    entry.url.toLowerCase().includes(q) ||
    status.includes(q) ||
    (entry.error?.toLowerCase().includes(q) ?? false)
  );
}

export function listNetworkRequestsFromCapture(input: {
  metadataJson: unknown;
  reportCreatedAt: Date;
  page: number;
  pageSize: number;
  search?: string;
}): {
  items: DebuggerNetworkRequestDto[];
  pagination: { page: number; hasNextPage: boolean };
} {
  const { network, console: consoleEntries } = parseCaptureMetadata(
    input.metadataJson,
  );
  const baseT = computeBaseTimeMs(
    input.metadataJson,
    network,
    consoleEntries,
    input.reportCreatedAt,
  );

  let rows = [...network].sort((a, b) => a.t - b.t);
  const search = input.search?.trim();
  if (search) {
    rows = rows.filter((row) => matchesNetworkSearch(row, search));
  }

  const start = (input.page - 1) * input.pageSize;
  const slice = rows.slice(start, start + input.pageSize);

  const items: DebuggerNetworkRequestDto[] = slice.map((entry) => ({
    id: entry.id,
    method: entry.method,
    url: entry.url,
    status: entry.status ?? null,
    duration:
      typeof entry.durationMs === "number" ? Math.round(entry.durationMs) : null,
    timestamp: new Date(entry.t).toISOString(),
    offset: Math.max(0, entry.t - baseT),
    requestHeaders: entry.requestHeaders ?? {},
    responseHeaders: entry.responseHeaders ?? {},
  }));

  return {
    items,
    pagination: {
      page: input.page,
      hasNextPage: start + input.pageSize < rows.length,
    },
  };
}

export function getNetworkRequestPayloadFromCapture(
  metadataJson: unknown,
  requestId: string,
): { requestBody: string | null; responseBody: string | null } {
  const { network } = parseCaptureMetadata(metadataJson);
  const entry = network.find((n) => n.id === requestId);
  if (!entry) {
    return { requestBody: null, responseBody: null };
  }
  return {
    requestBody: entry.requestBody ?? null,
    responseBody:
      entry.responseBody ?? (entry.error ? `Error: ${entry.error}` : null),
  };
}

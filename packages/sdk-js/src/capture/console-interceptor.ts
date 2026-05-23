import type { ConsoleLogEntry } from "../types";

let installed = false;
let buffer: ConsoleLogEntry[] = [];
let maxEvents = 400;
let seq = 0;

const originals = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
};

function nextId(): string {
  seq += 1;
  return `c-${seq}-${Date.now()}`;
}

function serializeArgs(args: unknown[]): string[] {
  return args.map((a) => {
    try {
      if (typeof a === "string") return a;
      return JSON.stringify(a, replacer, 0);
    } catch {
      return String(a);
    }
  });
}

function replacer(_k: string, v: unknown): unknown {
  if (typeof v === "bigint") return v.toString();
  return v;
}

function push(level: ConsoleLogEntry["level"], args: unknown[]) {
  buffer.push({
    id: nextId(),
    t: Date.now(),
    level,
    args: serializeArgs(args),
  });
  if (buffer.length > maxEvents) {
    buffer = buffer.slice(buffer.length - maxEvents);
  }
}

/** Merge an entry from the page-world injected script. */
export function pushConsoleEntry(entry: ConsoleLogEntry) {
  if (!entry?.id) return;
  buffer.push({
    id: entry.id,
    t: entry.t,
    level: entry.level,
    args: entry.args,
  });
  if (buffer.length > maxEvents) {
    buffer = buffer.slice(buffer.length - maxEvents);
  }
}

export function setConsoleBufferLimits(max: number) {
  maxEvents = Math.max(50, max);
}

export function getConsoleLog(): ConsoleLogEntry[] {
  return buffer.slice();
}

export function clearConsoleLog() {
  buffer = [];
}

export function installConsoleInterceptor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  console.log = (...args: unknown[]) => {
    push("log", args);
    originals.log(...args);
  };
  console.warn = (...args: unknown[]) => {
    push("warn", args);
    originals.warn(...args);
  };
  console.error = (...args: unknown[]) => {
    push("error", args);
    originals.error(...args);
  };
  console.info = (...args: unknown[]) => {
    push("info", args);
    originals.info(...args);
  };
  console.debug = (...args: unknown[]) => {
    push("debug", args);
    originals.debug(...args);
  };
}

export type UserActionEntry = {
  id: string;
  t: number;
  type: string;
  target: string | null;
  metadata?: Record<string, unknown>;
};

let installed = false;
let buffer: UserActionEntry[] = [];
let maxActions = 200;
let seq = 0;

function nextId(): string {
  seq += 1;
  return `a-${seq}-${Date.now()}`;
}

function pushAction(
  type: string,
  target: string | null,
  metadata?: Record<string, unknown>,
) {
  buffer.push({
    id: nextId(),
    t: Date.now(),
    type,
    target,
    metadata,
  });
  if (buffer.length > maxActions) {
    buffer = buffer.slice(buffer.length - maxActions);
  }
}

function navigationMetadata(): Record<string, unknown> | undefined {
  if (typeof location === "undefined") return undefined;
  try {
    const url = new URL(location.href);
    return {
      path: `${url.pathname}${url.search}`,
      search: url.search || null,
      hash: url.hash || null,
      title: document.title || location.href,
      mode: "initial",
    };
  } catch {
    return { path: location.href, title: document.title, mode: "initial" };
  }
}

function formatClickTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const tag = target.tagName.toLowerCase();
  const id = target.id ? `#${target.id}` : "";
  const name =
    target.getAttribute("name") != null
      ? `[name="${target.getAttribute("name")}"]`
      : "";
  const testId = target.getAttribute("data-testid");
  const testIdPart = testId ? `[data-testid="${testId}"]` : "";
  return `${tag}${id}${name}${testIdPart}` || tag;
}

export function setUserActionBufferLimits(max: number) {
  maxActions = Math.max(20, max);
}

export function getUserActionLog(): UserActionEntry[] {
  return buffer.slice();
}

export function clearUserActionLog() {
  buffer = [];
  seq = 0;
}

export function recordSessionNavigation(mode = "session-start") {
  pushAction("navigation", null, {
    ...navigationMetadata(),
    mode,
  });
}

const SPOTTING_HOST_ID = "spotting-capture-root";

function isSpottingWidgetTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(`#${SPOTTING_HOST_ID}`) ||
      target.closest("[data-spotting-widget]"),
  );
}

export function installUserActionCapture() {
  if (installed || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  installed = true;

  pushAction("navigation", null, navigationMetadata());

  document.addEventListener(
    "click",
    (event) => {
      if (isSpottingWidgetTarget(event.target)) return;
      const target = formatClickTarget(event.target);
      pushAction("click", target, {
        x: event.clientX,
        y: event.clientY,
      });
    },
    true,
  );

  window.addEventListener("popstate", () => {
    pushAction("navigation", null, {
      ...navigationMetadata(),
      mode: "popstate",
    });
  });
}

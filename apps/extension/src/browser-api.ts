type AnyFn = (...args: any[]) => any;

type Callback<T> = (value: T) => void;

function getChromeApi(): typeof chrome | undefined {
  const maybe = (globalThis as { chrome?: typeof chrome }).chrome;
  if (maybe && maybe.runtime) {
    return maybe;
  }
  return undefined;
}

function getBrowserApi(): any | undefined {
  const maybe = (globalThis as { browser?: any }).browser;
  if (maybe && maybe.runtime) {
    return maybe;
  }
  return undefined;
}

export function runtimeLastErrorMessage(): string | undefined {
  const chromeApi = getChromeApi();
  return chromeApi?.runtime?.lastError?.message;
}

export function withLastErrorIgnored() {
  void runtimeLastErrorMessage();
}

export async function runtimeSendMessage<TMessage extends object, TResponse = unknown>(
  message: TMessage,
): Promise<TResponse> {
  const browserApi = getBrowserApi();
  if (browserApi?.runtime?.sendMessage) {
    return (await browserApi.runtime.sendMessage(message)) as TResponse;
  }

  const chromeApi = getChromeApi();
  if (!chromeApi?.runtime?.sendMessage) {
    throw new Error("Extension runtime API is unavailable.");
  }

  return await new Promise<TResponse>((resolve, reject) => {
    chromeApi.runtime.sendMessage(message, (response: TResponse) => {
      const error = runtimeLastErrorMessage();
      if (error) {
        reject(new Error(error));
        return;
      }
      resolve(response);
    });
  });
}

export async function tabsQuery(
  queryInfo: chrome.tabs.QueryInfo,
): Promise<chrome.tabs.Tab[]> {
  const browserApi = getBrowserApi();
  if (browserApi?.tabs?.query) {
    return (await browserApi.tabs.query(queryInfo)) as chrome.tabs.Tab[];
  }

  const chromeApi = getChromeApi();
  if (!chromeApi?.tabs?.query) {
    return [];
  }

  return await new Promise<chrome.tabs.Tab[]>((resolve) => {
    chromeApi.tabs.query(queryInfo, (tabs) => resolve(tabs ?? []));
  });
}

export async function tabsSendMessage<TMessage extends object, TResponse = unknown>(
  tabId: number,
  message: TMessage,
): Promise<TResponse> {
  const browserApi = getBrowserApi();
  if (browserApi?.tabs?.sendMessage) {
    return (await browserApi.tabs.sendMessage(tabId, message)) as TResponse;
  }

  const chromeApi = getChromeApi();
  if (!chromeApi?.tabs?.sendMessage) {
    throw new Error("Extension tabs API is unavailable.");
  }

  return await new Promise<TResponse>((resolve, reject) => {
    chromeApi.tabs.sendMessage(tabId, message, (response: TResponse) => {
      const error = runtimeLastErrorMessage();
      if (error) {
        reject(new Error(error));
        return;
      }
      resolve(response);
    });
  });
}

export async function tabsCreate(createProperties: chrome.tabs.CreateProperties) {
  const browserApi = getBrowserApi();
  if (browserApi?.tabs?.create) {
    return await browserApi.tabs.create(createProperties);
  }

  const chromeApi = getChromeApi();
  if (!chromeApi?.tabs?.create) {
    throw new Error("Extension tabs API is unavailable.");
  }

  return await new Promise<chrome.tabs.Tab>((resolve) => {
    chromeApi.tabs.create(createProperties, (tab) => resolve(tab));
  });
}

export async function storageGet(
  area: "sync" | "local",
  keys: string[] | string,
): Promise<Record<string, unknown>> {
  const browserApi = getBrowserApi();
  if (browserApi?.storage?.[area]?.get) {
    return (await browserApi.storage[area].get(keys)) as Record<string, unknown>;
  }

  const chromeApi = getChromeApi();
  if (!chromeApi?.storage?.[area]?.get) {
    return {};
  }

  return await new Promise<Record<string, unknown>>((resolve) => {
    chromeApi.storage[area].get(keys as any, (result) => resolve(result ?? {}));
  });
}

export async function storageSet(
  area: "sync" | "local",
  values: Record<string, unknown>,
): Promise<void> {
  const browserApi = getBrowserApi();
  if (browserApi?.storage?.[area]?.set) {
    await browserApi.storage[area].set(values);
    return;
  }

  const chromeApi = getChromeApi();
  if (!chromeApi?.storage?.[area]?.set) {
    return;
  }

  await new Promise<void>((resolve) => {
    chromeApi.storage[area].set(values as any, () => resolve());
  });
}

export function addRuntimeMessageListener(listener: AnyFn) {
  const browserApi = getBrowserApi();
  if (browserApi?.runtime?.onMessage?.addListener) {
    browserApi.runtime.onMessage.addListener(listener);
    return;
  }
  const chromeApi = getChromeApi();
  chromeApi?.runtime?.onMessage?.addListener(listener as any);
}

export function addRuntimeInstalledListener(listener: Callback<void>) {
  const browserApi = getBrowserApi();
  if (browserApi?.runtime?.onInstalled?.addListener) {
    browserApi.runtime.onInstalled.addListener(listener);
    return;
  }
  const chromeApi = getChromeApi();
  chromeApi?.runtime?.onInstalled?.addListener(listener as any);
}

export function hasScriptingApi(): boolean {
  const browserApi = getBrowserApi();
  if (browserApi?.scripting?.executeScript) {
    return true;
  }
  const chromeApi = getChromeApi();
  return typeof chromeApi?.scripting?.executeScript === "function";
}

export async function scriptingExecuteScript(details: any) {
  const browserApi = getBrowserApi();
  if (browserApi?.scripting?.executeScript) {
    return await browserApi.scripting.executeScript(details);
  }

  const chromeApi = getChromeApi();
  if (!chromeApi?.scripting?.executeScript) {
    throw new Error("Scripting API is unavailable.");
  }

  return await new Promise<any[]>((resolve, reject) => {
    chromeApi.scripting.executeScript(details, (results) => {
      const error = runtimeLastErrorMessage();
      if (error) {
        reject(new Error(error));
        return;
      }
      resolve(results ?? []);
    });
  });
}

export function hasRuntimeApi(): boolean {
  return Boolean(getChromeApi()?.runtime || getBrowserApi()?.runtime);
}

export function getBrowserTargetHint(): "chrome" | "firefox" | "safari" | "unknown" {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("firefox")) {
    return "firefox";
  }
  if (ua.includes("safari") && !ua.includes("chrome")) {
    return "safari";
  }
  if (ua.includes("chrome") || ua.includes("edg/")) {
    return "chrome";
  }
  return "unknown";
}

export function hasTabCaptureApi(): boolean {
  const chromeApi = getChromeApi();
  return typeof chromeApi?.tabCapture?.getMediaStreamId === "function";
}

export async function tabCaptureGetMediaStreamId(
  targetTabId: number,
): Promise<string> {
  const chromeApi = getChromeApi();
  if (!chromeApi?.tabCapture?.getMediaStreamId) {
    throw new Error("Tab capture is unavailable in this browser.");
  }

  return await new Promise<string>((resolve, reject) => {
    chromeApi.tabCapture.getMediaStreamId({ targetTabId }, (streamId) => {
      const error = runtimeLastErrorMessage();
      if (error || !streamId) {
        reject(new Error(error ?? "Tab capture is unavailable on this page."));
        return;
      }
      resolve(streamId);
    });
  });
}

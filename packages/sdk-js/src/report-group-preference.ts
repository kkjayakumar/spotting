const STORAGE_KEY = "spotting_report_group_pref";

export function readActiveReportGroupId(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as { groupId?: string | null };
    return typeof parsed.groupId === "string" && parsed.groupId.length > 0
      ? parsed.groupId
      : undefined;
  } catch {
    return undefined;
  }
}

export async function readActiveReportGroupIdFromExtensionStorage(): Promise<
  string | undefined
> {
  const chromeApi = (
    globalThis as {
      chrome?: {
        storage?: {
          local?: {
            get: (
              keys: string[],
              cb: (result: Record<string, string | null | undefined>) => void,
            ) => void;
          };
        };
      };
    }
  ).chrome;

  if (!chromeApi?.storage?.local) {
    return readActiveReportGroupId();
  }

  return new Promise((resolve) => {
    chromeApi.storage!.local!.get(
      ["spotting_report_group_id"],
      (result) => {
        const groupId = result.spotting_report_group_id;
        resolve(
          typeof groupId === "string" && groupId.length > 0 ? groupId : undefined,
        );
      },
    );
  });
}

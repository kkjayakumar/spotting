import { fetchApi } from "@/lib/api-fetch";

const STORAGE_KEY = "spotting_report_group_pref";

export type ReportGroupPreference = {
  organizationId: string;
  groupId: string | null;
};

export function readLocalReportGroupPreference(): ReportGroupPreference | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ReportGroupPreference;
    if (typeof parsed.organizationId !== "string") {
      return null;
    }
    return {
      organizationId: parsed.organizationId,
      groupId: typeof parsed.groupId === "string" ? parsed.groupId : null,
    };
  } catch {
    return null;
  }
}

export function writeLocalReportGroupPreference(
  preference: ReportGroupPreference,
): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
}

export async function setPreferredReportGroup(input: {
  organizationId: string;
  groupId: string | null;
}) {
  const normalizedGroupId =
    input.groupId && input.groupId !== "none" ? input.groupId : null;

  writeLocalReportGroupPreference({
    organizationId: input.organizationId,
    groupId: normalizedGroupId,
  });

  return fetchApi(`/v1/orgs/${input.organizationId}/membership/report-group`, {
    method: "PUT",
    body: JSON.stringify({ groupId: normalizedGroupId }),
  });
}

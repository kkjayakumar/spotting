import { fetchApi } from "@/lib/api-fetch";

export type ReportGroupSummary = {
  id: string;
  name: string;
  sortOrder: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function listReportGroups(organizationId: string) {
  return fetchApi(`/v1/orgs/${organizationId}/report-groups`) as Promise<
    ReportGroupSummary[]
  >;
}

export async function createReportGroup(input: {
  organizationId: string;
  name: string;
}) {
  return fetchApi(`/v1/orgs/${input.organizationId}/report-groups`, {
    method: "POST",
    body: JSON.stringify({ name: input.name }),
  }) as Promise<ReportGroupSummary>;
}

export async function updateReportGroup(input: {
  organizationId: string;
  groupId: string;
  name: string;
}) {
  return fetchApi(
    `/v1/orgs/${input.organizationId}/report-groups/${input.groupId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ name: input.name }),
    },
  ) as Promise<ReportGroupSummary>;
}

export async function deleteReportGroup(input: {
  organizationId: string;
  groupId: string;
}) {
  return fetchApi(
    `/v1/orgs/${input.organizationId}/report-groups/${input.groupId}`,
    { method: "DELETE" },
  );
}

export const reportGroupQueries = {
  list: (organizationId: string | null) => ({
    queryKey: ["spotting.report-groups", organizationId],
    queryFn: () => {
      if (!organizationId) {
        return Promise.resolve([] as ReportGroupSummary[]);
      }
      return listReportGroups(organizationId);
    },
    enabled: Boolean(organizationId),
  }),
};

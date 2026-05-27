export { queryClient } from "./query-client";

export {
  billingClient,
} from "./billing";

export {
  captureKeyClient,
  captureKeyQueries,
  normalizeCaptureKeyList,
  type CaptureKeyListItem,
} from "./capture-keys";

export {
  reportClient,
  reportQueries as bugReportQueries,
  normalizeBugReportDto,
  updateBugReport,
  updateBugReportsBulk,
  deleteBugReport,
  deleteBugReportsBulk,
  retryBugReportDebuggerIngestion,
  type UpdateBugReportInput,
  type UpdateBugReportsBulkInput,
} from "./reports";

export { orgClient } from "./orgs";

export { spottingAuthClient, authClient } from "./auth";

export { fetchApi, fetchApiWithRequestHeaders } from "@/lib/api-fetch";

import { billingClient } from "./billing";
import { captureKeyClient, captureKeyQueries } from "./capture-keys";
import { orgClient } from "./orgs";
import { reportClient, reportQueries as bugReportQueries } from "./reports";

export const reportQueries = {
  ...bugReportQueries,
  ...captureKeyQueries,
};

export const spottingClient = {
  bugReport: reportClient,
  billing: billingClient,
  captureKey: captureKeyClient,
  organization: {
    listMembers: orgClient.listMembers,
    inviteMember: orgClient.inviteMember,
  },
};

/** @deprecated Use spottingClient */
export { spottingClient as client };

export type SpottingApiClient = typeof spottingClient;

/**
 * Spotting web API React Query hooks.
 * Copyright (C) 2026 KK Jayakumar
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export {
  reportQueries,
  spottingClient,
  spottingClient as client,
  queryClient,
} from "../index";

export { captureKeyQueries, captureKeyClient } from "../capture-keys";
export { reportClient, reportQueries as bugReportQueries } from "../reports";
export { billingClient } from "../billing";
export { orgClient } from "../orgs";

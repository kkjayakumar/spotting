import autocannon from "autocannon";

const url = process.env.PROFILE_API_URL ?? "http://localhost:3000/v1/reports";
const connections = Number(process.env.PROFILE_CONNECTIONS ?? 25);
const duration = Number(process.env.PROFILE_DURATION_SECONDS ?? 30);
const token = process.env.PROFILE_AUTH_TOKEN;
const orgId = process.env.PROFILE_ORG_ID;

const headers: Record<string, string> = {};
if (token) {
  headers.authorization = `Bearer ${token}`;
}
if (orgId) {
  headers["x-org-id"] = orgId;
}

console.log(
  JSON.stringify(
    {
      stage: "profile_start",
      target: "api",
      url,
      connections,
      durationSeconds: duration,
      hasAuthToken: Boolean(token),
      hasOrgId: Boolean(orgId),
    },
    null,
    2,
  ),
);

const result = await autocannon({
  url,
  method: "GET",
  duration,
  connections,
  headers,
});

const summary = {
  requestsPerSecAvg: result.requests.average,
  latencyMsP50: result.latency.p50,
  latencyMsP97_5: result.latency.p97_5,
  latencyMsP99: result.latency.p99,
  throughputBytesPerSec: result.throughput.average,
  errors: result.errors,
  timeouts: result.timeouts,
  non2xx: result.non2xx,
};

console.log(JSON.stringify({ stage: "profile_complete", target: "api", summary }, null, 2));

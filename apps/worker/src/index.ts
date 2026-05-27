import { PrismaClient } from "../../api/src/generated/prisma";
import { createLogger } from "@spotting/config/logger";
import { runMaintenanceTick } from "./maintenance";

const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 30_000);
const startupRetryMs = Number(process.env.WORKER_STARTUP_RETRY_MS ?? 3_000);
const startupMaxAttempts = Number(process.env.WORKER_STARTUP_MAX_ATTEMPTS ?? 10);
const logger = createLogger("worker");
const requiredEnv = ["DATABASE_URL"] as const;
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logMaintenanceResult(
  message: string,
  result: Awaited<ReturnType<typeof runMaintenanceTick>>,
) {
  logger.info(message, {
    nowIso: result.nowIso,
    cancelledInvites: result.cancelledInvites,
    expiredUploadSessions: result.expiredUploadSessions,
    deletedReports: result.deletedReports,
  });
}

async function runMaintenanceWithStartupRetry() {
  for (let attempt = 1; attempt <= startupMaxAttempts; attempt++) {
    try {
      const result = await runMaintenanceTick(prisma);
      logMaintenanceResult("maintenance_tick", result);
      return;
    } catch (error: unknown) {
      if (attempt >= startupMaxAttempts) {
        logger.error("startup_maintenance_failed", { error, attempt });
        return;
      }
      logger.warn("maintenance_retry", { error, attempt, retryInMs: startupRetryMs });
      await sleep(startupRetryMs);
    }
  }
}

logger.info("worker_started", { intervalMs });

setInterval(() => {
  runMaintenanceTick(prisma)
    .then((result) => {
      logMaintenanceResult("maintenance_tick", result);
    })
    .catch((error: unknown) => {
      logger.error("maintenance_failed", { error });
    });
}, intervalMs);

void runMaintenanceWithStartupRetry();

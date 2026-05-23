import { PrismaClient } from "../../api/src/generated/prisma";
import { createLogger } from "@spotting/config/logger";
import { runMaintenanceTick } from "./maintenance";

const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 30_000);
const logger = createLogger("worker");
const requiredEnv = ["DATABASE_URL"] as const;
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

logger.info("worker_started", { intervalMs });

setInterval(() => {
  runMaintenanceTick(prisma)
    .then((result) => {
      logger.info("maintenance_tick", {
        nowIso: result.nowIso,
        cancelledInvites: result.cancelledInvites,
        expiredUploadSessions: result.expiredUploadSessions,
      });
    })
    .catch((error: unknown) => {
      logger.error("maintenance_failed", { error });
    });
}, intervalMs);

runMaintenanceTick(prisma)
  .then((result) => {
    logger.info("maintenance_tick", {
      nowIso: result.nowIso,
      cancelledInvites: result.cancelledInvites,
      expiredUploadSessions: result.expiredUploadSessions,
    });
  })
  .catch((error: unknown) => {
    logger.error("startup_maintenance_failed", { error });
  });

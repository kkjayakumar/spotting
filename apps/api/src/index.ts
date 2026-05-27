import { loadApiEnv } from "./load-env";

loadApiEnv();

import { existsSync } from "node:fs";
import * as Sentry from "@sentry/node";

const isDocker = existsSync("/.dockerenv");
const defaultDsn = isDocker
  ? "http://aegisops@host.docker.internal:5000/1"
  : "http://aegisops@localhost:5000/1";


Sentry.init({
  dsn: process.env.SENTRY_DSN || defaultDsn,
  tracesSampleRate: 1.0,
  debug: false,

  initialScope: {
    tags: {
      container_name: "spotting-api"
    }
  }
});



import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { createLogger } from "@spotting/config/logger";
import { isEmailConfigured } from "./email";
import { prisma } from "./db";
import { v1 } from "./v1";

const app = new Hono();
const logger = createLogger("api");
const port = Number(process.env.API_PORT ?? 3000);
const requiredEnv = ["DATABASE_URL"] as const;
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

logger.info("service_starting", {
  port,
  emailConfigured: isEmailConfigured(),
});

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3001",
      "http://localhost:3003",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3003",
      ...(process.env.CORS_ORIGINS?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean) ?? []),
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-org-id",
      "x-client-request-id",
      "x-request-id",
      "X-Spotting-Page-Url",
    ],
  }),
);

app.use("*", async (c, next) => {
  const start = performance.now();
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  c.header("x-request-id", requestId);

  await Sentry.startSpan({
    op: "http.server",
    name: `${c.req.method} ${c.req.path}`,
  }, async () => {
    await next();
  });

  logger.info("request_complete", {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    latencyMs: Math.round((performance.now() - start) * 100) / 100,
  });
});

app.get("/healthz", (c) => {
  return c.json({ status: "ok", service: "api" });
});

app.get("/debug-error", (c) => {
  throw new Error("AegisOps Crash Test Exception!");
});


app.get("/readyz", (c) => {
  return prisma.$queryRaw`SELECT 1`
    .then(() => c.json({ status: "ready", service: "api", database: "ok" }))
    .catch((error) =>
      c.json(
        {
          status: "not_ready",
          service: "api",
          database: "error",
          message: error instanceof Error ? error.message : "Database unreachable",
        },
        503,
      ),
    );
});

app.get("/", (c) => {
  return c.text("Spotting API is running");
});

app.route("/v1", v1);

app.notFound((c) => {
  return c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
        details: [],
      },
    },
    404,
  );
});

app.onError((error, c) => {
  if (!(error instanceof HTTPException) || error.status >= 500) {
    Sentry.captureException(error);
  }

  if (error instanceof HTTPException) {
    const code =
      (error.cause as { code?: string } | undefined)?.code ??
      (error.status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
    const details = (error.cause as { details?: unknown[] } | undefined)?.details ?? [];
    return c.json(
      {
        error: {
          code,
          message: error.message,
          details,
        },
      },
      error.status,
    );
  }

  logger.error("unhandled_error", { error });
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        details: [],
      },
    },
    500,
  );
});

serve({
  fetch: app.fetch,
  port,
});

logger.info("service_listening", { port });

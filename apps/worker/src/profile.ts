import { PrismaClient } from "../../api/src/generated/prisma";
import { runMaintenanceTick } from "./maintenance";

const iterations = Number(process.env.PROFILE_WORKER_ITERATIONS ?? 10);
const requiredEnv = ["DATABASE_URL"] as const;
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const prisma = new PrismaClient({ log: ["warn", "error"] });
const durationsMs: number[] = [];

for (let i = 0; i < iterations; i += 1) {
  const startedAt = performance.now();
  await runMaintenanceTick(prisma);
  durationsMs.push(Math.round((performance.now() - startedAt) * 100) / 100);
}

await prisma.$disconnect();

const sorted = [...durationsMs].sort((a, b) => a - b);
const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
const summary = {
  iterations,
  durationMsAvg: Math.round((durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) * 100) / 100,
  durationMsP95: sorted[p95Index],
  durationMsMin: sorted[0],
  durationMsMax: sorted[sorted.length - 1],
};

console.log(JSON.stringify({ stage: "profile_complete", target: "worker", summary }, null, 2));

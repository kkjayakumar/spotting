#!/usr/bin/env node
/**
 * Migrate legacy crk_* capture keys to spk_* in the database.
 * Run: npm run migrate:capture-keys -w @spotting/api
 * Dry run: npm run migrate:capture-keys -w @spotting/api -- --dry-run
 */
import { loadApiEnv } from "../src/load-env.js";

loadApiEnv();

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const legacy = await prisma.capturePublicKey.findMany({
    where: { token: { startsWith: "crk_" } },
    select: { id: true, token: true, label: true },
  });

  if (legacy.length === 0) {
    console.log("No legacy capture keys to migrate.");
    return;
  }

  console.log(`Found ${legacy.length} legacy key(s)${dryRun ? " (dry run)" : ""}.`);

  for (const row of legacy) {
    const nextToken = row.token.replace(/^crk_/, "spk_");
    console.log(`  ${row.id} ${row.label}: ${row.token} → ${nextToken}`);
    if (!dryRun) {
      await prisma.capturePublicKey.update({
        where: { id: row.id },
        data: { token: nextToken },
      });
    }
  }

  if (dryRun) {
    console.log("Dry run complete. Re-run without --dry-run to apply.");
    return;
  }

  console.log(`Done. Migrated ${legacy.length} key(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

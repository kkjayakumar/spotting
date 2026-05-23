FROM oven/bun:1.3.5-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock turbo.json tsconfig.json biome.jsonc ./
COPY apps/worker ./apps/worker
COPY packages ./packages

RUN bun install --frozen-lockfile
RUN bun --cwd apps/worker prisma:generate

CMD ["bun", "run", "apps/worker/src/index.ts"]

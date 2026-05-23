FROM oven/bun:1.3.5-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY patches ./patches
COPY apps ./apps
COPY packages ./packages

RUN bun install --frozen-lockfile
RUN bun --cwd apps/api prisma:generate

CMD ["bun", "run", "apps/worker/src/index.ts"]

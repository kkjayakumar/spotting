FROM oven/bun:1.3.5-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY patches ./patches
COPY apps ./apps
COPY packages ./packages

RUN bun install --frozen-lockfile
RUN bun --cwd apps/api prisma:generate

EXPOSE 3000

CMD ["bun", "run", "apps/api/src/index.ts"]

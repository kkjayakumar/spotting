# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY patches ./patches
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
RUN npm ci

FROM deps AS builder
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker
COPY packages ./packages
RUN npm run prisma:generate -w @spotting/api
RUN npm run build -w @spotting/worker

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=builder /app/apps/worker ./apps/worker
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/src/generated ./apps/api/src/generated
COPY --from=builder /app/packages ./packages

RUN npm prune --omit=dev

CMD ["node", "--import", "tsx", "apps/worker/src/index.ts"]

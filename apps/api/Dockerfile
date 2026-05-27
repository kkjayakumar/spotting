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
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

FROM deps AS builder
COPY apps/api ./apps/api
COPY packages ./packages
RUN npm run prisma:generate -w @spotting/api
RUN npm run build -w @spotting/api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

RUN npm prune --omit=dev \
  && chmod +x apps/api/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./apps/api/docker-entrypoint.sh"]

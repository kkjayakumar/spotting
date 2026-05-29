# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY patches ./patches
COPY apps/web/package.json ./apps/web/
COPY apps/extension/package.json ./apps/extension/
COPY packages/config/package.json ./packages/config/
COPY packages/env/package.json ./packages/env/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/sdk-js/package.json ./packages/sdk-js/
RUN npm ci

FROM deps AS builder
ARG NEXT_PUBLIC_SITE_URL=https://__SPOTTING_SITE_URL__
ARG NEXT_PUBLIC_APP_URL=https://__SPOTTING_APP_URL__
ARG NEXT_PUBLIC_SERVER_URL=https://__SPOTTING_SERVER_URL__
ARG NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
ARG SPOTTING_API_INTERNAL_URL=http://api:3000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=${NEXT_PUBLIC_GOOGLE_AUTH_ENABLED}
ENV SPOTTING_API_INTERNAL_URL=${SPOTTING_API_INTERNAL_URL}

COPY apps/web ./apps/web
COPY apps/extension ./apps/extension
COPY packages ./packages

RUN npm run build -w @spotting/sdk-js \
  && npm run build:chrome -w @spotting/extension \
  && npm run build:firefox -w @spotting/extension \
  && npm run build:safari -w @spotting/extension \
  && npm run package:all -w @spotting/extension \
  && npm run build -- --filter=@spotting/web \
  && cp -R apps/web/.next ./apps/web/.next-template \
  && rm -rf apps/web/.next-template/cache apps/web/.next-template/dev \
  && cp -R apps/web/.next/standalone ./standalone \
  && cp -R apps/web/.next/static ./standalone/apps/web/.next/static

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/standalone ./
COPY --from=builder /app/apps/web/.next-template ./apps/web/.next-template
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/extension/dist ./apps/extension/dist
COPY --from=builder /app/apps/extension/dist-targets ./apps/extension/dist-targets
COPY --from=builder /app/apps/extension/dist-packages ./apps/extension/dist-packages
COPY apps/web/docker-entrypoint.sh ./apps/web/docker-entrypoint.sh

RUN chmod +x apps/web/docker-entrypoint.sh

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV SPOTTING_EXTENSION_DIST=/app/apps/extension/dist

ENTRYPOINT ["./apps/web/docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]

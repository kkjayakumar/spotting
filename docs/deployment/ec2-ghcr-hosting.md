# EC2 Ubuntu hosting with GHCR images

Pre-built container images are published to **GitHub Container Registry (GHCR)** on every release tag (`v*`). Use this guide to run Spotting on **Ubuntu EC2** without building images on the server.

## Images

After a release (for example `v1.0.0`), these images are available:

| Service | Image |
|---------|--------|
| API | `ghcr.io/<github-owner>/spotting-api:<tag>` |
| Web | `ghcr.io/<github-owner>/spotting-web:<tag>` |
| Worker | `ghcr.io/<github-owner>/spotting-worker:<tag>` |

Replace `<github-owner>` with your GitHub username or org name in **lowercase** (for example `ghcr.io/kkjayakumar/spotting-api:v1.0.0`).

Images are built by the **Publish containers to GHCR** job in [.github/workflows/release.yml](../../.github/workflows/release.yml) when you push a `v*` tag.

### Package visibility

- **Public repo + public packages:** `docker pull` works without login.
- **Private packages:** create a [GitHub personal access token](https://github.com/settings/tokens) with `read:packages`, then:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

In the repository **Packages** settings you can also link package visibility to the repo.

---

## Quick install (recommended)

On a fresh **Ubuntu 22.04 / 24.04** EC2 instance:

```bash
sudo apt-get update && sudo apt-get install -y git
sudo mkdir -p /opt/spotting && sudo chown "$USER":"$USER" /opt/spotting
git clone https://github.com/YOUR_ORG/spotting.git /opt/spotting
cd /opt/spotting
git checkout v1.0.0   # match the image tag you will pull

cp .env.example .env
nano .env               # see “Required environment variables” below

chmod +x scripts/install-ubuntu-ghcr.sh
sudo ./scripts/install-ubuntu-ghcr.sh
```

The script installs Docker, nginx, certbot, pulls GHCR images, starts the stack, configures TLS, and prints health URLs.

---

## Manual setup

### 1. DNS

Point two hostnames at your EC2 public IP:

| Record | Example |
|--------|---------|
| Web dashboard | `spotting.yourdomain.com` |
| API | `api-spotting.yourdomain.com` |

### 2. Install Docker and nginx

Same as the [README production section](../../README.md#production--ubuntu-26-server), or run only the base steps from `scripts/install-ubuntu-ghcr.sh`.

### 3. Configure `.env`

Copy from [`.env.example`](../../.env.example) and set at least the variables in the table below.

**GHCR-specific** (add to `.env`):

```bash
GHCR_IMAGE_PREFIX=ghcr.io/your-github-owner
SPOTTING_IMAGE_TAG=v1.0.0
```

`SPOTTING_IMAGE_TAG` must match a tag that was published (usually the Git release tag).

### 4. Log in to GHCR (if packages are private)

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 5. Pull and start

From the repo root (needs `docker-compose.ghcr.yml` and `.env`):

```bash
docker compose -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.ghcr.yml --env-file .env up -d
```

Wait for the API healthcheck (migrations run on API start):

```bash
curl -fsS http://127.0.0.1:3000/healthz
curl -I http://127.0.0.1:3001
```

### 6. nginx + TLS

Use the nginx snippets in the [README manual steps](../../README.md#5-configure-nginx) or run `scripts/install-ubuntu-ghcr.sh`, which configures them automatically.

### 7. Upgrade to a new release

```bash
cd /opt/spotting
git fetch --tags
git checkout v1.1.0
# Edit .env: SPOTTING_IMAGE_TAG=v1.1.0
docker compose -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.ghcr.yml --env-file .env up -d
```

---

## Required environment variables

These names match [`.env.example`](../../.env.example). Variables marked **install** are checked by `scripts/install-ubuntu-ghcr.sh` before starting containers.

### GHCR (required for this deployment path)

| Variable | Required | Description |
|----------|----------|-------------|
| `GHCR_IMAGE_PREFIX` | Yes | Registry prefix, e.g. `ghcr.io/kkjayakumar` (lowercase owner) |
| `SPOTTING_IMAGE_TAG` | Yes | Image tag to pull, e.g. `v1.0.0` |

### Public URLs & TLS

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Yes | Public web URL (web container entrypoint) |
| `NEXT_PUBLIC_APP_URL` | Yes (install) | Same as site URL in most setups |
| `NEXT_PUBLIC_SERVER_URL` | Yes (install) | Public API URL (browser calls this) |
| `CORS_ORIGINS` | Yes | Comma-separated origins allowed by API (usually web URL) |
| `SPOTTING_AUTH_URL` | Yes | Public API base URL for auth callbacks |
| `CERTBOT_EMAIL` | Yes (install) | Email for Let's Encrypt |

### Host binding

| Variable | Required | Description |
|----------|----------|-------------|
| `DOCKER_BIND_HOST` | Recommended | `127.0.0.1` on EC2 (nginx proxies to containers) |
| `WEB_PORT` | Recommended | Host port for web (default `3001`) |
| `API_PORT` | Recommended | Host port for API (default `3000`) |

### Database (containers)

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_DB` | Yes | Database name |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_PASSWORD` | Yes (install) | Strong password |

`DATABASE_URL` in `.env.example` is for **local dev** only. Production compose sets `DATABASE_URL` internally to `spotting-postgres`.

### Auth

| Variable | Required | Description |
|----------|----------|-------------|
| `SPOTTING_AUTH_SECRET` | Yes (install) | Session signing secret (`openssl rand -hex 32`) |

### Object storage (S3)

| Variable | Required | Description |
|----------|----------|-------------|
| `S3_REGION` | Yes | AWS region |
| `S3_BUCKET` | Yes (install) | Bucket name |
| `AWS_ACCESS_KEY_ID` | Yes (install) | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Yes (install) | IAM secret key |

The API also accepts `S3_ACCESS_KEY` / `S3_SECRET_KEY` as aliases.

### Email (SES SMTP)

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_REGION` | Yes (install) | SES region |
| `SMTP_PORT` | Yes | Usually `587` |
| `SMTP_USERNAME` | Yes | SES SMTP username |
| `SMTP_PASSWORD` | Yes | SES SMTP password |
| `SMTP_FROM` | Yes (install) | From address, e.g. `Spotting <noreply@yourdomain.com>` |

### Worker (optional defaults)

| Variable | Required | Description |
|----------|----------|-------------|
| `WORKER_INTERVAL_MS` | No | Poll interval (default `30000`) |
| `REPORT_RETENTION_DAYS` | No | Report retention (default `90`) |
| `MAIL_APP_NAME` | No | Email display name |

### Optional

| Variable | Description |
|----------|-------------|
| `SPOTTING_ACCEPT_LEGACY_CRK_KEYS` | Legacy capture key migration |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Google OAuth (`false` by default) |
| `SPOTTING_EXTENSION_DIST` | Extension path inside web container |

### Not used on EC2 GHCR production

| Variable | Notes |
|----------|--------|
| `POSTGRES_PORT`, `REDIS_PORT`, `MINIO_*` | Local dev / `infra/docker` only |
| `DATABASE_URL` | Overridden by `docker-compose.ghcr.yml` for API/worker |

---

## Operations

```bash
cd /opt/spotting
docker compose -f docker-compose.ghcr.yml --env-file .env logs -f
docker compose -f docker-compose.ghcr.yml --env-file .env restart
docker compose -f docker-compose.ghcr.yml --env-file .env ps
```

Manual schema apply if needed:

```bash
docker compose -f docker-compose.ghcr.yml --env-file .env exec -T api npm run db:push -w @spotting/api
```

---

## Build from source instead

To compile images on the server, use `docker-compose.yml` and `scripts/install-ubuntu.sh` as described in the [README](../../README.md#production--ubuntu-26-server).

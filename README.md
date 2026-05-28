# Spotting

Open-source bug reporting platform with screen recording, console/network capture, and a Chrome extension. Built for QA teams and product engineering workflows.

**License:** Licensed under the GNU Affero General Public License version 3 (AGPL-3.0) under KK Jayakumar. See [LICENSE](LICENSE) for details.

**Independence program:** [PROJECT_PLAN_CHECKLIST.md](PROJECT_PLAN_CHECKLIST.md) · [clean-room policy](docs/clean-room-policy.md)

## Features

- **Dashboard** — orgs, invites, reports, public capture keys, settings
- **API** — Hono + PostgreSQL + Prisma, presigned S3 uploads, email verification
- **Worker** — background maintenance (expired invites, upload sessions)
- **Capture SDK** — embeddable browser widget (`packages/sdk-js`)
- **Chrome extension** — record and submit from any site (`apps/extension`)

## Repository layout

| Path | Description |
|------|-------------|
| `apps/web` | Next.js dashboard |
| `apps/api` | Hono REST API |
| `apps/worker` | Background worker |
| `apps/extension` | Chrome MV3 extension |
| `packages/sdk-js` | Browser capture SDK |
| `packages/ui` | Shared UI components |
| `packages/shared` | Shared config and types |
| `infra/docker` | Local dev infrastructure (Postgres, Redis, MinIO) |
| `docker-compose.yml` | Production stack (build images on the server) |
| `docker-compose.ghcr.yml` | Production stack (pull images from GHCR) |
| `scripts/install-ubuntu.sh` | Ubuntu installer (build from source) |
| `scripts/install-ubuntu-ghcr.sh` | Ubuntu installer (GHCR images) |
| `docs/deployment/ec2-ghcr-hosting.md` | EC2 + GHCR deployment guide |

---

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) 22+ and npm 10+
- [Docker](https://docs.docker.com/get-docker/) (for Postgres, Redis, MinIO)

### 1. Install dependencies

```bash
git clone https://github.com/your-org/spotting.git
cd spotting
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

For local dev, the root `.env` defaults are fine (Postgres on port `5433`, MinIO on `9000`). Optionally copy app-specific overrides:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Start infrastructure and database

```bash
npm run demo:setup
```

This starts Docker infra, generates the Prisma client, and pushes the schema.

### 4. Start all services

```bash
npm run demo:start
```

Or run individually:

```bash
npm run dev:api      # API  → http://localhost:3000
npm run dev:web      # Web  → http://localhost:3003
npm run dev:worker   # Worker (maintenance ticks)
```

### Local URLs

| Service | URL |
|---------|-----|
| Web dashboard | http://localhost:3003 |
| API | http://localhost:3000 |
| API health | http://localhost:3000/healthz |
| API ready | http://localhost:3000/readyz |
| MinIO console | http://localhost:9001 |

### Build extension

From the **repo root** (not `apps/extension`):

```bash
npm run build:extension
```

Load unpacked from `apps/extension/dist` in Chrome.

See [docs/capture-embed.md](./docs/capture-embed.md) for SDK embed and public key setup.

---

## Production — Ubuntu EC2 (GHCR images)

Pushing a `v*` tag runs [.github/workflows/release.yml](.github/workflows/release.yml): tests, GitHub Release, then **container images to GHCR**:

| Image | Example |
|-------|---------|
| API | `ghcr.io/<github-owner>/spotting-api:v1.0.0` |
| Web | `ghcr.io/<github-owner>/spotting-web:v1.0.0` |
| Worker | `ghcr.io/<github-owner>/spotting-worker:v1.0.0` |

Use your GitHub username/org in **lowercase** for `<github-owner>`.

### Prerequisites

- Ubuntu 22.04 / 24.04 EC2 (2 GB+ RAM)
- DNS **A records**: `spotting.yourdomain.com`, `api-spotting.yourdomain.com` → EC2 IP
- AWS S3 + SES credentials
- Ports **22**, **80**, **443** open

### 1. Publish images (GitHub)

```bash
git tag v1.0.0
git push origin v1.0.0
```

Wait for the **release** workflow to finish (Actions tab). Images appear under the repo **Packages** tab.

### 2. Fetch and run on EC2

```bash
# Install git, clone deploy files (compose + scripts)
sudo apt-get update && sudo apt-get install -y git
sudo mkdir -p /opt/spotting && sudo chown "$USER":"$USER" /opt/spotting
git clone https://github.com/your-org/spotting.git /opt/spotting
cd /opt/spotting
git checkout v1.0.0

# Configure environment (see .env.example)
cp .env.example .env
nano .env
```

Add these two lines to `.env` (plus domains, secrets from `.env.example`):

```bash
GHCR_IMAGE_PREFIX=ghcr.io/your-github-owner
SPOTTING_IMAGE_TAG=v1.0.0
```

**Private GHCR packages** — log in before pull:

```bash
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**One-command install** (Docker, pull images, nginx, SSL):

```bash
chmod +x scripts/install-ubuntu-ghcr.sh
sudo ./scripts/install-ubuntu-ghcr.sh
```

**Or pull and start manually:**

```bash
# Install Docker if needed: https://docs.docker.com/engine/install/ubuntu/
docker compose -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.ghcr.yml --env-file .env up -d

curl http://127.0.0.1:3000/healthz
curl -I http://127.0.0.1:3001
```

Then configure nginx + Let's Encrypt (see [manual steps](#manual-step-by-step-ubuntu-26) below) or use the install script above.

Upgrade to a new release:

```bash
cd /opt/spotting && git fetch --tags && git checkout v1.1.0
# Update SPOTTING_IMAGE_TAG=v1.1.0 in .env
docker compose -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.ghcr.yml --env-file .env up -d
```

Full env variable list and troubleshooting: [docs/deployment/ec2-ghcr-hosting.md](docs/deployment/ec2-ghcr-hosting.md).

### Build on server instead of GHCR

```bash
chmod +x scripts/install-ubuntu.sh
sudo ./scripts/install-ubuntu.sh   # uses docker-compose.yml and builds locally
```

---

### Manual step-by-step (Ubuntu 26)

Use this if you prefer to run each command yourself.

#### 1. System packages

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx ufw git
```

#### 2. Install Docker

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
```

#### 3. Clone and configure

```bash
sudo mkdir -p /opt/spotting
sudo chown "$USER":"$USER" /opt/spotting
git clone https://github.com/your-org/spotting.git /opt/spotting
cd /opt/spotting
cp .env.example .env
nano .env
```

**Required `.env` variable names** (values in [`.env.example`](.env.example); GHCR deploy also needs `GHCR_IMAGE_PREFIX` and `SPOTTING_IMAGE_TAG`):

| Category | Variables |
|----------|-----------|
| Public URLs | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SERVER_URL`, `CORS_ORIGINS`, `SPOTTING_AUTH_URL` |
| TLS (install script) | `CERTBOT_EMAIL` |
| Postgres | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| Auth | `SPOTTING_AUTH_SECRET` |
| S3 | `S3_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| Email (SES) | `SMTP_REGION`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM` |
| Host ports | `DOCKER_BIND_HOST`, `WEB_PORT`, `API_PORT` |
| GHCR only | `GHCR_IMAGE_PREFIX`, `SPOTTING_IMAGE_TAG` |

`DATABASE_URL` in `.env.example` is for **local development**; production Docker Compose sets it for API/worker automatically.

Example snippet:

```bash
NEXT_PUBLIC_SITE_URL=https://spotting.yourdomain.com
NEXT_PUBLIC_APP_URL=https://spotting.yourdomain.com
NEXT_PUBLIC_SERVER_URL=https://api-spotting.yourdomain.com
CORS_ORIGINS=https://spotting.yourdomain.com
CERTBOT_EMAIL=admin@yourdomain.com
POSTGRES_PASSWORD=<long-random-password>
SPOTTING_AUTH_SECRET=$(openssl rand -hex 32)
SPOTTING_AUTH_URL=https://api-spotting.yourdomain.com
S3_REGION=ap-south-1
S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SMTP_REGION=ap-south-1
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM=Spotting <noreply@yourdomain.com>
```

Generate auth secret:

```bash
openssl rand -hex 32
```

#### 4. Start application

```bash
npm run docker:up
# API entrypoint runs `db:push` on start; worker waits for API health.
```

Verify locally on the server:

```bash
curl http://127.0.0.1:3000/healthz
curl -I http://127.0.0.1:3001
```

#### 5. Configure nginx

Web dashboard (`/etc/nginx/sites-available/spotting-web`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name spotting.yourdomain.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }
}
```

API (`/etc/nginx/sites-available/spotting-api`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api-spotting.yourdomain.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

Enable sites:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/spotting-web /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/spotting-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### 7. Let's Encrypt SSL

```bash
sudo certbot --nginx \
  --agree-tos \
  --no-eff-email \
  --email admin@yourdomain.com \
  -d spotting.yourdomain.com \
  -d api-spotting.yourdomain.com
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

#### 8. Verify production

```bash
curl https://api-spotting.yourdomain.com/healthz
curl -I https://spotting.yourdomain.com
```

Open the dashboard, sign up, and confirm the verification email arrives.

---

## Operations

```bash
# Logs
npm run docker:logs
docker compose logs -f api worker web

# Restart
docker compose restart

# Rebuild after code update
git pull
npm run docker:up

# Manual schema apply (if worker logs missing tables)
docker compose exec -T api npm run db:push -w @spotting/api
docker compose restart worker

# Stop
npm run docker:down
```

---

## Development commands

| Command | Description |
|---------|-------------|
| `npm run infra:up` | Start local Postgres, Redis, MinIO |
| `npm run infra:down` | Stop local infra |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run verify` | Lint, typecheck, test, build |
| `npm run test` | Run all tests |
| `npm run build:extension` | Build Chrome extension |

See [docs/TESTING.md](./docs/TESTING.md) for test and troubleshooting guidance.

---

## API overview

- Auth: `POST /v1/auth/signup`, `signin`, `verify-email`, `resend-verification`
- Orgs & invites: `/v1/orgs`, `/v1/orgs/:id/invites`
- Reports: `GET/POST /v1/reports`, upload sessions, capture metadata
- Capture (public key): `POST /v1/capture/reports`, upload session endpoints

Errors use a standard envelope:

```json
{ "error": { "code": "BAD_REQUEST", "message": "...", "details": [] } }
```

---

## License & compliance

Licensed under the GNU Affero General Public License version 3 (AGPL-3.0) under KK Jayakumar — see [LICENSE](LICENSE) for details.  
Contributing and independence rules: [clean-room policy](docs/clean-room-policy.md) · [separation plan](docs/provenance/SEPARATION-PLAN.md)

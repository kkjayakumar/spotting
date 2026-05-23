# Spotting

Open-source bug reporting platform with screen recording, console/network capture, and a Chrome extension. An alternative to Jam.dev and Marker.io.

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
| `docker-compose.yml` | Production stack (Postgres, Redis, API, worker, web) |
| `scripts/install-ubuntu.sh` | One-command Ubuntu server installer |

---

## Local development

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Docker](https://docs.docker.com/get-docker/) (for Postgres, Redis, MinIO)

### 1. Install dependencies

```bash
git clone https://github.com/your-org/spotting.git
cd spotting
bun install
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
bun run demo:setup
```

This starts Docker infra, generates the Prisma client, and pushes the schema.

### 4. Start all services

```bash
bun run demo:start
```

Or run individually:

```bash
bun run dev:api      # API  → http://localhost:3000
bun run dev:web      # Web  → http://localhost:3003
bun run dev:worker   # Worker (maintenance ticks)
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
bun run build:extension
```

Load unpacked from `apps/extension/dist` in Chrome.

See [docs/capture-embed.md](./docs/capture-embed.md) for SDK embed and public key setup.

---

## Production — Ubuntu 26 server

Deploy with Docker, nginx, and Let's Encrypt SSL. After cloning the repo you only need to create `.env` and run the install script.

### Prerequisites

- Fresh **Ubuntu 26.04** VPS (2 GB+ RAM recommended)
- Two DNS **A records** pointing to the server IP:
  - `spotting.yourdomain.com` → web dashboard
  - `api-spotting.yourdomain.com` → API
- AWS S3 bucket + IAM credentials for uploads
- AWS SES SMTP credentials for verification emails
- Ports **22**, **80**, **443** open

### Quick install (recommended)

```bash
# 1. Clone
sudo mkdir -p /opt/spotting
sudo chown "$USER":"$USER" /opt/spotting
git clone https://github.com/your-org/spotting.git /opt/spotting
cd /opt/spotting

# 2. Configure (only step that requires editing)
cp .env.example .env
nano .env

# 3. Install everything
chmod +x scripts/install-ubuntu.sh
sudo ./scripts/install-ubuntu.sh
```

The script installs Docker, builds containers, applies the DB schema, configures nginx, and obtains SSL certificates.

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

**Required `.env` values** (see `.env.example` for full list):

```bash
# Domains (must match DNS)
NEXT_PUBLIC_SITE_URL=https://spotting.yourdomain.com
NEXT_PUBLIC_APP_URL=https://spotting.yourdomain.com
NEXT_PUBLIC_SERVER_URL=https://api-spotting.yourdomain.com
CORS_ORIGINS=https://spotting.yourdomain.com
CERTBOT_EMAIL=admin@yourdomain.com

# Secrets
POSTGRES_PASSWORD=<long-random-password>
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_URL=https://api-spotting.yourdomain.com

# AWS S3 + SES
S3_REGION=ap-south-1
S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SMTP_REGION=ap-south-1
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
docker compose up -d --build
docker compose exec -T api bun --cwd apps/api db:push
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
docker compose logs -f
docker compose logs -f api worker web

# Restart
docker compose restart

# Rebuild after code update
git pull
docker compose up -d --build
# API entrypoint runs `db:push` on start; worker waits for API health.

# Manual schema apply (if worker logs missing tables)
docker compose exec -T api bun --cwd apps/api db:push
docker compose restart worker

# Stop
docker compose down
```

---

## Development commands

| Command | Description |
|---------|-------------|
| `bun run infra:up` | Start local Postgres, Redis, MinIO |
| `bun run infra:down` | Stop local infra |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:push` | Push schema to database |
| `bun run verify` | Lint, typecheck, test, build |
| `bun run test` | Run all tests |
| `bun run build:extension` | Build Chrome extension |

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

## License

Add your license file at `/LICENSE` before public distribution.

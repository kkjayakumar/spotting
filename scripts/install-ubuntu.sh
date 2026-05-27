#!/usr/bin/env bash
#
# Spotting — Ubuntu server installer
# Usage (from repo root, after creating .env):
#   sudo ./scripts/install-ubuntu.sh
#
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo ./scripts/install-ubuntu.sh" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${APP_DIR}"

ENV_FILE="${APP_DIR}/.env"

log() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1"
}

load_env() {
  [[ -f "${ENV_FILE}" ]] || fail "Create ${ENV_FILE} first (copy .env.example to .env and edit it)."

  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a

  : "${NEXT_PUBLIC_APP_URL:?Set NEXT_PUBLIC_APP_URL in .env}"
  : "${NEXT_PUBLIC_SERVER_URL:?Set NEXT_PUBLIC_SERVER_URL in .env}"
  : "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL in .env}"
  : "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}"
  : "${SPOTTING_AUTH_SECRET:?Set SPOTTING_AUTH_SECRET in .env}"
  : "${S3_BUCKET:?Set S3_BUCKET in .env}"
  : "${AWS_ACCESS_KEY_ID:?Set AWS_ACCESS_KEY_ID in .env}"
  : "${AWS_SECRET_ACCESS_KEY:?Set AWS_SECRET_ACCESS_KEY in .env}"
  : "${SMTP_REGION:?Set SMTP_REGION in .env}"
  : "${SMTP_FROM:?Set SMTP_FROM in .env}"

  WEB_DOMAIN="$(printf '%s' "${NEXT_PUBLIC_APP_URL}" | sed -E 's#^https?://##' | cut -d/ -f1 | cut -d: -f1)"
  API_DOMAIN="$(printf '%s' "${NEXT_PUBLIC_SERVER_URL}" | sed -E 's#^https?://##' | cut -d/ -f1 | cut -d: -f1)"
  WEB_PORT="${WEB_PORT:-3001}"
  API_PORT="${API_PORT:-3000}"

  [[ -n "${WEB_DOMAIN}" ]] || fail "Could not parse web domain from NEXT_PUBLIC_APP_URL"
  [[ -n "${API_DOMAIN}" ]] || fail "Could not parse API domain from NEXT_PUBLIC_SERVER_URL"
}

install_base_packages() {
  log "Updating apt and installing base packages"
  apt-get update
  apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx ufw git
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    log "Docker already installed"
    return
  fi

  log "Installing Docker Engine"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  # shellcheck disable=SC1091
  source /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
}

configure_firewall() {
  log "Configuring UFW (allow SSH, HTTP, HTTPS)"
  ufw allow OpenSSH || true
  ufw allow 'Nginx Full' || true
  ufw --force enable || true
}

start_application() {
  log "Building and starting Spotting containers"
  docker compose --env-file "${ENV_FILE}" up -d --build

  log "Waiting for API (schema migrate + healthcheck)"
  for _ in $(seq 1 60); do
    if docker compose --env-file "${ENV_FILE}" ps api 2>/dev/null | grep -q "(healthy)"; then
      break
    fi
    sleep 3
  done
}

write_nginx_site() {
  local name="$1"
  local domain="$2"
  local port="$3"

  cat >"/etc/nginx/sites-available/${name}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }
}
EOF

  ln -sf "/etc/nginx/sites-available/${name}" "/etc/nginx/sites-enabled/${name}"
}

configure_nginx() {
  log "Configuring nginx reverse proxy"
  rm -f /etc/nginx/sites-enabled/default

  write_nginx_site "spotting-web" "${WEB_DOMAIN}" "${WEB_PORT}"
  write_nginx_site "spotting-api" "${API_DOMAIN}" "${API_PORT}"

  nginx -t
  systemctl enable nginx
  systemctl reload nginx
}

configure_ssl() {
  log "Requesting Let's Encrypt certificates"
  certbot --nginx \
    --non-interactive \
    --agree-tos \
    --no-eff-email \
    --email "${CERTBOT_EMAIL}" \
    -d "${WEB_DOMAIN}" \
    -d "${API_DOMAIN}"

  systemctl reload nginx
}

verify_health() {
  log "Verifying services"
  curl -fsS "http://127.0.0.1:${API_PORT}/healthz" >/dev/null
  curl -fsS "http://127.0.0.1:${WEB_PORT}" >/dev/null || true

  printf '\nSpotting is running.\n'
  printf '  Web:  https://%s\n' "${WEB_DOMAIN}"
  printf '  API:  https://%s/healthz\n' "${API_DOMAIN}"
  printf '\nUseful commands:\n'
  printf '  docker compose logs -f\n'
  printf '  docker compose restart\n'
  printf '  certbot renew --dry-run\n'
}

main() {
  load_env
  install_base_packages
  install_docker
  configure_firewall
  start_application
  configure_nginx
  configure_ssl
  verify_health
}

main "$@"

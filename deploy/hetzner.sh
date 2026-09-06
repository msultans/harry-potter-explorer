#!/usr/bin/env bash
#
# Deploys Harry Potter Explorer to a fresh Debian/Ubuntu server (Hetzner or any
# other VPS) over SSH: installs Docker if needed, copies the project, and brings
# up the app together with its own Ollama instance.
#
#   ./deploy/hetzner.sh root@1.2.3.4                  # plain HTTP on port 80
#   ./deploy/hetzner.sh root@1.2.3.4 hp.example.com   # HTTPS via Caddy
#
# Re-running it updates an existing deployment in place.
#
# Requirements on the server: 4 GB RAM (the model needs ~2 GB), 20 GB disk.
# The script never stores secrets; it only uses your existing SSH access.

set -euo pipefail

TARGET="${1:-}"
DOMAIN="${2:-}"
REMOTE_DIR="/opt/harry-potter-explorer"

if [[ -z "$TARGET" ]]; then
  echo "usage: $0 user@host [domain]" >&2
  exit 1
fi

say() { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
run() { ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$TARGET" "$@"; }

say "Checking SSH access to $TARGET"
run true || { echo "Cannot reach $TARGET over SSH with the keys you already have." >&2; exit 1; }

say "Server details"
run 'echo "  $(. /etc/os-release && echo "$PRETTY_NAME")"; echo "  CPU: $(nproc) cores"; echo "  RAM: $(free -h | awk "/^Mem:/ {print \$2}")"; echo "  Disk free: $(df -h / | awk "NR==2 {print \$4}")"'

# A 4 GB server has no swap by default, and `next build` next to an image build
# can exhaust it. 2 GB of swap costs nothing and turns an OOM kill into slowness.
say "Ensuring swap exists"
run 'if [ "$(swapon --show --noheadings | wc -l)" -eq 0 ]; then
       fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap -q /swapfile && swapon /swapfile
       grep -q "^/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab
       echo "  2 GB swap added"
     else
       echo "  swap already present"
     fi'

say "Installing Docker if it is missing"
run 'command -v docker >/dev/null 2>&1 || (curl -fsSL https://get.docker.com | sh)'
run 'docker --version && docker compose version'

say "Copying the project to $REMOTE_DIR"
run "mkdir -p $REMOTE_DIR"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env.local' \
  --exclude '.vercel' \
  -e 'ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new' \
  ./ "$TARGET:$REMOTE_DIR/"

say "Building and starting the stack (first run downloads ~7 GB of images)"
if [[ -n "$DOMAIN" ]]; then
  # Caddy terminates TLS and forwards to the app, so the app itself stays on
  # the internal network instead of being exposed directly.
  run "cd $REMOTE_DIR && PORT=127.0.0.1:3000 docker compose up -d --build"
  say "Setting up Caddy for https://$DOMAIN"
  run "command -v caddy >/dev/null 2>&1 || (apt-get update -qq && apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl && curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list && apt-get update -qq && apt-get install -y -qq caddy)"
  run "printf '%s {\n\treverse_proxy 127.0.0.1:3000\n}\n' '$DOMAIN' > /etc/caddy/Caddyfile && systemctl reload caddy"
  URL="https://$DOMAIN"
else
  run "cd $REMOTE_DIR && PORT=80 docker compose up -d --build"
  URL="http://${TARGET#*@}"
fi

say "Waiting for the site to answer"
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$URL" || true)
  [[ "$code" == "200" ]] && break
  sleep 5
done

say "Done"
echo "  Site:  $URL"
echo "  Logs:  ssh $TARGET 'cd $REMOTE_DIR && docker compose logs -f app'"
echo "  Model: ssh $TARGET 'cd $REMOTE_DIR && docker compose logs -f model-puller'"
echo
echo "The chat becomes available once the model finishes downloading;"
echo "until then the widget says so and the rest of the site works."

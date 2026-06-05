#!/bin/bash

set -euo pipefail

# 获取脚本所在目录（.zscripts）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log_step_start() {
        local step_name="$1"
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting: $step_name"
        echo "=========================================="
        export STEP_START_TIME
        STEP_START_TIME=$(date +%s)
}

log_step_end() {
        local step_name="${1:-Unknown step}"
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - STEP_START_TIME))
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Completed: $step_name"
        echo "[LOG] Step: $step_name | Duration: ${duration}s"
        echo "=========================================="
        echo ""
}

start_mini_services() {
        local mini_services_dir="$PROJECT_DIR/mini-services"
        local started_count=0

        log_step_start "Starting mini-services"
        if [ ! -d "$mini_services_dir" ]; then
                echo "Mini-services directory not found, skipping..."
                log_step_end "Starting mini-services"
                return 0
        fi

        echo "Found mini-services directory, scanning for sub-services..."

        for service_dir in "$mini_services_dir"/*; do
                if [ ! -d "$service_dir" ]; then
                        continue
                fi

                local service_name
                service_name=$(basename "$service_dir")
                echo "Checking service: $service_name"

                if [ ! -f "$service_dir/package.json" ]; then
                        echo "[$service_name] No package.json found, skipping..."
                        continue
                fi

                if ! grep -q '"dev"' "$service_dir/package.json"; then
                        echo "[$service_name] No dev script found, skipping..."
                        continue
                fi

                echo "Starting $service_name in background..."
                (
                        cd "$service_dir"
                        echo "[$service_name] Installing dependencies..."
                        bun install
                        echo "[$service_name] Running bun run dev..."
                        exec bun run dev
                ) >"$PROJECT_DIR/.zscripts/mini-service-${service_name}.log" 2>&1 &

                local service_pid=$!
                echo "[$service_name] Started in background (PID: $service_pid)"
                echo "[$service_name] Log: $PROJECT_DIR/.zscripts/mini-service-${service_name}.log"
                disown "$service_pid" 2>/dev/null || true
                started_count=$((started_count + 1))
        done

        echo "Mini-services startup completed. Started $started_count service(s)."
        log_step_end "Starting mini-services"
}

wait_for_service() {
        local host="$1"
        local port="$2"
        local service_name="$3"
        local max_attempts="${4:-60}"
        local attempt=1

        echo "Waiting for $service_name to be ready on $host:$port..."

        while [ "$attempt" -le "$max_attempts" ]; do
                if curl -s --connect-timeout 2 --max-time 5 "http://$host:$port" >/dev/null 2>&1; then
                        echo "$service_name is ready!"
                        return 0
                fi

                echo "Attempt $attempt/$max_attempts: $service_name not ready yet, waiting..."
                sleep 1
                attempt=$((attempt + 1))
        done

        echo "ERROR: $service_name failed to start within $max_attempts seconds"
        return 1
}

cd "$PROJECT_DIR"

# ─── Ensure .env has all required variables ───────────────────────
# The container's /start.sh may overwrite .env with just DATABASE_URL.
# We need Supabase and Zhipu keys for auth middleware and AI features.
log_step_start "Environment setup"
echo "[ENV] Ensuring .env has all required variables..."

ENV_FILE="$PROJECT_DIR/.env"
ENV_CHANGED=false

# Required env vars (key=name, value to set if missing)
declare -A REQUIRED_ENV=(
  ["DATABASE_URL"]="file:$PROJECT_DIR/db/custom.db"
  ["DIRECT_URL"]="postgresql://postgres:%5BNilay%409909250605%5D@db.ssaskkftdpidfwvpgdwl.supabase.co:5432/postgres"
  ["NEXT_PUBLIC_SUPABASE_URL"]="https://ssaskkftdpidfwvpgdwl.supabase.co"
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTMyOTYsImV4cCI6MjA5NTU2OTI5Nn0.9B2yYStYtOVTHAAbJn3_czl7F5laVH6rT0VXX0MVScg"
  ["SUPABASE_SERVICE_ROLE_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk5MzI5NiwiZXhwIjoyMDk1NTY5Mjk2fQ.5yna1hYhjqmzrLiqoTmVoKKsB6Fr90qILdkTVTqSyF0"
  ["ZHIPU_API_KEY"]="c68cdeade96b45fa8bf45fbd487707b2.cgpoWSZ5Ae8BHEdO"
)

for key in "${!REQUIRED_ENV[@]}"; do
  value="${REQUIRED_ENV[$key]}"
  if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    echo "${key}=${value}" >> "$ENV_FILE"
    ENV_CHANGED=true
    echo "[ENV] Added ${key}"
  fi
done

if [ "$ENV_CHANGED" = true ]; then
  echo "[ENV] Updated .env with missing variables"
else
  echo "[ENV] All required variables already present"
fi
log_step_end "Environment setup"

if ! command -v bun >/dev/null 2>&1; then
        echo "ERROR: bun is not installed or not in PATH"
        exit 1
fi

log_step_start "bun install"
echo "[BUN] Installing dependencies..."
bun install
log_step_end "bun install"

log_step_start "bun run db:push"
echo "[BUN] Setting up database..."
bun run db:push
log_step_end "bun run db:push"

log_step_start "Building Next.js for production"
echo "[BUILD] Running next build (dev mode crashes with webpack OOM)..."
export NODE_OPTIONS="--max-old-space-size=1024"
export DATABASE_URL="file:$PROJECT_DIR/db/custom.db"
bun run build
log_step_end "Building Next.js for production"

log_step_start "Starting Next.js production server"
echo "[PROD] Starting production server on port 3000..."
export NODE_ENV="production"
export HOSTNAME="0.0.0.0"
export PORT=3000

# Supabase credentials (required for auth middleware at runtime)
export NEXT_PUBLIC_SUPABASE_URL="https://ssaskkftdpidfwvpgdwl.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTMyOTYsImV4cCI6MjA5NTU2OTI5Nn0.9B2yYStYtOVTHAAbJn3_czl7F5laVH6rT0VXX0MVScg"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXNra2Z0ZHBpZGZ3dnBnZHdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk5MzI5NiwiZXhwIjoyMDk1NTY5Mjk2fQ.5yna1hYhjqmzrLiqoTmVoKKsB6Fr90qILdkTVTqSyF0"
export ZHIPU_API_KEY="c68cdeade96b45fa8bf45fbd487707b2.cgpoWSZ5Ae8BHEdO"

# Start the server using Node.js detached spawn — this survives tini process reaper
# and keeps running even if this shell script dies. The daemon-launcher.js handles
# auto-restart if the server crashes.
node -e "
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env variables
const envPath = path.join('$PROJECT_DIR', '.env');
const env = { ...process.env };
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...val] = line.split('=');
    if (key && val.length) env[key.trim()] = val.join('=').trim();
  });
}
env.NODE_ENV = 'production';
env.HOSTNAME = '0.0.0.0';
env.PORT = '3000';
env.NODE_OPTIONS = '--max-old-space-size=768';

const child = spawn(path.join('$PROJECT_DIR', 'node_modules', '.bin', 'next'), ['start', '-p', '3000', '-H', '0.0.0.0'], {
  cwd: '$PROJECT_DIR',
  env,
  detached: true,
  stdio: ['ignore', fs.openSync('/tmp/leadreach-server.log', 'a'), fs.openSync('/tmp/leadreach-server.log', 'a')]
});
child.unref();
fs.writeFileSync('/tmp/next-server.pid', String(child.pid));
console.log('[PROD] Server started with detached PID:', child.pid);
"

log_step_end "Starting Next.js production server"

log_step_start "Waiting for Next.js server"
wait_for_service "localhost" "3000" "Next.js production server"
log_step_end "Waiting for Next.js server"

log_step_start "Health check"
echo "[PROD] Performing health check..."
curl -fsS localhost:3000 >/dev/null
echo "[PROD] Health check passed"
log_step_end "Health check"

start_mini_services

echo "Next.js production server is running (detached process, survives tini reaper)."

# Keep the script alive with a lightweight monitoring loop
# If the server dies, restart it using the same detached spawn approach
while true; do
        SERVER_PID=$(cat /tmp/next-server.pid 2>/dev/null || echo "")
        if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
                sleep 30
        else
                echo "[PROD] Server process died, restarting via detached spawn..."
                node -e "
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const envPath = path.join('$PROJECT_DIR', '.env');
const env = { ...process.env };
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...val] = line.split('=');
    if (key && val.length) env[key.trim()] = val.join('=').trim();
  });
}
env.NODE_ENV = 'production'; env.HOSTNAME = '0.0.0.0'; env.PORT = '3000'; env.NODE_OPTIONS = '--max-old-space-size=768';
const child = spawn(path.join('$PROJECT_DIR', 'node_modules', '.bin', 'next'), ['start', '-p', '3000', '-H', '0.0.0.0'], {
  cwd: '$PROJECT_DIR', env, detached: true,
  stdio: ['ignore', fs.openSync('/tmp/leadreach-server.log', 'a'), fs.openSync('/tmp/leadreach-server.log', 'a')]
});
child.unref();
fs.writeFileSync('/tmp/next-server.pid', String(child.pid));
console.log('[PROD] Server restarted with detached PID:', child.pid);
"
                sleep 5
        fi
done

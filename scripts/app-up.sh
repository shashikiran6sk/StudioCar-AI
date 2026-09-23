#!/bin/sh
# Starts the complete local StudioCar AI environment, including the Next.js
# application. The dispatcher must reach the application inside the compose
# network rather than on the host.
set -eu

cd "$(dirname "$0")/.."

# The worker image installs only the worker dependency trees, so the Prisma
# client is generated here and copied in with the source.
pnpm db:generate

DISPATCH_TARGET_URL="${DISPATCH_TARGET_URL:-http://web:3000}" \
  sh scripts/local-compose.sh --profile app up -d "$@"

cat <<'MESSAGE'

StudioCar AI is starting.

  Application   http://localhost:3000
  Mail inbox    http://localhost:8025
  Object store  http://localhost:9001  (studiocarlocal / studiocarlocal123)
  Queues        http://localhost:9324  (SQS-compatible)

Run `pnpm infra:build` after changing application or worker code.

Apply migrations once the database is healthy:

  DATABASE_URL=postgresql://studiocar:studiocar@localhost:5432/studiocar pnpm db:migrate:deploy
MESSAGE

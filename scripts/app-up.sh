#!/bin/sh
# Starts the complete Local StudioCar AI environment, including the Next.js
# application in a container. The dispatcher must reach the application inside
# the compose network rather than on the host.
set -eu

cd "$(dirname "$0")/.."
. scripts/local-environment.sh

if [ "$APP_ENV" != local ]; then
  refuse "pnpm app:up runs the Local environment only. For Development, run
\`pnpm infra:up\` and then \`pnpm dev\`."
fi

# The worker image installs only the worker dependency trees, so the Prisma
# client is generated here and copied in with the source.
pnpm db:generate

DISPATCH_TARGET_URL="${DISPATCH_TARGET_URL:-http://web:3000}" \
  sh scripts/local-compose.sh --profile app up -d "$@"

cat <<'MESSAGE'

StudioCar AI is starting (APP_ENV=local).

  Application   http://localhost:3000
  Mail inbox    http://localhost:8025
  Object store  http://localhost:9001  (studiocarlocal / studiocarlocal123)
  Queues        http://localhost:9324  (SQS-compatible)

Run `pnpm infra:build` after changing application or worker code.

Once the database is healthy:

  pnpm db:reset && pnpm db:seed
MESSAGE

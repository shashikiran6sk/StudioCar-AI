#!/bin/sh
# Starts every local dependency and background process except the Next.js
# application, so `pnpm dev` can run it natively.
set -eu

cd "$(dirname "$0")/.."

# The worker image installs only the worker dependency trees, so the Prisma
# client is generated here and copied in with the source.
pnpm db:generate

docker compose -f infrastructure/local/docker-compose.yml --profile infra up -d "$@"

cat <<'MESSAGE'

Local infrastructure is running.

  Mail inbox    http://localhost:8025
  Object store  http://localhost:9001  (studiocarlocal / studiocarlocal123)
  Queues        http://localhost:9324  (SQS-compatible)
  PostgreSQL    postgresql://studiocar:studiocar@localhost:5432/studiocar

Run `pnpm infra:build` after changing worker code or dependencies.

Apply migrations, then start the application:

  DATABASE_URL=postgresql://studiocar:studiocar@localhost:5432/studiocar pnpm db:migrate:deploy
  pnpm dev
MESSAGE

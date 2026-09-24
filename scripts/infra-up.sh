#!/bin/sh
# Starts the support plane for the configured APP_ENV, so `pnpm dev` can run
# the application natively.
#
#   local        PostgreSQL, MinIO, ElasticMQ, Mailpit, both workers, dispatcher
#   development  ElasticMQ, Mailpit, both workers, dispatcher; the database and
#                storage are the real Development ones named in .env.local
set -eu

cd "$(dirname "$0")/.."
. scripts/local-environment.sh

if [ "$APP_ENV" = local ]; then
  COMPOSE_PROFILE=infra
else
  COMPOSE_PROFILE=development
fi

# The worker image installs only the worker dependency trees, so the Prisma
# client is generated here and copied in with the source.
pnpm db:generate

sh scripts/local-compose.sh --profile "$COMPOSE_PROFILE" up -d "$@"

if [ "$APP_ENV" = local ]; then
  cat <<'MESSAGE'

Local infrastructure is running (APP_ENV=local).

  Mail inbox    http://localhost:8025
  Object store  http://localhost:9001  (studiocarlocal / studiocarlocal123)
  Queues        http://localhost:9324  (SQS-compatible)
  PostgreSQL    postgresql://studiocar:studiocar@localhost:5432/studiocar

First run, or after a reset:

  pnpm db:reset    # drop and reapply every migration (Local only)
  pnpm db:seed     # install the plan catalog

Then start the application:

  pnpm dev

Run `pnpm infra:build` after changing worker code or dependencies.
MESSAGE
else
  cat <<'MESSAGE'

Development support plane is running (APP_ENV=development).

  Mail inbox    http://localhost:8025
  Queues        http://localhost:9324  (SQS-compatible)

The workers use the Development database and AWS S3 bucket from .env.local.
Apply migrations to the Development database when needed, then start:

  pnpm db:migrate:deploy
  pnpm dev

Run `pnpm infra:build` after changing worker code or dependencies.
MESSAGE
fi

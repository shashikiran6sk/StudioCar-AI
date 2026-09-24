#!/bin/sh
# Starts the support plane for the configured APP_ENV, so `pnpm dev` can run
# the application natively.
#
#   local        PostgreSQL, MinIO, ElasticMQ, image worker, dispatcher
#   development  image worker, dispatcher; the database, storage, and queue
#                are the real Development ones named in .env.local
set -eu

cd "$(dirname "$0")/.."
. scripts/local-environment.sh

if [ "$APP_ENV" = local ]; then
  COMPOSE_PROFILE=infra
else
  COMPOSE_PROFILE=development
  # Without a queue the worker would start only to fail validation, so the
  # missing setting is named here instead of in a container log.
  if [ -z "$(read_setting SQS_IMAGE_QUEUE_URL)" ]; then
    refuse "SQS_IMAGE_QUEUE_URL is required in Development: the AWS SQS
Development queue the application publishes to and the image worker consumes.
See docs/environments.md."
  fi
fi

# The worker image installs only the worker dependency tree, so the Prisma
# client is generated here and copied in with the source.
pnpm db:generate

sh scripts/local-compose.sh --profile "$COMPOSE_PROFILE" up -d "$@"

if [ "$APP_ENV" = local ]; then
  cat <<'MESSAGE'

Local infrastructure is running (APP_ENV=local).

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

The image worker consumes the AWS SQS Development queue and uses the
Development database and AWS S3 bucket, all from .env.local.
Apply migrations to the Development database when needed, then start:

  pnpm db:migrate:deploy
  pnpm dev

Run `pnpm infra:build` after changing worker code or dependencies.
MESSAGE
fi

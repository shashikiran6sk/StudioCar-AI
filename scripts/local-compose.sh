#!/bin/sh
# Runs docker compose for the local stack against the same settings file the
# application reads, so the application and the containers can never disagree
# about APP_ENV, a dispatch token, a provider key, or which bucket holds an
# upload.
#
#   sh scripts/local-compose.sh --profile infra up -d
set -eu

cd "$(dirname "$0")/.."
. scripts/local-environment.sh

# Inside a container `localhost` is the container itself. The developer's
# machine, where every local port is published, is host.docker.internal.
to_container_host() {
  sed -E 's#(://|@)(localhost|127\.0\.0\.1)([:/]|$)#\1host.docker.internal\3#'
}

# Exports LOCAL_WORKER_<name> for the image worker. In Development every value
# is passed through, empty ones included: an empty endpoint means AWS S3, and a
# compose default would silently substitute local MinIO. In Local only values
# the file actually sets are passed, and compose supplies the MinIO defaults.
export_worker_setting() {
  value=$(read_setting "$1")
  case "$1" in *ENDPOINT | DATABASE_URL) value=$(printf '%s' "$value" | to_container_host) ;; esac
  if [ "$APP_ENV" = development ] || [ -n "$value" ]; then
    eval "LOCAL_WORKER_$1=\$value"
    export "LOCAL_WORKER_$1"
  fi
}

# The workers read and write where the application does: its database, and
# the bucket the browser uploaded the original to.
for setting in DATABASE_URL AWS_REGION S3_BUCKET S3_ENDPOINT S3_FORCE_PATH_STYLE \
  S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY; do
  export_worker_setting "$setting"
done

# A container cannot always reach the address the application uses: Docker
# Desktop has no IPv6 route, and some hosted databases publish only IPv6 (the
# Supabase direct host). WORKER_DATABASE_URL then names an IPv4 address for
# the same database, such as its session pooler, for the worker alone. The
# application keeps its direct connection and the pooler's small session limit.
worker_database_url=$(read_setting WORKER_DATABASE_URL)
if [ -n "$worker_database_url" ]; then
  if [ "$APP_ENV" != development ]; then
    refuse "WORKER_DATABASE_URL is a Development setting. Under APP_ENV=$APP_ENV the worker uses the local PostgreSQL. See docs/environments.md."
  fi
  LOCAL_WORKER_DATABASE_URL=$(printf '%s' "$worker_database_url" | to_container_host)
  export LOCAL_WORKER_DATABASE_URL
fi

# Fills every ${...} placeholder in the compose file from the settings file. A
# variable already set in the shell still wins.
exec docker compose -f infrastructure/local/docker-compose.yml \
  --env-file "$ENVIRONMENT_FILE" "$@"

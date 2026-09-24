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

# Fills every ${...} placeholder in the compose file from the settings file. A
# variable already set in the shell still wins.
exec docker compose -f infrastructure/local/docker-compose.yml \
  --env-file "$ENVIRONMENT_FILE" "$@"

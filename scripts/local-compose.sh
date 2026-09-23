#!/bin/sh
# Runs docker compose for the local environment against the same settings the
# application reads, so the application and the containers can never disagree
# about a dispatch token, a provider key, or which bucket holds an upload.
#
#   sh scripts/local-compose.sh --profile infra up -d
set -eu

cd "$(dirname "$0")/.."

ENVIRONMENT_FILE=apps/web/.env

# The value of one setting in the file, without surrounding quotes. Absent and
# empty both read as empty, which is exactly how the application treats them.
read_setting() {
  sed -n "s/^$1=//p" "$ENVIRONMENT_FILE" | tail -n 1 | sed -E "s/^[\"']//; s/[\"']\$//"
}

if [ -f "$ENVIRONMENT_FILE" ]; then
  # Fills every ${...} placeholder in the compose file from the same file the
  # application reads. A variable already set in the shell still wins.
  set -- --env-file "$ENVIRONMENT_FILE" "$@"

  # The image worker reads the originals the browser uploaded, so it must use
  # the application's storage exactly. These are exported even when empty: an
  # unset path-style flag means something different to AWS than `true`, and a
  # compose default would silently substitute the local MinIO value.
  LOCAL_WORKER_AWS_REGION=$(read_setting AWS_REGION)
  LOCAL_WORKER_S3_BUCKET=$(read_setting S3_BUCKET)
  LOCAL_WORKER_S3_FORCE_PATH_STYLE=$(read_setting S3_FORCE_PATH_STYLE)
  LOCAL_WORKER_S3_ACCESS_KEY_ID=$(read_setting S3_ACCESS_KEY_ID)
  LOCAL_WORKER_S3_SECRET_ACCESS_KEY=$(read_setting S3_SECRET_ACCESS_KEY)
  # Inside a container `localhost` is the container itself. The developer's
  # machine, where MinIO's port is published, is host.docker.internal.
  LOCAL_WORKER_S3_ENDPOINT=$(read_setting S3_ENDPOINT |
    sed -E 's#^(https?://)(localhost|127\.0\.0\.1)([:/]|$)#\1host.docker.internal\3#')
  export LOCAL_WORKER_AWS_REGION LOCAL_WORKER_S3_BUCKET \
    LOCAL_WORKER_S3_FORCE_PATH_STYLE LOCAL_WORKER_S3_ACCESS_KEY_ID \
    LOCAL_WORKER_S3_SECRET_ACCESS_KEY LOCAL_WORKER_S3_ENDPOINT
fi

exec docker compose -f infrastructure/local/docker-compose.yml "$@"

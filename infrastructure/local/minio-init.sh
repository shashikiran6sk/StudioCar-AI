#!/bin/sh
# Creates the private bucket and the browser CORS rule that direct uploads
# need. Safe to re-run: every step is idempotent.
set -eu

mc alias set local "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null

if ! mc ls "local/$S3_BUCKET" >/dev/null 2>&1; then
  mc mb "local/$S3_BUCKET"
  echo "created bucket $S3_BUCKET"
fi

# Private by default; objects are only ever reached through signed requests.
mc anonymous set none "local/$S3_BUCKET" >/dev/null

# Browser CORS is applied by the MinIO server itself through
# MINIO_API_CORS_ALLOW_ORIGIN, because this mc build carries no `cors` command.

echo "minio ready: private bucket $S3_BUCKET"

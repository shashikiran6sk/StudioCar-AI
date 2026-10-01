#!/usr/bin/env bash
# Publishes the image-worker Lambda archive CI built and tested to the private
# artifact bucket, at an immutable key named after the commit's SHA, shortened
# to ARTIFACT_SHA_LENGTH characters (5–40; 40 when unset):
#
#   s3://$ARTIFACT_BUCKET/$ARTIFACT_PREFIX/<short-sha>.zip
#   s3://$ARTIFACT_BUCKET/$ARTIFACT_PREFIX/<short-sha>.manifest.json
#
# The full commit SHA is stored on each object as `commit-sha` metadata. A
# shortened SHA shared with an earlier commit is refused (the key exists with
# different bytes), never overwritten: raise ARTIFACT_SHA_LENGTH if that happens.
#
# Every write is conditional on the key not existing (If-None-Match), and S3
# verifies the SHA-256 on upload. Re-running for the same commit succeeds only
# if the stored archive has the same checksum; a different one is an error,
# never an overwrite.
#
# Required: ARTIFACT_BUCKET, ARTIFACT_PREFIX, COMMIT_SHA, ARCHIVE_DIRECTORY.
# Writes artifact-key, manifest-key and sha256 to $GITHUB_OUTPUT when set.
set -euo pipefail

: "${ARTIFACT_BUCKET:?ARTIFACT_BUCKET is required}"
: "${ARTIFACT_PREFIX:?ARTIFACT_PREFIX is required}"
: "${COMMIT_SHA:?COMMIT_SHA is required}"
: "${ARCHIVE_DIRECTORY:?ARCHIVE_DIRECTORY is required}"

if ! printf '%s' "$COMMIT_SHA" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "COMMIT_SHA must be a full 40-character commit SHA." >&2
  exit 1
fi
sha_length="${ARTIFACT_SHA_LENGTH:-40}"
if ! printf '%s' "$sha_length" | grep -Eq '^[0-9]+$' ||
  [ "$sha_length" -lt 5 ] || [ "$sha_length" -gt 40 ]; then
  echo "ARTIFACT_SHA_LENGTH must be a whole number from 5 to 40." >&2
  exit 1
fi
short_sha="${COMMIT_SHA:0:$sha_length}"

archive="$ARCHIVE_DIRECTORY/image-processing-worker.zip"
manifest="$ARCHIVE_DIRECTORY/image-processing-worker.manifest.json"
[ -f "$archive" ] || { echo "Missing $archive" >&2; exit 1; }
[ -f "$manifest" ] || { echo "Missing $manifest" >&2; exit 1; }

sha256_hex="$(sha256sum "$archive" | cut -d ' ' -f 1)"
manifest_sha256="$(jq -r '.sha256' "$manifest")"
if [ "$sha256_hex" != "$manifest_sha256" ]; then
  echo "The archive does not match its manifest's SHA-256." >&2
  exit 1
fi

prefix="${ARTIFACT_PREFIX%/}"
archive_key="$prefix/$short_sha.zip"
manifest_key="$prefix/$short_sha.manifest.json"

# Uploads one file unless the key already exists; an existing object must
# carry the same SHA-256, which makes a re-run for the same commit a no-op.
publish() {
  local key="$1" file="$2" content_type="$3"
  local checksum errors
  checksum="$(openssl dgst -sha256 -binary "$file" | base64)"
  errors="$(mktemp)"
  if aws s3api put-object \
    --bucket "$ARTIFACT_BUCKET" \
    --key "$key" \
    --body "$file" \
    --content-type "$content_type" \
    --checksum-algorithm SHA256 \
    --checksum-sha256 "$checksum" \
    --if-none-match '*' \
    --metadata "commit-sha=$COMMIT_SHA" \
    >/dev/null 2>"$errors"; then
    rm -f "$errors"
    echo "Published s3://$ARTIFACT_BUCKET/$key"
    return 0
  fi
  if ! grep -q 'PreconditionFailed' "$errors"; then
    cat "$errors" >&2
    rm -f "$errors"
    return 1
  fi
  rm -f "$errors"
  local stored
  stored="$(aws s3api head-object \
    --bucket "$ARTIFACT_BUCKET" \
    --key "$key" \
    --checksum-mode ENABLED \
    --query ChecksumSHA256 \
    --output text)"
  if [ "$stored" != "$checksum" ]; then
    echo "s3://$ARTIFACT_BUCKET/$key already exists with different contents." >&2
    return 1
  fi
  echo "Already published s3://$ARTIFACT_BUCKET/$key (same SHA-256)"
}

publish "$archive_key" "$archive" application/zip
publish "$manifest_key" "$manifest" application/json

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "artifact-key=$archive_key"
    echo "manifest-key=$manifest_key"
    echo "sha256=$sha256_hex"
  } >>"$GITHUB_OUTPUT"
fi
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### Image worker archive published"
    echo
    echo "| | |"
    echo "| --- | --- |"
    echo "| Archive | \`s3://$ARTIFACT_BUCKET/$archive_key\` |"
    echo "| Manifest | \`s3://$ARTIFACT_BUCKET/$manifest_key\` |"
    echo "| Commit | \`$COMMIT_SHA\` |"
    echo "| SHA-256 | \`$sha256_hex\` |"
    echo
    echo "Deploy it by updating the worker stack's \`ArtifactKey\` to \`$archive_key\`."
  } >>"$GITHUB_STEP_SUMMARY"
fi

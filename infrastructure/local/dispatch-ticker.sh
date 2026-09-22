#!/bin/sh
# Stands in for the production scheduler. The processing and email outboxes are
# drained by authenticated HTTP endpoints, not by the queue, so something has to
# call them on a cadence for queued work to move.
set -u

echo "dispatch ticker targeting $DISPATCH_TARGET_URL every ${DISPATCH_INTERVAL_SECONDS}s"

while true; do
  curl -fsS -X POST \
    -H "Authorization: Bearer $PROCESSING_DISPATCH_TOKEN" \
    "$DISPATCH_TARGET_URL/api/internal/jobs/dispatch" >/dev/null 2>&1 || true
  curl -fsS -X POST \
    -H "Authorization: Bearer $EMAIL_DISPATCH_TOKEN" \
    "$DISPATCH_TARGET_URL/api/internal/email/dispatch" >/dev/null 2>&1 || true
  sleep "$DISPATCH_INTERVAL_SECONDS"
done

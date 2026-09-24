#!/bin/sh
# Stands in for the production scheduler. The processing outbox is drained by an
# authenticated HTTP endpoint, not by the queue, so something has to call it on
# a cadence for queued work to move.
set -u

echo "dispatch ticker targeting $DISPATCH_TARGET_URL every ${DISPATCH_INTERVAL_SECONDS}s"

while true; do
  curl -fsS -X POST \
    -H "Authorization: Bearer $PROCESSING_DISPATCH_TOKEN" \
    "$DISPATCH_TARGET_URL/api/internal/jobs/dispatch" >/dev/null 2>&1 || true
  sleep "$DISPATCH_INTERVAL_SECONDS"
done

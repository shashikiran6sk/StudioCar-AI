#!/bin/sh
# Sourced by the local compose scripts. Reads the repository-root settings
# file, the one every local process reads, and resolves APP_ENV from it.
#
# Afterwards: ENVIRONMENT_FILE, APP_ENV (exported), and read_setting.

ENVIRONMENT_FILE=.env.local

# The value of one setting in the file, without surrounding quotes. Absent and
# empty both read as empty, which is exactly how the application treats them.
read_setting() {
  sed -n "s/^$1=//p" "$ENVIRONMENT_FILE" | tail -n 1 | sed -E "s/^[\"']//; s/[\"']\$//"
}

refuse() {
  printf '%s\n' "$1" >&2
  exit 1
}

if [ ! -f "$ENVIRONMENT_FILE" ]; then
  refuse "No $ENVIRONMENT_FILE at the repository root. Start from an example:

  cp .env.example.local .env.local        # Local: only REMOVEBG_API_KEY to fill in
  cp .env.example.development .env.local  # Development: real Google, MSG91, S3

See docs/environments.md."
fi

# A value already set in the shell wins, as it does for every other setting.
APP_ENV="${APP_ENV:-$(read_setting APP_ENV)}"
export APP_ENV

case "$APP_ENV" in
  local | development) ;;
  production)
    refuse "APP_ENV is production. The local stack never runs production; production workers and queues are deployed." ;;
  *)
    refuse "APP_ENV must be local or development in $ENVIRONMENT_FILE (found \"$APP_ENV\"). See docs/environments.md." ;;
esac

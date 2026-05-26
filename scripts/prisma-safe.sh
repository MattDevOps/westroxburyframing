#!/usr/bin/env bash
# prisma-safe.sh — Wrapper around `prisma` that requires explicit confirmation
# when running destructive subcommands against the production Neon database.
#
# Usage:
#   ./scripts/prisma-safe.sh migrate dev --name my_migration
#   ./scripts/prisma-safe.sh migrate reset
#   ./scripts/prisma-safe.sh db push
#
# Or via npm:
#   npm run prisma:safe -- migrate reset

set -euo pipefail

PROD_HOST_FRAGMENT="ep-cool-hall-ajjufk3v"
DANGEROUS_PATTERNS=(
  "migrate reset"
  "db push --force-reset"
  "db push --accept-data-loss"
  "migrate dev"
)

ALL_ARGS="$*"

is_dangerous=false
for pat in "${DANGEROUS_PATTERNS[@]}"; do
  if [[ "$ALL_ARGS" == *"$pat"* ]]; then
    is_dangerous=true
    matched_pattern="$pat"
    break
  fi
done

current_url="${DATABASE_URL:-}"
if [[ -z "$current_url" && -f .env ]]; then
  current_url=$(grep -E "^DATABASE_URL=" .env | head -1 | cut -d= -f2- | tr -d '"' || true)
fi

is_prod=false
if [[ "$current_url" == *"$PROD_HOST_FRAGMENT"* ]]; then
  is_prod=true
fi

if $is_dangerous && $is_prod; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  DANGER: destructive Prisma command targeting PRODUCTION DB  ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Command:    npx prisma $ALL_ARGS"
  echo "  Matched:    '$matched_pattern'"
  echo "  Host:       $PROD_HOST_FRAGMENT (production Neon)"
  echo ""
  echo "  This can DELETE ALL DATA from the production database."
  echo "  On 2026-05-21 a similar command wiped 200+ customer records."
  echo ""
  read -r -p "  Type 'WIPE PRODUCTION' to proceed, anything else to abort: " confirmation
  if [[ "$confirmation" != "WIPE PRODUCTION" ]]; then
    echo ""
    echo "Aborted. No changes made."
    exit 1
  fi
  echo ""
  echo "Proceeding..."
fi

exec npx prisma "$@"

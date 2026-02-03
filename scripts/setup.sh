#!/usr/bin/env bash
set -euo pipefail

echo "== West Roxbury Framing setup =="

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is not installed. Install Node.js 18+ and re-run."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed."
  exit 1
fi

if [ ! -f ".env.local" ]; then
  echo "ERROR: .env.local not found. Run: cp .env.example .env.local  and fill values."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Running migrations..."
npx prisma migrate dev --name init

echo "Seeding admin user..."
npm run seed

echo "Done."
echo "Run: npm run dev"

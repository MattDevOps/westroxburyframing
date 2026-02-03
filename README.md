# West Roxbury Framing — Starter Repo (Public Site + Staff App)

This repo is a production-oriented starter for:
- Public marketing site (clean, modern)
- Staff app (orders, customers, workflow)
- PostgreSQL (Prisma)
- Square payment linkage (skeleton)
- Mailchimp opt-in sync (skeleton)
- S3-compatible uploads (signed URL skeleton)
- Email notifications (stub)

## Quick start (recommended)
1) Install prerequisites:
- Node.js 18+ (or 20+)
- PostgreSQL (local or hosted)

2) From the repo root:
```bash
cp .env.example .env.local
# edit .env.local and set DATABASE_URL + AUTH_SECRET + seed admin creds
./scripts/setup.sh
npm run dev
```

Then open:
- Public site: http://localhost:3000
- Staff login: http://localhost:3000/staff/login

## Notes on Square (card-present)
Square “tap/insert” flows vary depending on whether you use:
- Square POS (manual checkout) + attach payment afterwards
- Terminal API
- Reader SDK

This starter includes a server-side Payments API skeleton (`lib/square.ts`) to keep the rest of the app consistent.
You can swap the internals later without changing the DB model or UI flows.

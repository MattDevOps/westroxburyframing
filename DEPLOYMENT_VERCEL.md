# Vercel Deployment Guide

## 1. Environment Variables for Vercel

Add these in **Vercel Dashboard → Project → Settings → Environment Variables** (use Production and Preview):

### Required (core)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. from Vercel Postgres, Neon, Supabase) |
| `AUTH_SECRET` | Long random string for auth cookies (e.g. `openssl rand -base64 32`) |
| `STAFF_SEED_ADMIN_EMAIL` | Admin login email |
| `STAFF_SEED_ADMIN_PASSWORD` | Admin login password |

### Square (invoices & payments)

| Variable | Description |
|----------|-------------|
| `SQUARE_ENV` | `production` for live; `sandbox` for testing |
| `SQUARE_ACCESS_TOKEN` | Production or Sandbox access token from Square Developer Dashboard (PRIVATE - server-side only) |
| `SQUARE_LOCATION_ID` | Your Square location ID (can be public) |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID` | Your Square Application ID (public - safe to expose) |
| `NEXT_PUBLIC_SQUARE_LOCATION_ID` | Your Square Location ID (public - safe to expose) |
| `NEXT_PUBLIC_SQUARE_ENV` | `production` or `sandbox` (must match `SQUARE_ENV`) |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | **Required for auto-sync** – from Square webhook subscription (see below) |

### Webhook URL (required for auto-sync)

| Variable | Description |
|----------|-------------|
| `PUBLIC_BASE_URL` | Your Vercel URL, e.g. `https://westroxburyframing.vercel.app` (no trailing slash) |

### Email (Postmark – invoices paid, contact form)

| Variable | Description |
|----------|-------------|
| `EMAIL_PROVIDER_API_KEY` or `POSTMARK_SERVER_API_TOKEN` | Postmark Server API token |
| `EMAIL_FROM` | Sender e.g. `West Roxbury Framing <jake@westroxburyframing.com>` |
| `STAFF_NOTIFICATIONS_EMAIL` | Where invoice-paid emails go (e.g. `jake@westroxburyframing.com`) |
| `CONTACT_FORM_EMAIL` | Where contact form submissions go (optional, defaults to jake@) |

### Optional

| Variable | Description |
|----------|-------------|
| `STORAGE_*` | S3-compatible storage if you use file uploads |
| `GOOGLE_PLACES_API_KEY` | For testimonials |
| `GOOGLE_PLACES_PLACE_ID` | Google Place ID |

---

## 2. Database Migrations

**Important:** Migrations are NOT run automatically during the build process. You must run them manually after deployment or before deploying.

### Option 1: Run migrations before deployment (Recommended)

```bash
# Run migrations locally (they will apply to your production database)
npx prisma migrate deploy
```

### Option 2: Run migrations after deployment

After deploying to Vercel, run migrations manually:

```bash
# Make sure DATABASE_URL is set to your production database
npx prisma migrate deploy
```

### Option 3: Use Vercel CLI (if you have it configured)

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

**Note:** The build script only runs `prisma generate` to create the Prisma Client. Migrations must be run separately to avoid database lock timeouts during build.

---

## 3. Automatic Invoice Sync (No Manual "Sync" Button)

When a customer pays an invoice, Square sends a webhook to your app. Your app updates the order and sends the email.

### Step 1: Configure the webhook in Square

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Open your app → **Webhooks**
3. Add a subscription:
   - **Environment:** Production (or Sandbox for testing)
   - **Event types:** `invoice.payment_made` (and optionally `payment_made`)
   - **URL:** `https://YOUR-VERCEL-URL.vercel.app/api/webhooks/square`
     - Example: `https://westroxburyframing.vercel.app/api/webhooks/square`

4. After saving, Square shows a **Signature key** – copy it.

### Step 2: Add env vars in Vercel

| Variable | Value |
|----------|-------|
| `PUBLIC_BASE_URL` | `https://westroxburyframing.vercel.app` (your actual Vercel URL) |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | The signature key from Square (step 1) |

### Step 3: Redeploy

Redeploy in Vercel after adding these variables. After that:

- Square sends `invoice.payment_made` to your webhook
- Your app updates `squareInvoiceStatus` on the order
- Your app sends the “Invoice paid” email via Postmark

You no longer need to press “Sync payment status” for paid invoices.

---

## 4. Invoice Paid Email

### Requirements

1. **Postmark** – Add the env vars above (`EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `STAFF_NOTIFICATIONS_EMAIL`).
2. **Postmark sender** – Verify `jake@westroxburyframing.com` (or your `EMAIL_FROM`) in Postmark.
3. **Webhook** – The webhook must be configured (Section 2) so your app sends the email when Square reports payment.

### Flow

1. Customer pays invoice in Square.
2. Square sends `invoice.payment_made` to your webhook URL.
3. Your app updates the order and calls `sendInvoicePaidNotification` with order details.
4. Postmark sends the email to `STAFF_NOTIFICATIONS_EMAIL` (e.g. `jake@westroxburyframing.com`).

---

## 5. Quick Checklist

- [ ] `DATABASE_URL` – Vercel Postgres, Neon, or Supabase
- [ ] `AUTH_SECRET` – Random string
- [ ] `SQUARE_ENV` – `production` for live
- [ ] `SQUARE_ACCESS_TOKEN` – Production token
- [ ] `SQUARE_LOCATION_ID` – Your location
- [ ] `PUBLIC_BASE_URL` – Your Vercel URL, e.g. `https://westroxburyframing.vercel.app`
- [ ] `SQUARE_WEBHOOK_SIGNATURE_KEY` – From Square webhook subscription
- [ ] `EMAIL_PROVIDER_API_KEY` – Postmark API token
- [ ] `EMAIL_FROM` – Verified sender
- [ ] `STAFF_NOTIFICATIONS_EMAIL` – Where to send invoice-paid emails
- [ ] Square webhook configured with URL `{PUBLIC_BASE_URL}/api/webhooks/square` and event `invoice.payment_made`

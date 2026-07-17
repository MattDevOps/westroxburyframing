# Spec: Custom Art from Photos — a fourth customer vertical

Status: proposed (not built)
Author: drafted 2026-07-05
Owner: Matt

## 1. The idea

Sell **commissioned art made from a customer's photo**, framed. "Bring in a photo,
we turn it into art, and frame it." The shop does not paint — it brokers the render
to a freelance-artist roster or a print vendor and attaches the frame. Every portrait
order drags a frame sale along with it.

Why this clientele: framing customers already self-select for disposable income,
emotional attachment to objects/memories, and "I'll pay to make this special" intent.
The upsell rides the same emotional purchase, so it converts the customer already at
the counter rather than acquiring a new one.

Emotional hooks (the gallery + ad angles):
- Pet portraits
- House / "first home" portraits
- Wedding-venue paintings
- Memorial portraits (passed pet or relative) — low price sensitivity

## 2. Where it slots into the existing site

The site already runs three sibling customer verticals as public pages:
`/custom-framing`, `/framed-art` (gallery), `/restoration`. **Custom art is a fourth
sibling: `/custom-art`.** It reuses conventions that already exist — no new patterns.

### File-level plan (MVP)

1. **Marketing page** — `src/app/(public)/custom-art/`
   - `page.tsx`: metadata + FAQ JSON-LD, cloned from
     `src/app/(public)/restoration/page.tsx`.
   - `CustomArtContent.tsx`: client component, before/after gallery + intake form.
   - Sample assets in a new `public/custom-art/` folder (mirrors
     `public/restoration/` and `public/framed-art/`).

2. **Services entry** — add a `custom-art` slug to
   `src/app/(public)/services/serviceData.ts`. This gets it into the services list
   and mints a `/services/custom-art` SEO page for free (via the existing
   `services/[slug]/page.tsx`).

3. **Intake form** (the money moment), inside `CustomArtContent.tsx`:
   - Photo upload via **`@vercel/blob`** (already a dependency; the
     `Customer.photoUrls` Json field already stores customer artwork photos, so the
     upload-to-Blob pattern exists in the codebase).
   - Fields: style (line drawing / watercolor / oil), size, **"framed too?"** toggle
     (the built-in upsell), name, email, phone, message.

4. **Backend route** — `src/app/api/custom-art/route.ts`, cloned from
   `src/app/api/contact/route.ts`:
   - Same rate limiter (`rateLimit`) and **spam protection**
     (`detectSpam`, honeypot `company` field, `MIN_FILL_MS` timing trap).
   - Persists to the existing **`CustomerMessage`** inbox with
     `source: "custom_art"` and the uploaded Blob photo URLs (see §3).
   - Emails staff via `sendContactFormEmail` (or a thin variant), same safety-net
     path as contact.

5. **Staff side** — nothing new. Orders land in `/staff/inbox` where staff already
   read and reply to `CustomerMessage` rows. Add `"custom_art"` to the inbox
   source filter/label so it shows a distinct tag.

## 3. Data: reuse the Inbox, one small additive field

`CustomerMessage` (prisma/schema.prisma) has `name, email, phone, subject, body,
source, status, spamReason, replies[]` but **no attachment field**. Two options:

- **Zero-schema (fastest):** embed the Blob photo URL(s) inline at the top of `body`.
  Ships with no migration. Ugly but works for v1.
- **Clean (recommended):** add `attachmentUrls Json @default("[]")` to
  `CustomerMessage`. Additive and nullable-safe.
  NOTE: prod applies schema via **`db push` / `ALTER ... IF NOT EXISTS`, never
  `migrate deploy`** (no `_prisma_migrations` table in prod). Canonical host is
  www.westroxburyframing.com.

No new model needed for the MVP. The two-way email threading
(`CustomerMessageReply`, postmark-inbound) already lets staff quote and converse.

## 4. Phase 2 (once order volume justifies it)

- **Promote to a real order.** New `PortraitOrder` model, or an `Order` line, so it
  flows into the existing Square invoicing + order pipeline (`OrderStatus`,
  `Invoice`, Square). Reuse `Order.source` ("online" | "staff").
- **AI preview render.** `@anthropic-ai/sdk` is already installed. Generate an instant
  mockup ("your dog as a watercolor") before the customer pays — a major conversion
  lever. Needs an image-generation path wired up (the Anthropic SDK is text/vision;
  an image-gen provider or the Vercel AI Gateway would do the render).
- **Checkout upsell.** A "Want this as a painting too?" prompt in the framing order /
  checkout flow so every existing framing customer sees the offer.
- **Fulfillment tracking.** Artist-roster / print-vendor handoff state on the order.

## 5. Economics

Broker model: shop doesn't produce the art. Margin = (portrait price − artist/print
cost) + the attached frame sale. Seasonal spikes: Christmas, Mother's Day, weddings,
memorials. Giftable, low price sensitivity.

## 6. MVP scope summary

One new public page + one new API route, each cloned from an existing file
(`restoration/page.tsx`, `api/contact/route.ts`). One optional additive DB column.
Reuses Blob upload, spam protection, the Inbox, and staff reply tooling already in
production. Estimated: ~1 focused build day, no new infrastructure.

## 7. Open questions

- Style/price tiers and artist/print vendor — business decision, needed before
  Phase 2 invoicing but not for MVP intake.
- Do we want the MVP to auto-create a `Customer` record (like the kiosk) or stay a
  pure inbox message until staff qualifies it?
- AI preview: acceptable to show an AI-generated mockup, or does that undercut the
  "real artist" positioning? Affects Phase 2.

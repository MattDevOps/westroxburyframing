# West Roxbury Framing — Growth Strategy

> Captured 2026-04-27. Working doc — to be revisited and updated as we execute.

## Current Baseline

| Metric | Value |
|---|---|
| Annual revenue | ~$700k |
| Net | ~$480k (≈68% net margin) |
| Locations | 1 (West Roxbury, Boston) |
| Operations | Family-run shop; owner (Matt) handles all digital/dev |
| Existing B2B | Some designers, police, hotels |
| Brand position | Well-known in Boston, multi-decade business |
| Long-term goal | Build to a regional chain and exit for millions |

## What the 68% Net Margin Tells Us

- Most retail framing nets 10–20%. 68% means low fixed costs (likely owned building + family labor) and strong unit economics.
- Marginal revenue drops to the bottom line at near-pure margin until capacity ceiling.
- Every additional **$100k of revenue ≈ $60–70k of additional net.**
- Typical 1500–2000 sqft frame shop with 2 framers caps around **$1.2–1.5M revenue** before needing more space/equipment/labor.
- **Current headroom at this location: roughly $500–800k of additional revenue → $300–500k of additional net.**
- A shop running at $1.2M netting ~$850k is a much stronger base for either funding location #2 from cash flow or building a sellable multi-unit chain.

## Strategic Order of Operations

1. **Push existing shop to its capacity ceiling first** ($1.2–1.5M)
2. **Systemize operations + B2B sales motion** while doing so
3. **Then expand** — either greenfield location #2 or roll-up acquisition (see below)

Reason: capital efficiency. Lifting existing-location revenue is ~$0–10k capex with 30–90 day payback. A second location is $80–150k capex + 12–18 months to break even and stretches owner attention before the playbook is proven.

## Boston-Specific B2B Verticals — Underexploited

Already engaged: designers, police, hotels.

Likely highest-impact additions, ranked by Boston-specific fit:

1. **Sports memorabilia framing** — Sox / Pats / Celtics / Bruins fan economy is enormous. Jersey, ticket, photo framing is high-margin emotional purchase. Channels: dedicated SEO landing page + memorabilia auction houses + sports card shops + season-ticket holder communities. Realistic add: **$100k+/yr.**
2. **Diploma framing for Boston-area colleges** — 50+ colleges (Harvard, MIT, BU, BC, Northeastern, Tufts, Wellesley, Babson, etc.). Path: alumni-association preferred-vendor lists, school-specific mat colors / embossing. Recurring annual graduation cycle.
3. **Law firms** — hundreds of mid/large Boston firms. Diplomas + art on every partner office wall. Single firm relationship = multi-year reorders.
4. **Hospitals** — MGH, BWH, Children's, Beth Israel, BMC, Dana-Farber all run art programs and donor walls. Project sizes: 5–6 figures.
5. **Funeral homes + estate attorneys** — memorial shadow boxes are the highest-margin product in framing. Emotional, time-sensitive, low price-comparison.
6. **Real estate stagers + luxury home builders** — Newton / Brookline / Beacon Hill / Wellesley luxury market. Stagers reorder constantly.
7. **Veterans orgs / VFW posts / military bases** — shadow box volume.
8. **Wedding & portrait photographers** — referral partnerships; photographer becomes your sales force.

**Target: land 2–3 of these well to add $200–300k in revenue.**

## Where Owner's Dev Skills Compound

Since Matt is not in the shop, time is the lever. Software-built moats no other framer in New England can match:

- **B2B outreach automation** — scrape designers / law firms / staging companies into the existing CRM. Drip-email sequences via Postmark (already wired). AI-personalized outreach at scale.
- **Niche SEO landing pages** on the Next.js site — one per vertical (jersey framing, diploma framing, military shadow boxes, memorial shadow boxes, etc.). Capture long-tail Google traffic that competitors don't rank for.
- **Customer recall engine** — quarterly Postmark campaigns to past customers. Triggers: graduation season (May), wedding season (Jun–Sep), Father's Day sports memorabilia, holiday shadow boxes. Most framers never email past customers; this is near-free revenue.
- **B2B portal** — designers / hotels submit projects, view status, reorder. Sticky and a competitive moat.
- **Lead scoring** for inbound web inquiries — auto-prioritize high-value B2B leads vs. one-off retail.

## Two Paths to "Sell for Millions"

### Path A — Greenfield Regional Chain (4–6 locations, 5–7 years, $5–15M exit)
Open location #2 only after maxing #1. Fund #2 from cash flow. Prove unit economics, then #3–6 with light outside capital.

- **Pro:** clean ownership, full brand control.
- **Con:** skilled-framer scarcity is the real bottleneck — Greater Boston has maybe ~100 capable framers and they're aging out.

### Path B — Roll-Up Acquirer (3–5 years, $5–10M exit) — likely higher EV given Matt's profile
Most New England independent framers are 1-shop owner-operators in their 60s with no succession plan. They can't sell because nobody offers a multiple on $200–500k revenue mom-and-pops. **Matt can.**

- Buy 3–4 of them at 1.5–2x SDE (~$300–800k each)
- Retain their staff → solves the labor problem
- Put them on the existing POS + brand + B2B engine
- Combined $2–4M revenue, $1–1.5M EBITDA
- Exit at 5–7x EBITDA → **$5–10M in 3–5 years**

This is the same playbook PE is running on HVAC, plumbing, dental, vet clinics. Works because (a) elderly owners want exits, (b) consolidation creates real ops leverage, (c) Matt brings a software + B2B advantage individual shops can't build.

**For Matt's skill profile this is probably the highest-EV path.** Worth pressure-testing before committing.

## Concrete Next 30 Days

1. **Data audit** — pull last 12 months of jobs from the Postgres DB. Categorize by job type + customer type. Identify which categories are under-indexed vs. potential. *(Matt asked Claude to start this analysis next session.)*
2. **Pick 2 B2B verticals** to attack first. Working recommendation: **sports memorabilia (consumer demand)** + **law firms (B2B)** — they don't compete for the same labor hours, so the shop can run them in parallel.
3. **Build the B2B outreach engine** — list of 500 targets, CRM tied to existing stack, AI-drafted personalized first emails.
4. **Stand up 4 niche SEO landing pages** on the existing Next.js site — ~1 day each.

## Open Questions / TBD

- [ ] What does the historical job data actually show? (Need to query Postgres.)
- [ ] What is the realistic capacity ceiling at the current location given current staff?
- [ ] Hire a 3rd framer to extend ceiling, or stay lean and route overflow to longer turnaround?
- [ ] Which 2 verticals to attack first (sports + law firms is the working recommendation but worth revisiting)
- [ ] Roll-up vs. greenfield — when to commit to one path?
- [ ] What's the minimum cash buffer Matt wants before starting either expansion path?

## Picking This Up Next Session

Start with the data audit — analyze the westroxburyframing repo's order data to give a numerical baseline of:
- Revenue by job category (custom frame, shadow box, restoration, etc.)
- Revenue by customer type (walk-in retail, B2B, repeat customer)
- Revenue by ticket size distribution
- Seasonality patterns
- Top 20 customers by lifetime value

That tells us where the actual headroom lives before deciding which lever to pull first.

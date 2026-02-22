# West Roxbury Framing — FrameReady-Parity Blueprint

> **Goal:** Build an all-in-one custom framing POS + workflow system that matches
> FrameReady's feature set (Standard edition), adapted for a modern web stack.
>
> **Source of truth:** https://frameready.com/compare (scraped Feb 2026)

---

## 1. Current System Inventory

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Payments:** Square APIs (sandbox tested)
- **Email:** Postmark (stub in `lib/email.ts`)
- **Marketing:** Mailchimp sync skeleton (`lib/mailchimp.ts`)
- **Hosting:** Vercel

### What Already Exists

| Area | Built | Files |
|------|-------|-------|
| **Staff auth** | Login/logout, cookie-based, admin/staff roles | `lib/auth.ts`, `staff/api/auth/*` |
| **Orders CRUD** | Create, list, detail, edit, duplicate | `staff/api/orders/*`, `staff/orders/*` |
| **Order status flow** | 8 statuses (new_design → completed/cancelled) | `lib/orderStatus.ts`, `staff/api/orders/[id]/status` |
| **Order specs** | Single spec set per order (frame, mats, glass, mount, backing) | `OrderSpecs` model |
| **Order photos** | Upload/list photos on order | `staff/api/orders/[id]/photos` |
| **Order activity** | Timeline entries (status changes, notes) | `OrderActivity` + `ActivityLog` models |
| **Customers** | CRUD, search, detail with order history | `staff/api/customers/*`, `staff/customers/*` |
| **Square invoices** | Send invoice, sync status, mark unpaid, duplicate | `staff/api/orders/[id]/invoice/*`, `lib/square/*` |
| **Square payments** | Create payment, refund | `staff/api/orders/[id]/payments/create`, `refund` |
| **Square webhook** | Receive `invoice.payment_made` → update order | `api/webhooks/square` |
| **Appointments** | Calendly webhook + embed | `api/webhooks/calendly`, `CalendlyButton` |
| **Public site** | Home, services, custom-framing, framed-art, restoration, about, contact, testimonials, book | `(public)/*` |
| **Contact form** | Submit → email staff | `api/contact` |
| **Web lead intake** | Public order form → creates order + customer | `api/public/orders` |
| **Dashboard** | Staff dashboard with stats | `staff/dashboard` |
| **User management** | List/create staff users (admin only) | `staff/api/users/*`, `staff/users` |
| **Kanban board** | Visual order board | `KanbanBoard.tsx` |

---

## 2. FrameReady Feature Comparison (Full → Gap Analysis)

### 2A. Work Orders

| FrameReady Feature | Description | Our Status | Gap |
|--------------------|-------------|------------|-----|
| **Frame Price Calculation** | Instant pricing based on size + materials + pricing schedules. Multiple mouldings (up to 5 stacked), mats (up to 7), fillets, fabric, mounting, mat designs, glazing, extras, hardware, fitting. | ❌ Missing | Need pricing engine with PriceCode system, material catalogs, formula-based calculation |
| **Create & Print Work Orders** | Printed work order = blueprint for construction. 3 print formats (vertical lines, no lines, 2-per-page). | ⚠️ Partial | Have order detail page; need print-optimized layouts (CSS `@media print` or PDF generation) |
| **Edit Work Orders** | Editable anytime; updates propagate to posted invoices. | ✅ Have edit | Need: edits auto-update linked invoices |
| **On-Screen Discounts** | Job-level discount ($ or %) + component-level discounts on detail screens. | ❌ Missing | Need discount fields on Order + per-line-item discounts |
| **Print & Save Estimates** | Convert order ↔ estimate. Estimates excluded from active order list. "Blind" estimate hides item numbers/descriptions. | ⚠️ Partial | Have `cancelled` status but no `estimate` concept. Need: estimate status, blind print mode |
| **Track Order Status** | Estimate, Incomplete, Hold, Completed, Picked Up. Customizable location list. | ✅ Have | Already have 8 statuses + transitions. Could add `on_hold` and `estimate`. |
| **Barcoding** | Barcode scan for moulding/matboard entry on work orders + order search. | ❌ Missing | Phase 3+ feature |
| **Incomplete Work Order List** | Daily to-do list of incomplete orders. Check off finished jobs. Email pickup reminders directly from list. | ⚠️ Partial | Have order list filtered by status. Need: bulk "mark complete" + one-click pickup email from list |
| **Scenarios** | Store up to 5 design options per work order. Side-by-side comparison of components + price. Select winner → becomes active design. | ❌ Missing | Need `OrderScenario` model + UI |

### 2B. Customers and Other Contacts

| FrameReady Feature | Description | Our Status | Gap |
|--------------------|-------------|------------|-----|
| **Customer Database** | Contacts for customers, artists, vendors, service providers. Tabs for marketing campaigns, email lists, advertising returns, referrals. | ⚠️ Partial | Have Customer model. Need: contact types (customer/vendor/artist), marketing tags, referral tracking |
| **Customer Work Order History** | All orders archived in contact record. Estimates color-coded. Total value shown. | ✅ Have | Customer detail shows orders. Could add: total lifetime value, color-code estimates |
| **Customer Keywords** | Searchable keywords for segmentation + mailing lists. Temporary custom lists for marketing/export. | ❌ Missing | Need: tags/keywords on Customer, list builder UI |
| **Mailing Labels** | Print Avery labels or Dymo labels from contacts. | ❌ Missing | Phase 3+ (low priority for web-first shop) |
| **Correspondence** | Generate letters, form letter templates, print envelopes. | ❌ Missing | Replace with email templates (modern equivalent) |
| **SMS Text Messages** | BulkSMS or ClickSend integration. | ❌ Missing | Plan: Twilio integration (Phase F) |
| **Customer Email** | Email blasts to lists. Email artwork images. Pickup reminder emails from incomplete list. | ⚠️ Partial | Have email stubs. Need: template system, blast capability, pickup reminder flow |
| **Google Map Interface** | Pin customer address, directions for delivery. | ❌ Missing | Low priority; can add Google Maps link on customer detail |
| **PDF Reports** | Email invoices, proposals, quotes, reports as PDF. | ❌ Missing | Need PDF generation (e.g., `@react-pdf/renderer` or Puppeteer) |
| **Gift Certificates/Cards** | Issue, track redemption, print with logo. 3 styles. | ❌ Missing | Phase 3+ |
| **Spanish/French Documents** | i18n for customer-facing documents. | ❌ Missing | Not needed for West Roxbury |

### 2C. Frame Pricing

| FrameReady Feature | Description | Our Status | Gap |
|--------------------|-------------|------------|-----|
| **Vendor Pricing Updates** | Auto-update manufacturer prices, import new stock, alert discontinued items. | ❌ Missing | Need: Vendor + VendorCatalogItem models, import/update flow |
| **3D Pricing** | Price plexi-glass boxes. | ❌ Missing | Phase 3+ niche feature |
| **Quick Price Check** | Instant lookup of retail price/ft for any moulding. | ❌ Missing | Need: price lookup UI on dashboard or quick-action |

### 2D. Integrations

| FrameReady Feature | Description | Our Status | Gap |
|--------------------|-------------|------------|-----|
| **Square** | Credit card transactions, refunds, voids via Square Terminal. | ✅ Have | Square invoice + payment + refund flows built |
| **QuickBooks Online** | Push invoice data to QBO. | ❌ Missing | Phase 3+ |
| **Shopify** | Import orders, products, customers. | ❌ Missing | Phase 3+ |
| **Mailchimp** | Import audiences, subscribe/unsubscribe contacts. | ⚠️ Partial | Have sync skeleton. Need: full audience management UI |
| **Constant Contact** | Alternative to Mailchimp. | ❌ N/A | Using Mailchimp instead |
| **SMS (ClickSend/BulkSMS)** | Text notifications to customers. | ❌ Missing | Plan: Twilio (Phase F) |
| **Excel Export** | Export data as spreadsheet. | ❌ Missing | Need: CSV/XLSX export for orders, customers, reports |
| **iPad** | FileMaker Server on iPad. | ❌ N/A | Our web app is already mobile-responsive |
| **Mat Cutter Integration** | Wizard MatDesigner, Integrated Framer, FrameShop, Gunnar CMC, Valiani CMC. | ❌ N/A | Hardware-specific; not applicable to web app |

### 2E. Inventory and Stock Management

| FrameReady Feature | Description | Our Status | Gap |
|--------------------|-------------|------------|-----|
| **Auto Inventory** | Calculate footage used per work order, deduct from stock, identify supplier, add to PO. | ❌ Missing | Need: InventoryItem model, auto-deduction on order creation |
| **Moulding Usage Reports** | Totals by group (wood, metal), quantity of specific items, time period filtering. | ❌ Missing | Need: reporting engine |
| **Moulding/Matboard Ordering** | Compile materials needed for incomplete orders. Print or email to supplier. | ❌ Missing | Need: materials requirements view + PO generation |
| **Purchase Orders** | View/edit vendor shopping list. Display qty on hand + qty required. Receive into inventory from PO screen. Preset suppliers per material. | ❌ Missing | Need: PurchaseOrder + PurchaseOrderLine + Receiving models |
| **Central Inventory** | Multi-location real-time inventory. | ❌ Missing | Phase 3+ (single location first) |

### 2F. Invoices and Accounting

| FrameReady Feature | Description | Our Status | Gap |
|--------------------|-------------|------------|-----|
| **Customer Purchase History** | All purchases archived. Balance owed. Frequency tracking. | ⚠️ Partial | Have order history. Need: A/R balance tracking, purchase frequency stats |
| **Create Invoices** | Invoices separate from work orders. Post multiple work orders to one invoice. | ⚠️ Partial | Currently invoice = 1:1 with order via Square. Need: Invoice model that can hold multiple orders |
| **Accept Payments** | Multiple payments per invoice. | ⚠️ Partial | Have Payment model. Need: partial payment tracking, deposit/balance flow |
| **Allocate Payments to Orders** | Payment allocation across orders on an invoice. | ❌ Missing | Need: payment allocation logic |

### 2G. Art and Retail Products

| FrameReady Feature | Description | Our Status | Gap |
|--------------------|-------------|------------|-----|
| **Products Inventory** | Readymade frames, giftware, art supplies. Stock numbers for invoice lookup. Sell matboard sheets / moulding lengths on invoice. | ❌ Missing | Phase 3+ |
| **Consignment Art** | Track consigned artwork, reports, returns to inventory. | ❌ Missing | Phase 3+ |
| **Artist CV** | Printed artist documents with photo. | ❌ Missing | Phase 3+ |
| **Art Directory Catalogue** | Inventory directory for gallery openings, registries, auctions. | ❌ Missing | Phase 3+ |
| **Product Label Printing** | Labels/price tags with barcodes. | ❌ Missing | Phase 3+ |
| **Retail Product File** | Full retail product management. | ❌ Missing | Phase 3+ |
| **Art Resource Catalogue** | Searchable database of art/artists with images. | ❌ Missing | Phase 3+ |

### 2H. Special Items

| FrameReady Feature | Description | Our Status | Gap |
|--------------------|-------------|------------|-----|
| **Find Feature** | Multi-field search across all files. | ⚠️ Partial | Have customer + order search. Need: global search across all entities |
| **Digital Photos** | Store photos of unframed work, completed work, products, moulding samples. | ✅ Have | OrderPhoto model exists |
| **Networking** | Multiple concurrent users with access levels. | ✅ Have | Staff auth with admin/staff roles |
| **In-house Messaging** | Internal message center for staff. | ❌ Missing | Phase 3+ |
| **Employee Time Card** | Payroll hours tracking. | ❌ Missing | Phase 3+ (use external tool) |

### 2I. Multi Site

| FrameReady Feature | Description | Our Status | Gap |
|--------------------|-------------|------------|-----|
| **Multi-site everything** | Shared pricing, site-specific orders, combined POs, site-specific inventory, shared contacts, per-site + combined reports. | ❌ Missing | Phase 3+ (single location first) |

---

## 3. Phased Implementation Plan

### Phase 1 — Core Ops (Current → Solid Daily Use)
> **Goal:** Rock-solid day-to-day operations. Staff can manage orders, customers, and basic invoicing reliably.

#### Step 1A: Harden Existing Order + Customer Workflow
- [ ] Verify order detail loads reliably with all relations (specs, photos, activity, payments)
- [ ] Ensure status transitions work end-to-end with activity logging
- [ ] Verify customer search (partial match on name/email/phone)
- [ ] Customer detail page: profile + order history + lifetime value
- [ ] Order edit: propagate changes to linked Square invoice if exists
- [ ] Contact form email delivery (verify Postmark integration)

**Test:** Create order → change status 3 times → add note → refresh → all history preserved. Customer search with partial name returns results. Contact form sends email.

#### Step 1B: Add Estimate / Hold Statuses
- [ ] Add `estimate` and `on_hold` to `OrderStatus` enum in Prisma schema
- [ ] Estimates excluded from main order list (separate tab/filter)
- [ ] "Activate" estimate → converts to `new_design` status
- [ ] Color-code estimates in customer order history (red per FrameReady)

**Schema change:**
```prisma
enum OrderStatus {
  estimate        // NEW
  new_design
  awaiting_materials
  in_production
  quality_check
  ready_for_pickup
  on_hold         // NEW
  picked_up
  completed
  cancelled
}
```

**Test:** Create estimate → verify it doesn't appear in active orders → activate → appears in active list.

#### Step 1C: Discounts
- [ ] Add `discountType` (none/percent/fixed) and `discountValue` fields to `Order`
- [ ] Recalculate subtotal/tax/total when discount applied
- [ ] Display discount on order detail + print view

**Schema change:**
```prisma
model Order {
  // ... existing fields ...
  discountType   String  @default("none") // "none" | "percent" | "fixed"
  discountValue  Decimal @default(0)
}
```

**Test:** Apply 10% discount → total recalculates. Apply $25 off → total recalculates. Remove discount → total restores.

#### Step 1D: Print Work Orders
- [ ] Create print-optimized CSS layout for order detail (`@media print`)
- [ ] Option for "blind estimate" print (hide item codes/vendor info)
- [ ] Print button on order detail page

**Test:** Print preview shows clean work order. Blind estimate hides codes.

#### Step 1E: Incomplete Order List + Pickup Reminders
- [ ] Dedicated "Incomplete Orders" view (all orders not completed/cancelled/picked_up)
- [ ] Bulk "mark complete" checkbox action
- [ ] One-click "Send pickup reminder" email per order from this list
- [ ] Email template for pickup reminder

**Test:** Filter incomplete orders → select 3 → mark complete → statuses update. Send pickup email → customer receives.

---

### Phase 2 — Money (Invoicing + Pricing Engine)
> **Goal:** Proper invoicing with deposits/balance, and automated frame job pricing.

#### Step 2A: Invoice Model (Separate from Orders)
- [ ] Create `Invoice` model that can hold multiple orders
- [ ] Support deposit (e.g., 50%) + balance due
- [ ] Track multiple payments per invoice
- [ ] A/R: show outstanding balance per customer
- [ ] Invoice status panel on order detail
- [ ] Payment timeline on invoice detail

**Schema change:**
```prisma
model Invoice {
  id                  String   @id @default(uuid())
  invoiceNumber       String   @unique
  customerId          String
  customer            Customer @relation(fields: [customerId], references: [id])

  subtotalAmount      Int
  discountAmount      Int      @default(0)
  taxAmount           Int
  totalAmount         Int
  depositAmount       Int      @default(0)
  balanceDue          Int
  currency            String   @default("USD")

  status              String   @default("draft") // draft, sent, partial, paid, void
  squareInvoiceId     String?
  squareInvoiceUrl    String?

  notes               String?
  createdByUserId     String
  createdBy           User     @relation(fields: [createdByUserId], references: [id])
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  orders              Order[]  @relation("InvoiceOrders")
  payments            InvoicePayment[]
}

model InvoicePayment {
  id                String        @id @default(uuid())
  invoiceId         String
  invoice           Invoice       @relation(fields: [invoiceId], references: [id])
  amount            Int
  method            String        @default("square") // square, cash, check, other
  squarePaymentId   String?       @unique
  squareReceiptUrl  String?
  status            PaymentStatus @default(paid)
  paidAt            DateTime
  note              String?
  createdAt         DateTime      @default(now())
}
```

**Test:** Create invoice with 2 orders → send deposit → pay deposit → balance updates → send balance → pay → invoice marked paid.

#### Step 2B: Pricing Engine (PriceCode System)
- [ ] Create `PriceCode` model for pricing schedules
- [ ] Create `Vendor` + `VendorCatalogItem` models
- [ ] Pricing formulas: moulding ($/ft + min + waste%), mat ($/sqft or $/sheet), glass ($/sqft by type), mounting (per sqft + fixed), labor (base + complexity), extras/hardware (fixed adders)
- [ ] Calculation API endpoint: input (width, height, components) → output (line items + totals)
- [ ] "Recalculate" button on order edit
- [ ] Clean breakdown display (materials vs labor)
- [ ] Quick Price Check on dashboard

**Schema change:**
```prisma
model Vendor {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  phone     String?
  email     String?
  website   String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  catalogItems VendorCatalogItem[]
}

model VendorCatalogItem {
  id            String   @id @default(uuid())
  vendorId      String
  vendor        Vendor   @relation(fields: [vendorId], references: [id])
  itemNumber    String
  description   String?
  category      String   // moulding, matboard, glass, mounting, hardware, etc.
  unitType      String   // foot, sheet, sqft, each
  costPerUnit   Decimal
  retailPerUnit Decimal?
  discontinued  Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([vendorId, itemNumber])
}

model PriceCode {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  category    String   // moulding, mat, glass, mounting, labor, extra, hardware, fitting
  formula     String   // "per_foot", "per_sqft", "per_sheet", "fixed", "per_inch"
  baseRate    Decimal
  minCharge   Decimal  @default(0)
  wastePercent Decimal @default(0)
  multiplier  Decimal  @default(1)
  notes       String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Test:** Enter 8×10 order → price calculates. Enter 24×36 → price scales correctly. Swap glass type → price changes. Add second mat → price changes. Apply discount → total adjusts.

#### Step 2C: Enhanced OrderSpecs (Multi-Component)
- [ ] Expand `OrderSpecs` to support up to 5 stacked frames, 7 mats, fillets, fabric
- [ ] Per-component pricing (linked to PriceCode)
- [ ] Per-component discount capability

**Schema change:**
```prisma
model OrderComponent {
  id          String   @id @default(uuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  scenarioId  String?  // null = active design, or linked to a scenario

  category    String   // frame, mat, fillet, glass, mounting, fabric, extra, hardware, fitting
  position    Int      @default(0) // for ordering (frame 1, frame 2, mat 1, mat 2, etc.)
  priceCodeId String?
  vendorItemId String?
  description String?
  quantity    Decimal  @default(1)
  unitPrice   Int      @default(0) // cents
  discount    Int      @default(0) // cents
  lineTotal   Int      @default(0) // cents
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Test:** Add 2 frames + 3 mats + glass + mounting → all line items price correctly. Remove a mat → total recalculates.

---

### Phase 3 — Design Options (Scenarios)
> **Goal:** Let staff create up to 5 design options per order, compare side-by-side, and select a winner.

#### Step 3A: OrderScenario Model + UI
- [ ] Create `OrderScenario` model (up to 5 per order)
- [ ] Each scenario has its own set of `OrderComponent` entries
- [ ] UI: "Add Scenario", "Compare Scenarios" side-by-side view
- [ ] "Set as Active" → copies scenario components to active design
- [ ] Pricing recalculates per scenario independently

**Schema change:**
```prisma
model OrderScenario {
  id          String   @id @default(uuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  label       String   // "Option A", "Option B", etc.
  isActive    Boolean  @default(false)
  subtotal    Int      @default(0)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  components  OrderComponent[]
}
```

**Test:** Create 3 scenarios on one order → compare prices → select Option B → becomes active design → order total updates.

---

### Phase 4 — Purchasing + Inventory
> **Goal:** Track materials, generate purchase orders, receive stock.

#### Step 4A: Inventory Tracking
- [ ] `InventoryItem` model (moulding lengths, mat sheets, glass sheets, hardware)
- [ ] Auto-deduct materials when order moves to `in_production`
- [ ] Manual inventory adjustments (waste, damage, recount)
- [ ] Low-stock alerts on dashboard

**Schema change:**
```prisma
model InventoryItem {
  id              String   @id @default(uuid())
  vendorItemId    String?
  vendorItem      VendorCatalogItem? @relation(fields: [vendorItemId], references: [id])
  sku             String   @unique
  name            String
  category        String
  unitType        String   // foot, sheet, each
  quantityOnHand  Decimal  @default(0)
  reorderPoint    Decimal  @default(0)
  reorderQty      Decimal  @default(0)
  preferredVendorId String?
  locationNote    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  lots            InventoryLot[]
}

model InventoryLot {
  id              String   @id @default(uuid())
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  quantity        Decimal
  costPerUnit     Decimal?
  receivedAt      DateTime @default(now())
  purchaseOrderId String?
  notes           String?
}
```

#### Step 4B: Purchase Orders
- [ ] `PurchaseOrder` + `PurchaseOrderLine` models
- [ ] Auto-generate PO from materials needed for incomplete orders
- [ ] Edit PO before sending (add/remove/modify lines)
- [ ] Print/email PO to vendor
- [ ] Receive items → update inventory
- [ ] PO status tracking (draft, sent, partial, received, cancelled)

**Schema change:**
```prisma
model PurchaseOrder {
  id          String   @id @default(uuid())
  poNumber    String   @unique
  vendorId    String
  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  status      String   @default("draft") // draft, sent, partial, received, cancelled
  totalAmount Int      @default(0)
  notes       String?
  orderedAt   DateTime?
  receivedAt  DateTime?
  createdByUserId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lines       PurchaseOrderLine[]
}

model PurchaseOrderLine {
  id              String   @id @default(uuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  inventoryItemId String?
  vendorItemNumber String
  description     String?
  quantityOrdered Decimal
  quantityReceived Decimal @default(0)
  unitCost        Decimal
  lineTotal       Int     @default(0)
  notes           String?
}
```

#### Step 4C: Materials Requirements View
- [ ] "Materials Needed" report: compile all materials for incomplete orders
- [ ] Group by vendor
- [ ] Show qty on hand vs qty required
- [ ] One-click "Generate PO" per vendor

**Test:** Create 10 orders with materials → view materials needed → generate PO → receive → inventory updates.

#### Step 4D: Moulding Usage Reports
- [ ] Usage by group (wood, metal, etc.) for any time period
- [ ] Moulding rounded to nearest half foot
- [ ] Export to CSV

---

### Phase 5 — Customer Marketing + Communications
> **Goal:** Email templates, pickup reminders, marketing segmentation, SMS.

#### Step 5A: Customer Tags / Keywords
- [ ] Add `CustomerTag` model for segmentation
- [ ] Tag management UI in settings
- [ ] Assign tags on customer detail
- [ ] Filter customer list by tags
- [ ] Build temporary marketing lists from tag combinations

**Schema change:**
```prisma
model CustomerTag {
  id         String   @id @default(uuid())
  name       String   @unique
  color      String?
  createdAt  DateTime @default(now())
}

model CustomerTagAssignment {
  id          String   @id @default(uuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  tagId       String
  tag         CustomerTag @relation(fields: [tagId], references: [id], onDelete: Cascade)
  assignedAt  DateTime @default(now())

  @@unique([customerId, tagId])
}
```

#### Step 5B: Email Templates + Automation
- [ ] Template system: order received, invoice sent, ready for pickup, estimate follow-up
- [ ] Postmark integration for transactional emails
- [ ] Pickup reminder: one-click from incomplete order list
- [ ] Email blast to customer list/tag group

#### Step 5C: SMS (Twilio)
- [ ] Twilio integration for SMS notifications
- [ ] SMS templates: pickup ready, appointment reminder
- [ ] SMS queue with delivery status tracking
- [ ] Customer opt-in/opt-out for SMS

#### Step 5D: Mailchimp Full Integration
- [ ] Sync customer tags → Mailchimp segments
- [ ] Subscribe/unsubscribe from staff UI
- [ ] Import Mailchimp audiences

---

### Phase 6 — Reporting + Export
> **Goal:** Business intelligence matching FrameReady's reporting capabilities.

#### Step 6A: Core Reports
- [ ] **Sales report:** daily/weekly/monthly revenue, order count, avg order value
- [ ] **Open orders report:** aging, by status, by staff member
- [ ] **Customer report:** new vs returning, lifetime value, purchase frequency
- [ ] **A/R aging report:** outstanding invoices by age bucket

#### Step 6B: Export
- [ ] CSV export for all report types
- [ ] PDF generation for invoices, estimates, reports
- [ ] Email reports to staff/accountant

#### Step 6C: Dashboard Enhancements
- [ ] KPI cards: today's revenue, open orders, overdue orders, items ready for pickup
- [ ] Charts: revenue trend, orders by status, top customers

---

### Phase 7 — Advanced Features (FrameReady "Full" Parity)
> **Goal:** Complete feature parity for shops that need everything.

- [ ] **Art/Retail Products:** Product inventory, consignment tracking, artist CVs
- [ ] **Gift Certificates:** Issue, track, redeem
- [ ] **Global Search:** Search across all entities (orders, customers, invoices, products)
- [ ] **In-house Messaging:** Staff message center
- [ ] **QuickBooks Online:** Push invoice data
- [ ] **Shopify:** Import orders/products/customers
- [ ] **Multi-site:** Location-specific orders, combined POs, per-site reporting
- [ ] **Barcode Support:** Scan moulding/matboard, print product labels

---

## 4. Recommended Implementation Order (A → B → C)

```
Phase 1A: Harden existing workflow          ← START HERE (1-2 days)
Phase 1B: Estimate + Hold statuses          ← (0.5 day)
Phase 1C: Discounts                         ← (0.5 day)
Phase 1D: Print work orders                 ← (1 day)
Phase 1E: Incomplete list + pickup emails   ← (1 day)
  ─── Milestone: Daily ops are solid ───
Phase 2A: Invoice model                     ← (2-3 days)
Phase 2B: Pricing engine                    ← (3-5 days)
Phase 2C: Enhanced OrderSpecs               ← (1-2 days)
  ─── Milestone: Pricing + invoicing work ───
Phase 3A: Scenarios                         ← (2-3 days)
  ─── Milestone: FrameReady "Lite" parity ───
Phase 4A: Inventory tracking                ← (2-3 days)
Phase 4B: Purchase orders                   ← (2-3 days)
Phase 4C: Materials requirements            ← (1-2 days)
Phase 4D: Usage reports                     ← (1 day)
  ─── Milestone: Full inventory management ───
Phase 5A: Customer tags                     ← (1 day)
Phase 5B: Email templates                   ← (2-3 days)
Phase 5C: SMS (Twilio)                      ← (1-2 days)
Phase 5D: Mailchimp full                    ← (1 day)
  ─── Milestone: Marketing + comms ───
Phase 6A: Reports                           ← (2-3 days)
Phase 6B: Export                            ← (1-2 days)
Phase 6C: Dashboard                         ← (1-2 days)
  ─── Milestone: FrameReady "Standard" parity ───
Phase 7: Advanced (as needed)               ← ongoing
```

**Total estimated effort to FrameReady Standard parity: ~30-40 dev days**

---

## 5. Third-Party Accounts Required

### Required Now
| Service | Purpose | Status |
|---------|---------|--------|
| **Square** | Payments, invoices, refunds | ✅ Configured (sandbox + production) |
| **Postmark** | Transactional email (contact form, notifications, pickup reminders) | ⚠️ Stub exists, needs verification |
| **Vercel** | Hosting | ✅ Configured |
| **PostgreSQL** | Database (Vercel Postgres / Neon / Supabase) | ✅ Configured |

### Required for Phase 5+
| Service | Purpose | Status |
|---------|---------|--------|
| **Twilio** | SMS notifications | ❌ Not yet |
| **Mailchimp** | Marketing email lists | ⚠️ Skeleton exists |

### Optional / Phase 7
| Service | Purpose |
|---------|---------|
| **QuickBooks Online** | Accounting sync |
| **Shopify** | E-commerce sync |
| **Google Places API** | Reviews + address autocomplete |
| **Plausible / GA4** | Analytics |

---

## 6. Immediate Next Steps (This Week)

1. **Verify current workflow end-to-end** (Phase 1A)
   - Create order → status changes → notes → customer search → customer detail
2. **Add `estimate` + `on_hold` statuses** (Phase 1B)
3. **Add discount fields** (Phase 1C)
4. **Print layout for work orders** (Phase 1D)
5. **Verify contact form email delivery** (Postmark)

---

## 7. Key Architecture Decisions

- **Invoice ≠ Order:** An invoice can contain multiple orders (FrameReady model). We'll add a proper `Invoice` table rather than storing invoice data directly on `Order`.
- **OrderComponent replaces OrderSpecs:** The current single-row `OrderSpecs` model will be replaced by a multi-row `OrderComponent` model that supports unlimited components with individual pricing.
- **Scenarios use OrderComponent:** Each scenario is a set of `OrderComponent` rows linked to an `OrderScenario`. The "active" scenario's components are the ones used for the order total.
- **PriceCode = your pricing rules:** These are YOUR markup formulas, not vendor prices. Vendor prices live in `VendorCatalogItem`. Your retail price = vendor cost × PriceCode formula.
- **Amounts in cents:** All monetary amounts stored as integers (cents) to avoid floating-point issues. Display as dollars in UI.

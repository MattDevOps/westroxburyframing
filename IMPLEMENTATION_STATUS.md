# Implementation Status — West Roxbury Framing

> Generated from review of `BLUEPRINT.md` vs current codebase

## ✅ Phase 1 — Core Ops (COMPLETE)

### Step 1A: Harden Existing Order + Customer Workflow
- ✅ Order detail loads with all relations (specs, photos, activity, payments)
- ✅ Status transitions work with activity logging
- ✅ Customer search (partial match on name/email/phone)
- ✅ Customer detail page: profile + order history + **lifetime value**
- ✅ Order edit: propagate changes to linked Square invoice
- ✅ Contact form email delivery (Postmark)

**Status:** ✅ **COMPLETE**

### Step 1B: Add Estimate / Hold Statuses
- ✅ `estimate` and `on_hold` added to `OrderStatus` enum
- ✅ Estimates excluded from main order list (separate "Estimates" tab)
- ✅ "Activate" estimate → converts to `new_design` status
- ✅ Color-code estimates in customer order history

**Status:** ✅ **COMPLETE**

### Step 1C: Discounts
- ✅ `discountType` and `discountValue` fields on `Order` model
- ✅ Recalculate subtotal/tax/total when discount applied
- ✅ Display discount on order detail + print view

**Status:** ✅ **COMPLETE**

### Step 1D: Print Work Orders
- ✅ Print-optimized CSS layout (`@media print` in `globals.css`)
- ✅ "Blind estimate" print option (hide item codes/vendor info)
- ✅ Print button on order detail page

**Status:** ✅ **COMPLETE**

### Step 1E: Incomplete Order List + Pickup Reminders
- ✅ Dedicated "Incomplete Orders" view (`/staff/orders/incomplete`)
- ✅ Bulk "mark complete" checkbox action
- ✅ One-click "Send pickup reminder" email per order
- ✅ Email template for pickup reminder

**Status:** ✅ **COMPLETE**

---

## ✅ Phase 2 — Money (COMPLETE)

### Step 2A: Invoice Model (Separate from Orders)
- ✅ `Invoice` model created (can hold multiple orders)
- ✅ Support deposit (e.g., 50%) + balance due
- ✅ Track multiple payments per invoice (`InvoicePayment` model)
- ✅ A/R: show outstanding balance per customer
- ✅ Invoice status panel on order detail
- ✅ Payment timeline on invoice detail

**Status:** ✅ **COMPLETE**

### Step 2B: Pricing Engine (PriceCode System)
- ✅ `PriceCode` model — **IMPLEMENTED**
- ✅ `Vendor` + `VendorCatalogItem` models — **IMPLEMENTED**
- ✅ Pricing formulas (moulding $/ft, mat $/sqft, glass, mounting, labor, etc.) — **IMPLEMENTED**
- ✅ Calculation API endpoint — **IMPLEMENTED**
- ✅ UI pages for managing vendors, catalog items, and price codes — **IMPLEMENTED**
- ✅ Clean breakdown display (materials vs labor) — **IMPLEMENTED**
- ✅ Comprehensive test suite — **16/16 tests passing**

**Status:** ✅ **COMPLETE**

### Step 2C: Enhanced OrderSpecs (Multi-Component)
- ✅ `OrderComponent` model — **IMPLEMENTED**
- ✅ Support for multiple components (frames, mats, glass, etc.) — **IMPLEMENTED**
- ✅ Per-component pricing (linked to PriceCode) — **IMPLEMENTED**
- ✅ Per-component discount capability — **IMPLEMENTED**
- ✅ OrderForm UI updated with component support — **IMPLEMENTED**
- ✅ Backward compatible with legacy `OrderSpecs`

**Status:** ✅ **COMPLETE**

---

## ✅ Phase 3 — Design Options (Scenarios) (COMPLETE)

### Step 3A: OrderScenario Model + UI
- ✅ `OrderScenario` model — **IMPLEMENTED** (up to 5 per order)
- ✅ Each scenario has its own set of `OrderComponent` entries — **IMPLEMENTED**
- ✅ UI: "Add Scenario", scenario cards view — **IMPLEMENTED**
- ✅ "Set as Active" → copies scenario components to active design — **IMPLEMENTED**
- ✅ Pricing recalculates per scenario independently — **IMPLEMENTED**

**Status:** ✅ **COMPLETE**

---

## ✅ Phase 4 — Purchasing + Inventory (COMPLETE)

### Step 4A: Inventory Tracking
- ✅ `InventoryItem` model — **IMPLEMENTED**
- ✅ Auto-deduct materials when order moves to `in_production` — **IMPLEMENTED**
- ✅ Manual inventory adjustments (waste, damage, recount) — **IMPLEMENTED** (via inventory edit UI)
- ✅ Low-stock alerts on dashboard — **IMPLEMENTED**
- ✅ Inventory lots tracking — **IMPLEMENTED**
- ✅ Location-based inventory — **IMPLEMENTED** (multi-site support)

**Status:** ✅ **COMPLETE**

### Step 4B: Purchase Orders
- ✅ `PurchaseOrder` + `PurchaseOrderLine` models — **IMPLEMENTED**
- ✅ Materials requirements view — **IMPLEMENTED** (`/staff/materials-needed`)
- ✅ Moulding usage reports — **IMPLEMENTED** (`/staff/reports/moulding-usage`)
- ✅ Cross-location purchase orders — **IMPLEMENTED** (admin can combine materials from multiple locations)

**Status:** ✅ **COMPLETE**

---

## ✅ Phase 5 — Customer Marketing + Communications (COMPLETE)
- ✅ `CustomerTag` model — **IMPLEMENTED**
- ✅ Tag management UI — **IMPLEMENTED**
- ✅ Email template system — **IMPLEMENTED** (holiday, Black Friday, custom templates)
- ✅ Email blast capability — **IMPLEMENTED** (using Postmark)
- ✅ SMS (Twilio) integration — **IMPLEMENTED**
- ✅ Postmark email integration — **IMPLEMENTED** (replaced Mailchimp)

**Status:** ✅ **COMPLETE**

---

## ✅ Phase 6 — Reporting + Export (COMPLETE)
- ✅ Sales report (daily/weekly/monthly) — **IMPLEMENTED** (`/staff/reports/sales`)
- ✅ Open orders report (aging, by status, by staff) — **IMPLEMENTED** (`/staff/reports/open-orders`)
- ✅ Customer report (new vs returning, lifetime value, frequency) — **IMPLEMENTED** (dashboard top customers, customer detail page)
- ✅ A/R aging report — **IMPLEMENTED** (`/staff/reports/ar-aging`)
- ✅ CSV export for reports — **IMPLEMENTED** (all reports have export endpoints)
- ✅ PDF generation for invoices/estimates — **IMPLEMENTED** (`/staff/api/orders/[id]/pdf`)
- ✅ Dashboard enhancements — **COMPLETE** (KPIs, charts, revenue by month, top customers, overdue orders)

**Status:** ✅ **COMPLETE**

---

## ✅ Phase 7 — Advanced Features (COMPLETE)
- ✅ Art/Retail Products — **IMPLEMENTED** (`/staff/products`, Product model with artist support)
- ✅ Gift Certificates — **IMPLEMENTED** (`/staff/gift-certificates`, issue, track, redeem)
- ✅ Global Search — **IMPLEMENTED** (`/staff/search`, unified search across orders, customers, invoices, products)
- ✅ In-house Messaging — **IMPLEMENTED** (`/staff/messages`, staff-to-staff messaging with unread counts)
- ✅ QuickBooks Online — **IMPLEMENTED** (OAuth integration, sync customers and invoices)
- ✅ Shopify — **IMPLEMENTED** (import orders, products, customers from Shopify)
- ✅ Multi-site — **IMPLEMENTED** (Location model, location-based filtering, admin location switcher)
- ✅ Barcode Support — **IMPLEMENTED** (barcode scanner component, lookup API for products/inventory/catalog)

**Status:** ✅ **COMPLETE**

---

## 📊 Summary

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1** (Core Ops) | ✅ Complete | 100% |
| **Phase 2A** (Invoice Model) | ✅ Complete | 100% |
| **Phase 2B** (Pricing Engine) | ✅ Complete | 100% |
| **Phase 2C** (OrderComponent) | ✅ Complete | 100% |
| **Phase 3** (Scenarios) | ✅ Complete | 100% |
| **Phase 4** (Inventory) | ✅ Complete | 100% |
| **Phase 5** (Marketing) | ✅ Complete | 100% |
| **Phase 6** (Reporting) | ✅ Complete | 100% |
| **Phase 7** (Advanced) | ✅ Complete | 100% |

---

## 🎉 All Major Phases Complete!

All planned features from the blueprint have been implemented:
- ✅ Core operations and order management
- ✅ Pricing engine and multi-component orders
- ✅ Design scenarios
- ✅ Inventory tracking and purchase orders
- ✅ Customer marketing and communications
- ✅ Comprehensive reporting and exports
- ✅ Advanced features (gift certificates, search, messaging, integrations, multi-site, barcodes)

### Additional Features Implemented:
- ✅ Role-based permissions (admin vs staff)
- ✅ Quote request handler (web lead to estimate conversion)
- ✅ Location-based filtering and multi-site support
- ✅ Cross-location purchase orders

---

## 🚀 Phase 8 — Guided Order Wizard (Sales Rep Intake Flow) — NEXT PRIORITY

### Status: ❌ **NOT STARTED**

This is the next critical feature to transform the system from "database correct" to "retail-ready."

**Goal:** Create a foolproof, structured 5-step intake flow for **all sales reps at multiple locations** to walk customers through the order process. This will be the primary order intake method used at every location.

**Why This Is Critical:**
- **Primary order intake method** at all locations
- **Used by all sales reps** (new hires and experienced staff)
- **Customer-facing** — designed to be walked through with customers at the counter
- **Location-aware** — automatically uses the sales rep's assigned location
- Reduces training time from weeks → days
- Prevents mistakes through required field gates
- Applies pricing rules automatically (protects margins)
- Feels polished in front of customers
- Protects the business by enforcing margin guardrails

**Multi-Location Support:**
- Orders automatically assigned to sales rep's location (no manual selection)
- Staff users locked to their location; admins use selected location
- Same wizard interface at all locations, with location-scoped data

**Recommended Flow:**
1. **Customer + Artwork** — Search/create customer, enter artwork type and size
2. **Frame Selection** — Choose frame(s) with live pricing
3. **Mats + Glass** — Select mats, glass type, mounting, add-ons
4. **Preview + Scenarios** — Compare design options side-by-side
5. **Confirm + Deposit** — Final summary, deposit selection, submit order

**Route:** `/staff/orders/intake`

**UI Style:** Simple, text-based with clean modern design ("A with a hint of B")

**Estimated Effort:** 3-5 days

**Dependencies:**
- ✅ Order model (exists)
- ✅ OrderComponent model (exists)
- ✅ Pricing engine (exists)
- ✅ Invoice creation (exists)
- ✅ Square integration (exists)
- ✅ Multi-location support (exists - location automatically assigned via `getLocationFilter`)
- ✅ Staff user location assignment (exists - staff users have `locationId` field)

---

## 📋 Strategic Next Moves (Beyond Wizard)

### 1️⃣ Production Board Enhancements
**Status:** ⚠️ **PARTIAL** (Kanban board exists, needs drag-and-drop)

**Enhancements needed:**
- Drag and drop between stages
- Better filtering (by staff, location)
- Bulk status updates
- Visual indicators for overdue orders

**Estimated Effort:** 1-2 days

### 2️⃣ Purchase Order Automation
**Status:** ⚠️ **PARTIAL** (PO models exist, automation needed)

**Enhancements needed:**
- Auto-add materials to "Materials to Order" when order created
- One-click PO generation from materials needed
- Auto-update inventory when PO received
- PO status tracking improvements

**Estimated Effort:** 2-3 days

### 3️⃣ SMS Pickup Notifications
**Status:** ⚠️ **PARTIAL** (Twilio infrastructure exists, auto-notifications needed)

**Enhancements needed:**
- Auto-send SMS when order status → `ready_for_pickup`
- Template: "Hi [Name], your framing order #[OrderNumber] is ready for pickup at West Roxbury Framing. See you soon!"
- High ROI: increases pickup speed and customer satisfaction

**Estimated Effort:** 1 day

### 4️⃣ Reporting Dashboard Enhancements
**Status:** ✅ **COMPLETE** (dashboard exists with KPIs)

**Additional metrics to consider:**
- Revenue this week
- Avg ticket size
- Top frame styles
- Deposit % collected vs outstanding

**Estimated Effort:** 1-2 days

### 5️⃣ Webhook Payment Auto-Reconciliation
**Status:** ⚠️ **PARTIAL** (Square webhook exists, auto-advancement needed)

**Enhancements needed:**
- Auto-advance order status when payment received (optional setting)
- Auto-update invoice balance due
- Auto-send confirmation email when payment received

**Estimated Effort:** 1 day

---

*Last updated: After adding Phase 8 (Guided Order Wizard) and strategic next moves*

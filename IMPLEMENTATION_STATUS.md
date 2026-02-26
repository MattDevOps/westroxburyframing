# Implementation Status — West Roxbury Framing

> Generated from review of `BLUEPRINT.md` vs current codebase

## ✅ Phase 1 — Core Ops (MOSTLY COMPLETE)

### Step 1A: Harden Existing Order + Customer Workflow
- ✅ Order detail loads with all relations (specs, photos, activity, payments)
- ✅ Status transitions work with activity logging
- ✅ Customer search (partial match on name/email/phone)
- ✅ Customer detail page: profile + order history + **lifetime value** (implemented!)
- ✅ Order edit: propagate changes to linked Square invoice (implemented in `PATCH /staff/api/orders/[id]`)
- ⚠️ Contact form email delivery (Postmark stub exists, needs verification)

**Status:** ~95% complete

### Step 1B: Add Estimate / Hold Statuses
- ✅ `estimate` and `on_hold` added to `OrderStatus` enum
- ✅ Estimates excluded from main order list (separate "Estimates" tab)
- ✅ "Activate" estimate → converts to `new_design` status
- ⚠️ Color-code estimates in customer order history (not explicitly red, but styled)

**Status:** ✅ **COMPLETE**

### Step 1C: Discounts
- ✅ `discountType` and `discountValue` fields on `Order` model
- ✅ Recalculate subtotal/tax/total when discount applied (in order edit UI)
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
- ✅ Email template for pickup reminder (`sendReadyForPickupEmail`)

**Status:** ✅ **COMPLETE**

---

## ⚠️ Phase 2 — Money (PARTIALLY COMPLETE)

### Step 2A: Invoice Model (Separate from Orders)
- ✅ `Invoice` model created (can hold multiple orders)
- ✅ Support deposit (e.g., 50%) + balance due
- ✅ Track multiple payments per invoice (`InvoicePayment` model)
- ✅ A/R: show outstanding balance per customer (on customer detail page)
- ✅ Invoice status panel on order detail
- ✅ Payment timeline on invoice detail

**Status:** ✅ **COMPLETE**

### Step 2B: Pricing Engine (PriceCode System)
- ❌ `PriceCode` model — **NOT IMPLEMENTED**
- ❌ `Vendor` + `VendorCatalogItem` models — **NOT IMPLEMENTED**
- ❌ Pricing formulas (moulding $/ft, mat $/sqft, glass, mounting, labor, etc.) — **NOT IMPLEMENTED**
- ❌ Calculation API endpoint — **NOT IMPLEMENTED**
- ❌ "Recalculate" button on order edit — **NOT IMPLEMENTED**
- ❌ Clean breakdown display (materials vs labor) — **NOT IMPLEMENTED**
- ❌ Quick Price Check on dashboard — **NOT IMPLEMENTED**

**Status:** ❌ **NOT STARTED**

### Step 2C: Enhanced OrderSpecs (Multi-Component)
- ❌ `OrderComponent` model — **NOT IMPLEMENTED** (still using single-row `OrderSpecs`)
- ❌ Support for up to 5 stacked frames, 7 mats, fillets, fabric — **NOT IMPLEMENTED**
- ❌ Per-component pricing (linked to PriceCode) — **NOT IMPLEMENTED**
- ❌ Per-component discount capability — **NOT IMPLEMENTED**

**Status:** ❌ **NOT STARTED**

---

## ❌ Phase 3 — Design Options (Scenarios)
- ❌ `OrderScenario` model — **NOT IMPLEMENTED**
- ❌ UI: "Add Scenario", "Compare Scenarios" side-by-side view — **NOT IMPLEMENTED**
- ❌ "Set as Active" → copies scenario components to active design — **NOT IMPLEMENTED**
- ❌ Pricing recalculates per scenario independently — **NOT IMPLEMENTED**

**Status:** ❌ **NOT STARTED**

---

## ❌ Phase 4 — Purchasing + Inventory
- ❌ `InventoryItem` model — **NOT IMPLEMENTED**
- ❌ Auto-deduct materials when order moves to `in_production` — **NOT IMPLEMENTED**
- ❌ Manual inventory adjustments — **NOT IMPLEMENTED**
- ❌ Low-stock alerts on dashboard — **NOT IMPLEMENTED**
- ❌ `PurchaseOrder` + `PurchaseOrderLine` models — **NOT IMPLEMENTED**
- ❌ Materials requirements view — **NOT IMPLEMENTED**
- ❌ Moulding usage reports — **NOT IMPLEMENTED**

**Status:** ❌ **NOT STARTED**

---

## ❌ Phase 5 — Customer Marketing + Communications
- ❌ `CustomerTag` model — **NOT IMPLEMENTED**
- ❌ Tag management UI — **NOT IMPLEMENTED**
- ❌ Email template system — **NOT IMPLEMENTED** (only pickup reminder exists)
- ❌ Email blast capability — **NOT IMPLEMENTED**
- ❌ SMS (Twilio) integration — **NOT IMPLEMENTED**
- ❌ Mailchimp full integration — **NOT IMPLEMENTED** (skeleton exists)

**Status:** ❌ **NOT STARTED**

---

## ❌ Phase 6 — Reporting + Export
- ❌ Sales report (daily/weekly/monthly) — **NOT IMPLEMENTED**
- ❌ Open orders report (aging, by status, by staff) — **NOT IMPLEMENTED**
- ❌ Customer report (new vs returning, lifetime value, frequency) — **NOT IMPLEMENTED**
- ❌ A/R aging report — **NOT IMPLEMENTED**
- ❌ CSV export for reports — **NOT IMPLEMENTED** (only customer list PDF exists)
- ❌ PDF generation for invoices/estimates — **NOT IMPLEMENTED**
- ⚠️ Dashboard enhancements — **PARTIAL** (has KPI cards, missing charts)

**Status:** ❌ **NOT STARTED** (except basic dashboard)

---

## ❌ Phase 7 — Advanced Features
- ❌ Art/Retail Products — **NOT IMPLEMENTED**
- ❌ Gift Certificates — **NOT IMPLEMENTED**
- ❌ Global Search — **NOT IMPLEMENTED**
- ❌ In-house Messaging — **NOT IMPLEMENTED**
- ❌ QuickBooks Online — **NOT IMPLEMENTED**
- ❌ Shopify — **NOT IMPLEMENTED**
- ❌ Multi-site — **NOT IMPLEMENTED**
- ❌ Barcode Support — **NOT IMPLEMENTED**

**Status:** ❌ **NOT STARTED**

---

## 📊 Summary

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1** (Core Ops) | ✅ Mostly Complete | ~95% |
| **Phase 2A** (Invoice Model) | ✅ Complete | 100% |
| **Phase 2B** (Pricing Engine) | ❌ Not Started | 0% |
| **Phase 2C** (OrderComponent) | ❌ Not Started | 0% |
| **Phase 3** (Scenarios) | ❌ Not Started | 0% |
| **Phase 4** (Inventory) | ❌ Not Started | 0% |
| **Phase 5** (Marketing) | ❌ Not Started | 0% |
| **Phase 6** (Reporting) | ❌ Not Started | 0% |
| **Phase 7** (Advanced) | ❌ Not Started | 0% |

---

## 🎯 Next Steps (Recommended Priority)

Based on the blueprint's recommended order:

1. **Verify Phase 1A** — Test contact form email delivery (Postmark)
2. **Phase 2B** — Build Pricing Engine (PriceCode, Vendor, VendorCatalogItem models + calculation API)
3. **Phase 2C** — Migrate from `OrderSpecs` to `OrderComponent` model
4. **Phase 3** — Add Scenarios (depends on OrderComponent)
5. **Phase 4** — Inventory tracking (depends on Pricing Engine for material costs)

---

## 🔍 Key Findings

### What's Working Well:
- ✅ Core order/customer workflow is solid
- ✅ Invoice system with deposits/balance is complete
- ✅ Print functionality is polished
- ✅ Pickup reminders are automated

### Critical Gaps:
- ❌ **No automated pricing** — All prices are manually entered
- ❌ **No material catalog** — Can't track vendor items or costs
- ❌ **Limited order specs** — Only single frame, 2 mats (no multi-component support)
- ❌ **No design scenarios** — Can't show customers multiple options
- ❌ **No inventory tracking** — Can't track stock levels or generate POs

### Architecture Notes:
- Current system uses `OrderSpecs` (single row per order)
- Blueprint calls for `OrderComponent` (multiple rows per order) to support:
  - Multiple stacked frames (up to 5)
  - Multiple mats (up to 7)
  - Fillets, fabric, extras
  - Per-component pricing and discounts

This is a **significant architectural change** that will require:
1. Migration script to convert existing `OrderSpecs` → `OrderComponent` rows
2. UI overhaul for order creation/editing
3. Pricing engine integration

---

*Last updated: Review of codebase vs BLUEPRINT.md*

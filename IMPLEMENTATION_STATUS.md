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

## ❌ Phase 4 — Purchasing + Inventory (NOT STARTED)

### Step 4A: Inventory Tracking
- ❌ `InventoryItem` model — **NOT IMPLEMENTED**
- ❌ Auto-deduct materials when order moves to `in_production` — **NOT IMPLEMENTED**
- ❌ Manual inventory adjustments (waste, damage, recount) — **NOT IMPLEMENTED**
- ❌ Low-stock alerts on dashboard — **NOT IMPLEMENTED**

**Status:** ❌ **NOT STARTED**

### Step 4B: Purchase Orders
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
- ❌ Mailchimp full integration — **NOT IMPLEMENTED**

**Status:** ❌ **NOT STARTED**

---

## ❌ Phase 6 — Reporting + Export
- ❌ Sales report (daily/weekly/monthly) — **NOT IMPLEMENTED**
- ❌ Open orders report (aging, by status, by staff) — **NOT IMPLEMENTED**
- ❌ Customer report (new vs returning, lifetime value, frequency) — **NOT IMPLEMENTED**
- ❌ A/R aging report — **NOT IMPLEMENTED**
- ❌ CSV export for reports — **NOT IMPLEMENTED**
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
| **Phase 1** (Core Ops) | ✅ Complete | 100% |
| **Phase 2A** (Invoice Model) | ✅ Complete | 100% |
| **Phase 2B** (Pricing Engine) | ✅ Complete | 100% |
| **Phase 2C** (OrderComponent) | ✅ Complete | 100% |
| **Phase 3** (Scenarios) | ✅ Complete | 100% |
| **Phase 4** (Inventory) | ❌ Not Started | 0% |
| **Phase 5** (Marketing) | ❌ Not Started | 0% |
| **Phase 6** (Reporting) | ❌ Not Started | 0% |
| **Phase 7** (Advanced) | ❌ Not Started | 0% |

---

## 🎯 Next Steps (Recommended Priority)

1. **Phase 4A** — Build Inventory Tracking (InventoryItem, InventoryLot models)
2. **Phase 4B** — Build Purchase Orders system
3. **Phase 5** — Customer Marketing + Communications
4. **Phase 6** — Reporting + Export

---

*Last updated: After Phase 3A completion*

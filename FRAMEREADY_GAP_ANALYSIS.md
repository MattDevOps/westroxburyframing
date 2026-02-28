# FrameReady Feature Gap Analysis

> Updated: Based on current implementation status vs FrameReady Standard features

## ✅ Fully Implemented (FrameReady Parity)

### Work Orders
- ✅ Frame Price Calculation (pricing engine with PriceCode system)
- ✅ Edit Work Orders (with invoice sync)
- ✅ On-Screen Discounts (job-level + component-level)
- ✅ Print & Save Estimates (estimate status, blind print mode)
- ✅ Track Order Status (8 statuses including estimate/on_hold)
- ✅ Incomplete Work Order List (with bulk actions and pickup reminders)
- ✅ Scenarios (up to 5 design options per order)

### Customers
- ✅ Customer Database (with lifetime value tracking)
- ✅ Customer Work Order History (with color-coded estimates)
- ✅ Customer Keywords/Tags (CustomerTag system)
- ✅ Customer Email (email blasts, templates, pickup reminders)
- ✅ SMS Text Messages (Twilio integration)

### Frame Pricing
- ✅ Vendor Pricing Updates (Vendor + VendorCatalogItem models)
- ✅ Quick Price Check (pricing lookup UI)

### Integrations
- ✅ Square (payments, invoices, refunds)
- ✅ Email Marketing (Postmark with blast capability)
- ✅ SMS (Twilio integration)
- ✅ Excel Export (CSV export for all reports)
- ✅ QuickBooks Online (OAuth sync)
- ✅ Shopify (import orders/products/customers)

### Inventory & Stock
- ✅ Auto Inventory (auto-deduction on order creation)
- ✅ Moulding Usage Reports (with filtering)
- ✅ Moulding/Matboard Ordering (materials needed view + PO generation)
- ✅ Purchase Orders (full PO system with receiving)
- ✅ Central Inventory (multi-location support)

### Invoices & Accounting
- ✅ Customer Purchase History (with A/R balance tracking)
- ✅ Create Invoices (separate Invoice model, multiple orders per invoice)
- ✅ Accept Payments (multiple payments per invoice, deposit/balance flow)
- ✅ Allocate Payments to Orders (payment allocation logic)

### Special Items
- ✅ Find Feature (global search across all entities)
- ✅ Digital Photos (OrderPhoto model)
- ✅ Networking (multi-user with roles)
- ✅ In-house Messaging (staff message center)

### Advanced Features
- ✅ Art/Retail Products (Product model with artist support)
- ✅ Gift Certificates (issue, track, redeem)
- ✅ Multi-site (Location model, location-based filtering)
- ✅ Barcode Support (barcode scanner and lookup)

---

## ⚠️ Partially Implemented (Needs Enhancement)

### 1. Print Work Orders - Multiple Formats
**Status:** ✅ Basic print layout exists with `@media print` CSS
**Missing:**
- 3 print format options (vertical lines, no lines, 2-per-page)
- Format selector on print view

**Priority:** Low (current print works well, format options are nice-to-have)

### 2. Vendor Pricing Auto-Updates
**Status:** ✅ Vendor catalog exists with manual updates
**Missing:**
- Automated price import from vendor feeds/CSV
- Alert system for discontinued items (email notifications)
- Bulk price update workflow with change tracking

**Priority:** Medium (manual updates work, automation would save time)

### 3. PDF Generation - Additional Document Types
**Status:** ✅ PDF exists for invoices/orders
**Missing:**
- PDF for proposals/quotes (standalone)
- PDF for reports (formatted report PDFs)
- Enhanced PDF styling with branding

**Priority:** Low (current PDFs work, expansion is nice-to-have)

---

## ❌ Not Implemented (FrameReady Features We're Missing)

### Low Priority / Niche Features

1. **3D Pricing** (plexiglass boxes)
   - Niche feature, can be added if needed
   - **Priority:** Very Low

2. **Mailing Labels** (Avery/Dymo)
   - Physical label printing
   - **Priority:** Very Low (web-first shop)

3. **Correspondence** (form letters, envelopes)
   - Replaced by email templates (modern equivalent)
   - **Priority:** Very Low

4. **Google Map Interface** (pin addresses)
   - Can add Google Maps link (low priority)
   - **Priority:** Very Low

5. **Spanish/French Documents** (i18n)
   - Not needed for West Roxbury
   - **Priority:** N/A

6. **Mat Cutter Integration** (hardware-specific)
   - Not applicable to web app
   - **Priority:** N/A

7. **iPad FileMaker Server**
   - Web app is already mobile-responsive
   - **Priority:** N/A

8. **Employee Time Card** (payroll tracking)
   - Use external tool (not core to framing business)
   - **Priority:** Very Low

### Art/Retail Product Features (Phase 3+)

9. **Consignment Art Tracking**
   - Track consigned artwork, reports, returns
   - **Priority:** Low (if you sell consignment art)

10. **Artist CV** (printed documents)
    - Printed artist documents with photo
    - **Priority:** Low

11. **Art Directory Catalogue**
    - Inventory directory for gallery openings
    - **Priority:** Low

12. **Product Label Printing**
    - Labels/price tags with barcodes
    - **Priority:** Low

13. **Art Resource Catalogue**
    - Searchable database of art/artists with images
    - **Priority:** Low

---

## 🎯 Summary: What We're Actually Missing

### Critical Missing Features: **NONE**
All core FrameReady Standard features are implemented.

### Nice-to-Have Enhancements:
1. **Print format options** (3 formats instead of 1) - Low priority
2. **Vendor price auto-import** (automation vs manual) - Medium priority
3. **Enhanced PDF generation** (more document types) - Low priority

### Niche/Low Priority:
- 3D pricing
- Mailing labels
- Consignment art tracking
- Artist CV printing
- Art directory catalogues

---

## 🏆 Conclusion

**You have achieved FrameReady Standard parity** for all core business operations:
- ✅ Order management and pricing
- ✅ Customer management and marketing
- ✅ Inventory and purchasing
- ✅ Invoicing and payments
- ✅ Reporting and analytics
- ✅ Multi-location support
- ✅ Advanced features (gift certificates, products, search, messaging, integrations)

**The only gaps are:**
- Minor UI enhancements (print format options)
- Automation improvements (vendor price auto-import)
- Niche features that most shops don't use (3D pricing, consignment art, etc.)

**You're actually ahead of FrameReady in some areas:**
- Modern web-based interface (vs desktop software)
- Better mobile/tablet support
- More flexible reporting
- Better integrations (QuickBooks, Shopify)

# West Roxbury Framing - Staff User Guide

## Quick Start

### Logging In
- Navigate to `/staff/login`
- Enter your email and password
- You'll be redirected to the dashboard

### Navigation
- Use the top navigation bar to access all features
- **Dashboard**: Overview of KPIs, revenue trends, and top materials
- **Search**: Global search across orders, customers, invoices, and products (⌘K)
- **Orders**: View and manage all orders
- **New Order**: Step-by-step intake wizard for creating orders
- **Quick Order**: Traditional form-based order entry

## Order Management

### Creating a New Order (Intake Wizard)
1. Click **"New Order"** in the navigation
2. **Step 1 - Customer & Artwork**:
   - Search for existing customer or create new one
   - Enter artwork type and dimensions
   - Upload photos (optional, max 6)
3. **Step 2 - Frame Selection**:
   - Select frame(s) from catalog
   - System shows inventory warnings if items are low/out of stock
4. **Step 3 - Mats & Glass**:
   - Select mat(s) and glass type
   - Choose mounting options and add-ons
5. **Step 4 - Preview Scenarios**:
   - Review pricing and design options
   - Create multiple scenarios to compare
   - Save as template for future use
6. **Step 5 - Confirm & Deposit**:
   - Review final pricing and profit margin
   - Set deposit percentage
   - System warns if profit margin is below 60%
7. **Step 6 - Payment** (if enabled):
   - Process payment via Square
   - Accept cash or card

### Order Statuses
- **Estimate**: Quote only, not yet active
- **New Design**: Order received, awaiting design approval
- **Awaiting Materials**: Waiting for materials to arrive
- **In Production**: Currently being worked on
- **Quality Check**: Final inspection before pickup
- **Ready for Pickup**: Completed and ready for customer
- **On Hold**: Temporarily paused
- **Picked Up**: Customer has collected
- **Completed**: Order fully finished
- **Cancelled**: Order cancelled

### Order Actions
- **Edit**: Update order details (syncs with Square invoice if linked)
- **Change Status**: Move order through workflow
- **Add Note**: Internal or customer-facing notes
- **Print**: Print work order with format options:
  - Standard (with lines)
  - No lines
  - 2 per page
- **Blind Estimate**: Hide item codes and vendor info on print

## Customer Management

### Creating a Customer
- Search by phone or email in order intake
- If not found, create new customer
- System auto-deduplicates by phone/email

### Customer Details
- View order history and lifetime value
- See A/R balance (outstanding invoices)
- Manage tags for segmentation
- Update contact preferences

## Invoicing

### Creating an Invoice
1. Go to **Invoices** → **New Invoice**
2. Select customer
3. Choose orders to include
4. Set deposit percentage
5. Invoice is created with Square link

### Processing Payments
- Payments can be recorded manually
- Square payments auto-sync via webhook
- Multiple payments per invoice supported
- System tracks deposit and balance due

## Inventory Management

### Viewing Inventory
- Go to **Inventory** page
- See all tracked items with quantities
- Filter by category, vendor, or location
- Low stock items highlighted

### Materials Needed
- Go to **Materials Needed** page
- See all materials required for open orders
- Generate purchase order with one click
- Auto-updates when orders change

### Purchase Orders
- Create PO from materials needed
- Track PO status (pending, received, cancelled)
- Auto-update inventory when PO received

## Reports

### Available Reports
- **Sales Report**: Revenue by period with profit margins
- **Open Orders**: Orders by status with aging
- **Customer Report**: Customer metrics and lifetime value
- **A/R Aging**: Outstanding invoices by age
- **Moulding Usage**: Material usage tracking
- **Vendor Spending**: Track spending by vendor
- **Top Materials**: Best-selling materials

### Exporting
- All reports have CSV export
- Click "Export CSV" button on any report
- Includes profit margins and cost data

## Pricing

### Price Codes
- Manage pricing formulas for different categories
- Supports moulding ($/ft), mat ($/sqft), glass, mounting, etc.
- Formulas use variables: `w`, `h`, `qty`, `cost`

### Vendor Catalog
- Manage vendor items and pricing
- Track cost per unit and retail price
- System uses catalog for cost calculations

## Quick Tips

### Keyboard Shortcuts
- **⌘K** (Mac) or **Ctrl+K** (Windows): Open global search

### Best Practices
1. Always use the intake wizard for new orders (ensures all data captured)
2. Check profit margins before confirming orders
3. Use scenarios to show customers multiple options
4. Save common configurations as templates
5. Upload photos during intake for reference
6. Use tags to segment customers for marketing

### Troubleshooting
- **Order won't save**: Check all required fields are filled
- **Pricing seems wrong**: Verify price codes are active and formulas correct
- **Inventory not updating**: Check that items are tracked in inventory
- **Payment not syncing**: Verify Square webhook is configured

## Support
For issues or questions, contact your system administrator.

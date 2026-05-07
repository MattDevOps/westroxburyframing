# Testing Checklist - West Roxbury Framing

## ✅ Completed Improvements

### 1. Performance Optimizations
- ✅ Customer detail page already uses parallel queries
- ✅ Database indexes in place for common queries
- ✅ Dashboard uses Promise.all for parallel data fetching

### 2. Print Format Options
- ✅ Added 3 print formats: Standard (with lines), No lines, 2 per page
- ✅ Format selector on order detail page
- ✅ Blind estimate option still available

### 3. UI Components
- ✅ Created reusable ErrorMessage component
- ✅ Created SuccessMessage component
- ✅ Created InfoMessage component
- ✅ Created LoadingSpinner component
- ✅ Created LoadingOverlay component

### 4. Documentation
- ✅ Created STAFF_GUIDE.md with comprehensive user documentation

## Testing Checklist

### Order Management
- [ ] Create new order via intake wizard (all 6 steps)
- [ ] Test quick order form
- [ ] Edit existing order
- [ ] Change order status through workflow
- [ ] Add notes (internal and customer-facing)
- [ ] Print work order with all 3 formats
- [ ] Test blind estimate print option
- [ ] Create estimate and activate it
- [ ] Test order scenarios (create, compare, set active)

### Customer Management
- [ ] Search for customer by phone/email
- [ ] Create new customer
- [ ] View customer detail page
- [ ] Update customer information
- [ ] View customer order history
- [ ] View customer lifetime value
- [ ] Manage customer tags

### Invoicing
- [ ] Create invoice from multiple orders
- [ ] Set deposit percentage
- [ ] Process payment (manual)
- [ ] View invoice detail
- [ ] Test Square payment integration
- [ ] Verify payment webhook auto-reconciliation

### Inventory
- [ ] View inventory list
- [ ] Check inventory status in intake wizard
- [ ] View materials needed
- [ ] Generate purchase order
- [ ] Receive purchase order
- [ ] Verify inventory auto-updates

### Reports
- [ ] View sales report with profit margins
- [ ] Export sales report to CSV
- [ ] View open orders report
- [ ] View customer report
- [ ] View A/R aging report
- [ ] View moulding usage report
- [ ] View vendor spending report
- [ ] View top materials report

### Payment Flow (End-to-End)
- [ ] Create order via intake wizard
- [ ] Process payment via Square (card)
- [ ] Process cash payment
- [ ] Verify invoice updates automatically
- [ ] Verify order status updates (if auto-advance enabled)
- [ ] Verify confirmation email sent

### Intake Wizard (Comprehensive)
- [ ] Step 1: Customer search and creation
- [ ] Step 1: Artwork details and photo upload
- [ ] Step 1: Quick order from customer history
- [ ] Step 2: Frame selection with inventory warnings
- [ ] Step 3: Mats and glass selection
- [ ] Step 4: Scenario creation and comparison
- [ ] Step 4: Save and load order templates
- [ ] Step 5: Profit margin calculation and warnings
- [ ] Step 5: Deposit selection
- [ ] Step 6: Payment processing
- [ ] Test auto-save draft functionality
- [ ] Test validation at each step

### Error Handling
- [ ] Test invalid customer data
- [ ] Test missing required fields
- [ ] Test network errors
- [ ] Test API error responses
- [ ] Verify error messages are user-friendly
- [ ] Test error recovery (retry buttons)

### Mobile/Tablet Responsiveness
- [ ] Test intake wizard on tablet
- [ ] Test order detail page on mobile
- [ ] Test dashboard on tablet
- [ ] Test reports on mobile
- [ ] Verify touch targets are adequate
- [ ] Test navigation menu on mobile

### Edge Cases
- [ ] Order with zero dimensions
- [ ] Order with very large dimensions
- [ ] Customer with no orders
- [ ] Invoice with no payments
- [ ] Inventory item with zero quantity
- [ ] Order with all optional fields empty
- [ ] Multiple scenarios with same pricing
- [ ] Template with missing data

### Performance
- [ ] Load dashboard with many orders
- [ ] Load customer detail with many orders
- [ ] Load reports with large date ranges
- [ ] Test search with many results
- [ ] Verify loading states appear quickly

## Known Issues to Verify Fixed
- [ ] Print format class removed after printing
- [ ] Error messages display correctly
- [ ] Loading states show on all slow pages
- [ ] Mobile navigation works correctly

## Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Safari
- [ ] Firefox
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Integration Testing
- [ ] Square payment processing
- [ ] Square webhook reception
- [ ] Postmark email sending
- [ ] Twilio SMS sending
- [ ] Vercel Blob photo upload

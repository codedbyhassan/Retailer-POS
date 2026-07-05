# Admin Features Guide

Complete reference for all administrative functions in Retailer-POS.

## Dashboard

The admin dashboard provides real-time insights into your retail operations.

### Sales Metrics
- **Today's Sales**: Total revenue and transaction count for current day
- **This Week**: Cumulative sales for the past 7 days
- **This Month**: Cumulative sales from month start to today
- **Inventory Value**: Total monetary value of all products in stock

### Alerts & Status Indicators

#### Low Stock Alerts
- Shows products below reorder level
- Red badges indicate critical stock
- Click alert to jump to inventory management
- Threshold: configurable per product (default: 10 units)

#### Sync Status Indicator
- **Green dot, "Synced X ago"**: Last successful sync timestamp
- **Blue pulse, "Syncing..."**: Currently syncing to server
- **Offline**: No internet connection (local data preserved)
- Appears in top-right of dashboard

### Hourly Sales Breakdown
- Sparkline chart showing sales by hour
- Click bars to see exact dollar amounts
- Helps identify peak sales times
- Updates every minute

### Quick Actions
- **Open POS**: Jump to point-of-sale terminal
- **Manage Inventory**: Navigate to product/stock management

---

## Inventory Management

### Product Management

#### Add New Product
1. Click **Manage Inventory**
2. Click **Add Product**
3. Fill in details:
   - **Name** (required): Product display name
   - **SKU**: Internal identifier (optional, auto-generated if blank)
   - **Barcode**: 8-12 digit code (optional, enables barcode scanning)
   - **Category**: For organization (e.g., "Electronics", "Groceries")
   - **Cost Price**: What you paid for the product
   - **Selling Price** (required): Retail price
   - **Reorder Level**: Trigger for low stock alert (default: 10)

#### Edit Product
1. Find product in inventory table
2. Click product row
3. Update fields and save
4. Changes sync to all devices within 30 seconds

#### Archive Product
- Instead of deleting, archive old/discontinued items
- Archived products don't appear in POS but data is preserved
- Useful for historical reporting

#### Bulk Import (Planned Feature)
- Import products from CSV file
- Template: NAME,SKU,BARCODE,CATEGORY,COST_PRICE,SELLING_PRICE,REORDER_LEVEL

### Stock Adjustment

#### Manual Stock Count
1. Go to **Inventory** → **Adjust Stock**
2. Select product
3. Enter new quantity
4. Add reason (e.g., "Physical count", "Damage", "Return")
5. System records before/after quantities

#### Common Adjustments
- **Receiving**: Add items to inventory
- **Damage**: Reduce stock for damaged goods
- **Shrinkage**: Account for theft/loss
- **Return**: Customer returns product
- **Correction**: Fix inventory discrepancies

### Stock Reports

#### Low Stock Products
- Shows items below reorder level
- Export to print for ordering
- Prioritized by criticality (% of stock remaining)

#### Out of Stock
- Products with 0 quantity
- Excludes archived items
- Useful for identifying what to reorder urgently

#### Inventory Value
- Total cost basis of all inventory
- Sum of (quantity × cost_price)
- Updated in real-time

---

## Sales Management

### Point of Sale (POS) Terminal

#### Adding Items
1. **Scan Barcode**: Hold barcode scanner to barcode input field
2. **Search**: Type product name or barcode
3. **Browse**: Click products in the grid
4. **Lookup**: If barcode not in system, click "Lookup" to check external API

#### Barcode Scanning
- Automatically adds item when barcode scans
- If product not in inventory:
  - System attempts external lookup via Barcode Lookup API
  - Shows product name if found
  - Recommends adding to inventory
- Local cache prevents repeated API lookups (max 5/minute)

#### Applying Discounts
- **Percentage Discount**: Enter discount % (e.g., 10 for 10% off)
- **Applied to**: Subtotal before tax
- **Example**: $100 subtotal, 10% discount = $90, then tax on $90

#### Payment Methods
- **Cash**: Default, no special tracking
- **Card**: Records card payment
- **Check**: Records check payment
- **Other**: Custom payment method

#### Checkout
1. Verify cart items and quantities
2. Select payment method
3. Apply discount if applicable
4. Click **Complete Sale**
5. Review receipt, optionally print
6. Cart automatically clears for next sale

#### Receipt Options
- **Print**: Physical receipt for customer
- **Digital**: Email receipt (when email integration enabled)
- **Both**: Print and email

### Sales Transactions

#### View Sales History
1. Click **Dashboard** → **Sales Report**
2. Filter by:
   - **Date Range**: Specific period
   - **Cashier**: Filter by employee
   - **Payment Method**: Cash, card, etc.
3. Export to CSV for accounting

#### Void Transaction
- Admin can void recent sales (within configurable window)
- Requires authentication
- Refunds inventory to original quantity
- Marked in reports with "VOIDED" status
- Sync sends void to server

#### Duplicate Prevention
- System prevents accidental double-click checkout
- Idempotency keys prevent duplicate database entries even if sync runs twice
- 10-second window to detect duplicate transactions

---

## User Management

### Cashiers

#### Create Cashier Account
1. Go to **Settings** → **Team** (or **Manage Users**)
2. Click **Add Cashier**
3. Enter:
   - **Name**: Full name for receipts
   - **PIN/Password**: For login
   - **Role**: Cashier or Admin
4. Save

#### Cashier Permissions
- **Cashier**: Can only use POS, see own sales
- **Admin**: Access to all management features

#### Track Cashier Sales
- Dashboard filters sales by cashier
- Reports show per-cashier metrics
- Useful for performance evaluation

### Business Settings

#### Store Information
- **Store Name**: Appears on receipts
- **Address**: Optional
- **Phone**: Optional
- **Email**: For admin notifications

#### Financial Settings
- **Tax Rate**: Applied to all sales
- **Currency**: Display format (USD, EUR, etc.)
- **Decimal Places**: Precision (usually 2)

#### Receipt Settings
- **Logo**: Company logo on digital/printed receipts
- **Footer Message**: "Thank you, come again!" etc.
- **Receipt Width**: For thermal printer compatibility

---

## Reports & Analytics

### Daily Sales Report
- **Today's Revenue**: Total sales amount
- **Transaction Count**: Number of completed sales
- **Average Transaction**: Revenue ÷ Count
- **Top Products**: Best-selling items by quantity
- **Payment Methods**: Breakdown by cash/card/other

### Weekly Summary
- Sales trend over 7 days
- Inventory movement
- Low stock products during period
- Busiest day identification

### Monthly Analysis
- Revenue vs. previous months (if data available)
- Best-selling categories
- Inventory turnover rate
- Identify seasonal patterns

### Custom Reports
- **Export Sales**: Download to Excel/CSV
- **Date Range**: Pick any start/end dates
- **Filters**: By cashier, category, payment method
- **Grouping**: By day, week, month, payment method

---

## Security Features

### User Authentication
- **PIN Entry**: Cashiers use 4-6 digit PIN
- **Password**: Admin accounts use strong passwords
- **Session Timeout**: Auto-logout after 15 minutes of inactivity (configurable)

### Data Protection
- All data encrypted at rest in Supabase
- HTTPS for all server communication
- IndexedDB data encrypted locally on device
- No passwords stored in local storage

### Audit Trail
- Every transaction records:
  - Cashier ID
  - Timestamp
  - Items sold
  - Discount applied
  - Payment method
- Accessible in sales reports for audit compliance

### Backup & Recovery
- **Automatic**: Daily backups to Supabase (free tier: 7 days)
- **Manual**: Export inventory and sales data as CSV
- **Local**: IndexedDB maintains local backup

---

## Settings & Configuration

### Theme Settings
- **Light Mode**: Easier on eyes in bright locations
- **Dark Mode**: Reduces eye strain in dim stores
- Preference saves per device

### Notifications
- **Low Stock Alerts**: Enable/disable on dashboard
- **Sync Notifications**: Show when data syncs
- **Error Alerts**: Critical issues notify admin

### Offline Mode
- **Auto-Detect**: Automatically works offline
- **Sync Queue**: Pending items sync when online
- **Conflict Resolution**: Newer data wins in case of conflicts

### API Keys (Advanced)
- **Barcode Lookup API**: Optional external barcode database lookup
- **Rate Limits**: Server enforces 50 syncs/min, 10 barcode lookups/min
- **Custom Headers**: For special integrations

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `ESC` | Clear search/Close modal |
| `Enter` | Complete action (checkout, save) |
| `Tab` | Move to next field |
| `Ctrl/Cmd+P` | Print receipt |
| `Ctrl/Cmd+E` | Export to CSV |
| `Ctrl/Cmd+F` | Search products |

---

## Troubleshooting

### Sales Won't Sync
- Check internet connection
- Look for rate limit error (429): Wait before retrying
- Clear sync queue in Settings if stuck

### Products Not Showing in POS
- Verify product quantity > 0 (archived products hidden)
- Check product category settings
- Refresh page (F5 or Cmd+R)

### Barcode Scan Not Working
- Ensure barcode format is valid (8-12 digits)
- Verify barcode matches product record
- Check rate limit (max 5 lookups/minute)

### Inventory Count Mismatch
- Physical count vs. system count
- Manually adjust in Stock Adjustment
- Investigate missing/extra stock

### Dashboard Loading Slowly
- Check internet speed
- Clear browser cache
- Reduce date range in reports

---

## Best Practices

1. **Regular Backups**: Download data weekly
2. **Keep Inventory Updated**: Adjust stock after physical counts
3. **Monitor Sync Status**: Ensure regular sync indicator
4. **Review Reports**: Identify trends and anomalies
5. **Secure Access**: Change default passwords
6. **Test Offline**: Verify app works without internet
7. **Update Products**: Keep descriptions and pricing current
8. **Reconcile Regularly**: Compare physical stock to system weekly

---

## Support & Resources

- **Internal Docs**: See README.md for system overview
- **Database Schema**: See SUPABASE_SETUP.md for technical details
- **Rate Limiting**: See RATE_LIMITING.md for API limits
- **Issues**: Report bugs on GitHub


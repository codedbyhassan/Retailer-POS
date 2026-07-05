# Retailer-POS Application Screenshots

Complete visual overview of the Retailer-POS application features and interface.

## Overview

Retailer-POS is a modern, offline-first Point of Sale and Inventory Management system built with React and Vite. The app works seamlessly without internet and syncs data to the cloud when available.

## Screenshots

### 1. Login Screen
<img src="01-dashboard.png" alt="Login Screen" width="100%"/>

**Features:**
- Clean, modern authentication interface
- Demo credentials for quick testing
- Email and password validation
- Responsive design

**Demo Accounts:**
- Admin: `admin@retailer.com` / `admin123`
- Cashier: `cashier@retailer.com` / `cashier123`

---

### 2. Admin Dashboard
<img src="02-admin-dashboard.png" alt="Admin Dashboard" width="100%"/>

**Key Features:**
- **Real-time Sales Metrics:**
  - Today's Sales: Live transaction count and revenue
  - Weekly & Monthly Totals: Trend analysis at a glance
  - Inventory Value: Total stock value across all products

- **Dashboard Alerts:** 
  - Low stock warnings with product count
  - Products automatically flagged when below reorder level
  - Click to jump to inventory management

- **Hourly Sales Breakdown:**
  - Sparkline chart showing sales per hour
  - Identify peak sales times
  - Used for staffing and promotional planning

- **Sync Status Indicator:**
  - Shows when data was last synced to cloud
  - Online/offline status at top right
  - Real-time sync during operations

---

### 3. Point of Sale (POS) Terminal
<img src="03-pos-page.png" alt="POS Page" width="100%"/>

**Barcode Scanning & Product Search:**
- Search products by name or scan barcode
- Auto-populate from barcode database if not in local system
- Rate-limited to 10 lookups/minute (configurable)
- Local caching prevents duplicate API calls

**Product Catalog:**
- Grid view showing all available products
- Stock status badges (In Stock, Low Stock indicators)
- Real-time pricing and quantity display
- Visual product categories (Groceries, Bakery, Beverages, etc.)

**Cart Management:**
- Real-time cart updates
- Quantity adjustment with live total calculation
- Discount application (flat amount or percentage)
- Tax calculation (configurable per business)

**Checkout:**
- Multiple payment methods: Cash, Card, Mobile
- Duplicate prevention: Prevents accidental double-charges
- Idempotency keys ensure transaction safety
- Receipt generation and printing

---

### 4. Inventory Management
<img src="04-inventory.png" alt="Inventory Management" width="100%"/>

**Stock Overview:**
- Total product count
- Real-time inventory value
- Low stock item count with alert highlighting

**Stock Tracking Table:**
| Column | Purpose |
|--------|---------|
| Product | Item name with category icon |
| In Stock | Current quantity available |
| Reorder At | Automatic reorder threshold |
| Value | Total stock value per item |
| Status | Visual indicator (In Stock/Low Stock) |

**Features:**
- Adjust Stock button for manual inventory correction
- Quick access to low-stock products
- Inventory history and audit trail
- Batch adjustments for receiving shipments

---

### 5. Product Catalog Management
<img src="05-products.png" alt="Product Catalog Management" width="100%"/>

**Product Administration:**
- Complete product database with search
- SKU tracking for barcodes
- Category organization
- Pricing management

**Product Actions:**
- Edit: Modify product details, price, category
- Archive: Soft delete keeps history
- Bulk operations: Import/export capabilities
- Product images: Associate thumbnails with products

**Table Columns:**
| Column | Purpose |
|--------|---------|
| Product | Item name with thumbnail |
| SKU | Barcode/unique identifier |
| Category | Product classification |
| Price | Selling price per unit |
| Qty | Current stock level |
| Status | In Stock / Low Stock |
| Actions | Edit, Archive, Duplicate |

---

### 6. Sales History
<img src="06-sales.png" alt="Sales History" width="100%"/>

**Sales Records:**
- Date range filtering (From/To)
- Complete transaction history
- Revenue per transaction
- Payment method tracking

**Features:**
- Filter by date range
- Search transactions by invoice number
- View transaction details
- Reprint receipts
- Export sales data

---

### 7. Reports & Analytics
<img src="07-reports.png" alt="Reports & Analytics" width="100%"/>

**Report Tabs:**
- **Overview:** Dashboard-style summary metrics
- **Daily:** Day-by-day breakdown
- **Products:** Top performers and slow movers
- **Inventory:** Stock movements and valuation

**Key Metrics Displayed:**
| Metric | Purpose |
|--------|---------|
| Today Revenue | Current day sales total |
| Today Profit | Revenue minus cost of goods |
| Avg Order Value | Average transaction amount |
| Units/Order | Average items per transaction |
| All-Time Revenue | Total historical sales |
| All-Time Profit | Total historical profit |
| Profit Margin | Profitability percentage |
| Dormant Stock | Inventory not moving |

**Advanced Features:**
- Customizable date ranges
- Export to CSV/Excel
- Trend analysis
- Year-over-year comparison

---

## New Features (v1.0.1)

### ✨ Dashboard Enhancements
- Real-time low-stock alerts with product counts
- Sync status indicator showing last sync time
- Hourly sales sparkline chart for trend visualization
- Skeleton loaders for better perceived performance

### 📱 Barcode Lookup API
- External product database integration
- Automatic lookup when product not found locally
- Session rate limiting (5 lookups/minute)
- Local cache reduces API calls
- Graceful fallback to manual search

### 🔒 Duplicate Prevention
- Client-side loading states prevent double-click
- Idempotency keys generated per transaction
- Server-side deduplication within 10-second window
- Prevents accidental duplicate charges

### ⚡ API Rate Limiting
- Sync endpoint: 50 requests/minute per user
- Barcode endpoint: 10 requests/minute per user
- 429 responses with Retry-After headers
- Per-user tracking for fair usage

### 📚 Comprehensive Documentation
- SUPABASE_SETUP.md: Cloud backend configuration
- ADMIN_FEATURES.md: Complete feature reference
- RATE_LIMITING.md: API protection and monitoring

---

## Technical Stack

**Frontend:**
- React 18 with Hooks
- Vite build tool
- Tailwind CSS
- IndexedDB for offline storage
- SWR for data fetching

**Backend:**
- Express.js server
- SQLite for local storage
- Supabase integration (optional)
- Rate limiting middleware
- Deduplication service

**Deployment:**
- Vercel hosting
- GitHub integration
- Zero-downtime deployments
- Production analytics

---

## Getting Started

1. **Sign In** with demo credentials
2. **Open POS** from dashboard to start selling
3. **Add Products** via the Products page
4. **Manage Inventory** to track stock
5. **View Reports** to analyze performance

All data syncs automatically when internet is available. Works perfectly offline!

---

## Support

For detailed setup and configuration, see:
- [SUPABASE_SETUP.md](../SUPABASE_SETUP.md)
- [ADMIN_FEATURES.md](../ADMIN_FEATURES.md)
- [RATE_LIMITING.md](../RATE_LIMITING.md)
- [Main README](../../README.md)

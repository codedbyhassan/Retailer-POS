# Retailer POS

Offline-first point of sale, inventory, product, and reporting system for small and medium retailers. The app is built to keep selling even when the internet drops: products, sales, inventory movements, settings, product images, theme presets, and sync queue state are stored locally first with IndexedDB, then synchronized through the backend when available.

## Highlights

- Offline-first POS with local checkout, cart discounts, tax, payment method tracking, and printable purchase receipts.
- Redesigned sales terminal with responsive desktop/tablet layout, product cards, stronger search, and a cleaner cart panel.
- Professional receipt modal with item-level pricing, quantities, cashier, payment method, totals, receipt footer, and print support.
- Product catalog with admin-side image uploads stored in IndexedDB, image compression, SKU/barcode/category metadata, and archive support.
- Viewport-safe modals with wide admin forms, including a wider add/edit product modal.
- Inventory management with stock adjustments, low-stock and out-of-stock states, inventory valuation, and movement history.
- Reports hub with detailed analytics for revenue, profit, margin, product velocity, stock cover, dormant inventory value, payment mix, cashier performance, category performance, and top/slow movers.
- Detailed report drill-downs for daily sales, products, and inventory, each with back navigation and report tabs.
- App-wide business settings for currency, tax rate, receipt footer, low-stock threshold, business name, and visual preset.
- Five runtime visual presets: Classic Blue, Emerald Market, Ruby Retail, Gold Ledger, and Violet Studio.
- Sticky admin sidebar navigation and responsive mobile admin tabs.
- Role-based access for admins and cashiers.
- Optional Express/Supabase sync backend, with local memory fallback when Supabase is not configured.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS |
| Local data | IndexedDB via `idb` |
| Backend | Node.js, Express |
| Optional cloud | Supabase |
| Styling | Tailwind utility system, CSS-variable brand presets, custom iOS-like cards and motion |

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install

```bash
npm install
npm install --prefix server
```

### Run the frontend

```bash
npm run dev
```

Open `http://localhost:5173`.

### Run the backend

```bash
npm run server
```

The API defaults to `http://localhost:3001`.

### Run both together

```bash
npm run dev:all
```

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@retailer.com` | `admin123` |
| Cashier | `cashier@retailer.com` | `cashier123` |

The demo users and sample products are seeded into IndexedDB on first launch.

## Core Workflows

### Admin

- Manage products, prices, images, categories, SKU/barcode data, and stock thresholds.
- Upload product images from the admin side; images are compressed and stored locally in IndexedDB.
- Adjust inventory and review stock movement history.
- Review sales history and transaction details.
- Use the Reports hub for detailed analytics and drill down into daily, product, and inventory reports.
- Configure business name, currency, tax rate, low-stock threshold, receipt footer, and visual preset.
- Manage cashier/admin users.

### Cashier

- Search products or scan barcodes.
- Add products to cart, adjust quantities, apply percentage discounts, and choose payment method.
- Complete offline-capable checkout.
- Print a detailed customer purchase receipt.

## Reports

The Reports hub is the recommended analytics entry point at `/admin/reports`.

| Report | Details |
| --- | --- |
| Overview | Revenue, profit, margin, average order value, unit movement, category mix, payment methods, cashier performance, stock alerts, product movement detail |
| Daily Sales | Date-filtered revenue, profit, transactions, average order, margin, hourly sales, payment mix, top products, unit movement, transaction table |
| Product | Product revenue, profit, units sold, margins, best sellers, slow movers, revenue by category, stock cover, out-of-stock products |
| Inventory | Inventory cost, retail value, potential profit, stock health, value by category, reorder risk, stock detail table |

All drill-down reports include back navigation and tabs for moving between report views.

## Visual Presets

Settings include five runtime presets that update the app's brand color system without rebuilding:

- Classic Blue
- Emerald Market
- Ruby Retail
- Gold Ledger
- Violet Studio

Presets affect brand buttons, active states, chart bars, focus rings, and highlighted UI.

## Offline-First Data Model

The frontend stores operational data in IndexedDB:

- `products`
- `product_images`
- `sales`
- `sale_items`
- `inventory_logs`
- `users`
- `settings`
- `sync_queue`

Product images are stored locally in `product_images` and referenced from products by `image_id`, keeping product records and sync payloads lighter while still supporting offline display.

## Sync Behavior

The app writes changes locally first. Syncable actions are queued in `sync_queue`:

- `CREATE_PRODUCT`
- `UPDATE_PRODUCT`
- `ARCHIVE_PRODUCT`
- `CREATE_SALE`
- `INVENTORY_ADJUST`

When online, the sync engine posts pending actions to `/api/sync`. If Supabase is configured, the backend upserts data into Supabase. If not, the backend uses an in-memory fallback so local development still works.

## Environment

Copy the example files and fill values as needed:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Typical frontend setting:

```env
VITE_API_URL=http://localhost:3001
```

Backend Supabase settings are optional. The app remains usable offline/local without them.

## Documentation

Complete guides for setup, configuration, and usage:

| Document | Purpose |
| --- | --- |
| [**SUPABASE_SETUP.md**](docs/SUPABASE_SETUP.md) | Cloud backend configuration, SQL schema, sync conflict resolution, and troubleshooting |
| [**ADMIN_FEATURES.md**](docs/ADMIN_FEATURES.md) | Complete admin reference: dashboard, inventory, sales, users, reports, security, and best practices |
| [**RATE_LIMITING.md**](docs/RATE_LIMITING.md) | API rate limit policies, retry strategies, caching, and optimization |

### New Features (v1.0.1)

- **Dashboard Alerts**: Real-time low-stock alerts, sync status indicator, and hourly sales sparkline
- **Barcode Lookup API**: Automatic product lookup by barcode with local caching (5 lookups/min limit)
- **Duplicate Prevention**: Server-side transaction deduplication prevents accidental double-charges
- **API Rate Limiting**: 50 sync requests/min and 10 barcode lookups/min per user (configurable)
- **Skeleton Loaders**: Better perceived performance with loading states

## Free APIs Worth Adding Next

These all have free tiers and fit the roadmap well:

| API | Use in this app |
| --- | --- |
| Open Exchange Rates or Frankfurter | Live exchange rates for multi-currency reporting and receipts |
| Barcode Lookup API or Open Food Facts | Product lookup by barcode to speed up product creation |
| Unsplash Source or Pexels | Optional product/category imagery for nicer placeholder visuals |
| Resend | Email receipts and daily sales summaries |
| Cloudinary | Hosted product image backup and transformations if you later want cloud media sync |
| ipapi.co | Store/location-aware currency and locale defaults |
| SheetDB or Google Sheets API | Export reports to spreadsheets for small business owners |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite frontend |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build |
| `npm run server` | Start the Express backend |
| `npm run dev:all` | Start frontend and backend together |

## Project Structure

```text
src/
  app/                 App router
  components/          Reusable UI, forms, tables, modals, product cards, analytics widgets
  hooks/               Auth, cart, settings, sync, offline helpers
  layouts/             Admin, cashier, and shell layouts
  pages/               POS, products, inventory, reports, dashboards, settings
  services/
    indexeddb/         Local data stores
    api/               API helpers
    sync/              Sync queue and engine
  store/               Lightweight global app store
  utils/               Formatting, validation, image compression, IDs

server/
  controllers/         Request handlers
  middleware/          Auth and role middleware
  routes/              Express API routes
  services/            Sync service and Supabase mapping
  utils/               Logging
```

## Production Notes

- Run `npm run build` before deployment.
- Serve `dist/` with any static host.
- Run the backend separately if remote sync is needed.
- Configure Supabase tables to match the product, sale, sale item, and inventory log payloads used by `server/services/syncService.js`.
- IndexedDB data is browser-local. Clearing site data resets local products, images, sales, settings, presets, and queued sync items.

## Current Status

This project includes a complete offline-first retail workflow: admin product and inventory management, POS checkout, receipt printing, app-wide currency settings, visual presets, IndexedDB product images, sales history, sticky navigation, viewport-safe modals, and detailed reporting analytics.

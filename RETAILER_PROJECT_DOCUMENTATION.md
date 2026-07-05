# Retailer, Offline First POS and Inventory System

## Full Project Documentation and Phased Build Plan

---

## 1. Project Summary

Retailer is an offline first Point of Sale and Inventory Management System built for small and medium businesses in emerging markets. The core idea is simple, a shop owner should never lose a sale because the internet went down. Every transaction is written to the device first, then synced to the cloud whenever a connection becomes available.

This document exists to do two things. First, explain what every part of the system is for, so anyone opening the repo (including a recruiter or another developer) understands the architecture immediately. Second, break the build into clear phases with ready to use prompts, so the project gets built in a logical order instead of everything at once.

---

## 2. Core Principles

- Offline first, the app must work fully without internet
- Simple architecture, no microservices, no Kubernetes, no unnecessary abstraction
- Performance, the POS screen must feel instant, never wait on a network request
- Reliability, no sale should ever be lost, covered by IndexedDB, a sync queue, cloud backup and audit logs

---

## 3. Technology Stack

**Frontend**
- React with Vite
- JavaScript, not TypeScript, to keep onboarding and iteration speed high
- Tailwind CSS for styling
- TanStack Query for server state, caching and background sync

**Local storage layer**
- IndexedDB as the primary database for products, inventory, sales, customers, settings and the sync queue
- LocalStorage for lightweight preferences, theme, session info, last sync timestamp

**Backend**
- Node.js with Express for the REST API, handling authentication, validation, sync and reporting

**Cloud layer**
- Supabase for PostgreSQL, authentication, backups and multi device sync

**High level flow**

```
React Frontend
      ↓
  IndexedDB
      ↓
 Sync Queue
      ↓
Express API
      ↓
Supabase Database
```

---

## 4. User Roles

**Admin**
Full access. Manages products, inventory, cashiers, business settings and views all reports.

**Cashier**
Limited access. Processes sales, prints receipts, searches products and handles returns. Cannot delete products, manage users or view sensitive reports.

---

## 5. Folder Structure With File Purpose

### 5.1 Frontend

```
src/
├── app/
│   └── App.jsx                  Root component, wraps routes, providers and layout shell
│
├── assets/                      Static images, icons, logo files
│
├── components/
│   ├── ui/
│   │   ├── Button.jsx           Reusable button with variants (primary, secondary, danger)
│   │   ├── Input.jsx            Reusable text input with label and error state
│   │   ├── Badge.jsx            Status badges (in stock, low stock, out of stock)
│   │   ├── Modal.jsx            Base modal wrapper used across confirm dialogs and forms
│   │   └── Toast.jsx            Notification toast for success, error and info messages
│   │
│   ├── forms/
│   │   ├── ProductForm.jsx      Create and edit product form
│   │   ├── StockAdjustForm.jsx  Add stock, remove stock, adjust stock form
│   │   └── CashierForm.jsx      Create and edit cashier account form
│   │
│   ├── tables/
│   │   ├── ProductTable.jsx     Lists products with search, filter and pagination
│   │   ├── SalesTable.jsx       Lists past sales with filters by date and cashier
│   │   └── InventoryTable.jsx   Lists current stock levels with reorder alerts
│   │
│   └── modals/
│       ├── ConfirmDeleteModal.jsx   Confirmation before destructive actions
│       └── ReceiptModal.jsx         Shows a printable receipt after a sale
│
├── pages/
│   ├── dashboard/
│   │   ├── AdminDashboard.jsx   Today's sales, weekly sales, monthly revenue, stock value, low stock alerts
│   │   └── CashierDashboard.jsx Today's sales, transaction count, recent transactions
│   │
│   ├── products/
│   │   ├── ProductsPage.jsx     Product list view with create, edit and archive actions
│   │   └── ProductDetail.jsx    Single product view with stock history
│   │
│   ├── inventory/
│   │   └── InventoryPage.jsx    Stock levels, add stock, remove stock, adjustment log
│   │
│   ├── sales/
│   │   ├── POSPage.jsx          The actual point of sale screen, product search, cart, checkout
│   │   ├── SalesHistoryPage.jsx List of completed sales
│   │   └── SaleDetailPage.jsx   Single sale breakdown, items, payment method, cashier, timestamp
│   │
│   ├── reports/
│   │   ├── DailySalesReport.jsx     Revenue, profit, transaction count for a chosen day
│   │   ├── ProductReport.jsx        Best sellers, slow movers, out of stock list
│   │   └── InventoryReport.jsx      Current inventory value, low stock products
│   │
│   └── settings/
│       ├── BusinessSettings.jsx     Business name, currency, tax rate, receipt footer text
│       └── UserSettings.jsx         Manage admin and cashier accounts
│
├── routes/
│   └── AppRoutes.jsx             Central route definitions, protected routes by role
│
├── hooks/
│   ├── useAuth.js                Current user, login, logout, role check
│   ├── useCart.js                POS cart state, add, remove, update quantity, clear
│   ├── useOfflineStatus.js       Detects online and offline state for the UI
│   └── useSyncStatus.js          Reads pending sync queue count and last sync time
│
├── services/
│   ├── api/
│   │   ├── authApi.js            Calls to /api/auth
│   │   ├── productsApi.js        Calls to /api/products
│   │   ├── salesApi.js           Calls to /api/sales
│   │   └── reportsApi.js         Calls to /api/reports
│   │
│   ├── sync/
│   │   ├── syncEngine.js         Reads the sync queue, pushes pending actions to the server in order
│   │   └── syncQueue.js          Adds, reads and clears entries in the IndexedDB sync queue
│   │
│   └── indexeddb/
│       ├── db.js                 IndexedDB schema definition and connection setup
│       ├── productsStore.js      CRUD operations against the local products table
│       ├── salesStore.js         CRUD operations against the local sales table
│       └── inventoryStore.js     CRUD operations against the local inventory logs table
│
├── store/
│   └── appStore.js               Lightweight global state (current shift, active cashier, theme)
│
├── utils/
│   ├── formatCurrency.js         Currency formatting helper
│   ├── generateInvoiceNumber.js  Creates unique invoice numbers for sales
│   └── validators.js             Shared form validation logic
│
├── layouts/
│   ├── AdminLayout.jsx           Sidebar and header wrapper for admin pages
│   └── CashierLayout.jsx         Simplified layout for the cashier facing POS screen
│
└── constants/
    └── roles.js                  Role definitions and permission constants
```

### 5.2 Backend

```
server/
├── config/
│   └── db.js                     Supabase and Postgres connection configuration
│
├── middleware/
│   ├── authMiddleware.js         Verifies login token and attaches user to request
│   └── roleMiddleware.js         Blocks routes based on admin or cashier role
│
├── controllers/
│   ├── authController.js         Login, logout, session handling logic
│   ├── productController.js      Create, update, archive, search products
│   ├── inventoryController.js    Add stock, remove stock, adjustment logic
│   ├── salesController.js        Create sale, list sales, sale detail, returns
│   ├── reportController.js       Daily, product and inventory report generation
│   └── syncController.js         Receives queued actions from the frontend and applies them
│
├── routes/
│   ├── authRoutes.js              /api/auth
│   ├── productRoutes.js           /api/products
│   ├── inventoryRoutes.js         /api/inventory
│   ├── salesRoutes.js             /api/sales
│   ├── reportRoutes.js            /api/reports
│   └── syncRoutes.js              /api/sync
│
├── services/
│   ├── productService.js          Business logic for product operations
│   ├── inventoryService.js        Business logic for stock adjustments
│   ├── salesService.js            Business logic for processing a sale and updating stock
│   └── syncService.js             Applies queued actions in the correct order, handles conflicts
│
├── validators/
│   ├── productValidator.js        Validates product payloads
│   └── saleValidator.js           Validates sale payloads before processing
│
├── utils/
│   └── logger.js                  Simple logging helper for server events
│
├── jobs/
│   └── backupJob.js                Scheduled backup task to Supabase
│
└── database/
    └── migrations/                 SQL migration files for Supabase tables
```

---

## 6. Database Schema

**users**
id, name, email, role, created_at

**products**
id, name, sku, barcode, category, cost_price, selling_price, quantity, created_at

**sales**
id, invoice_number, cashier_id, total, created_at

**sale_items**
id, sale_id, product_id, quantity, price, subtotal

**inventory_logs**
id, product_id, type, quantity, created_at

---

## 7. API Structure

```
/api/auth
/api/products
/api/inventory
/api/sales
/api/reports
/api/sync
```

---

## 8. Sync Queue Structure

Every offline action gets queued in this shape before it reaches the server.

```json
{
  "id": "queue_001",
  "action": "CREATE_SALE",
  "payload": {},
  "status": "pending",
  "createdAt": "timestamp"
}
```

Flow for every action:

```
Action happens (example, a sale is completed)
        ↓
Saved instantly to IndexedDB
        ↓
Added to sync queue
        ↓
Sync engine waits for internet
        ↓
Pushed to Express API
        ↓
Backed up to Supabase
```

---

## 9. Phased Build Plan

Each phase below is written as a prompt you can hand to a build tool or work through yourself, in order. Do not skip ahead, each phase depends on the one before it.

---

### Phase 1, Foundation and Authentication

**Goal:** get the project scaffolded, connect Supabase, and get login working for both roles.

**Prompt**

Set up a React and Vite project with Tailwind CSS configured. Set up an Express backend with a basic server file and folder structure matching the documented layout. Connect Supabase for authentication and as the eventual cloud database. Build the login page and session handling so both admin and cashier roles can log in, with role based redirects, admin to the admin dashboard, cashier to the POS screen. Set up protected routes so cashiers cannot access admin only pages. Do not build any POS or product features yet, this phase is only auth and project scaffolding.

---

### Phase 2, IndexedDB Layer and Offline Detection

**Goal:** build the local database layer before any feature depends on it.

**Prompt**

Set up the IndexedDB schema covering products, sales, inventory logs, customers and a sync queue table. Build the service layer functions for each store, create, read, update and delete operations that work fully offline. Build a hook that detects online and offline status and displays it clearly in the UI, a small indicator in the header is enough for now. Do not connect this to the server yet, this phase is local storage only.

---

### Phase 3, Product and Inventory Management

**Goal:** let the admin manage products and stock, fully offline first.

**Prompt**

Build the product management pages, list, create, edit and archive products, all writing to IndexedDB first. Build the inventory management page, add stock, remove stock and stock adjustment, with a log of every change. Add low stock and reorder level tracking. Every action taken here should also be added to the sync queue for later syncing, even though the sync engine itself is not built yet. Build proper empty states for when there are no products or no stock movements yet.

---

### Phase 4, POS Module

**Goal:** the actual point of sale screen, the core of the whole app.

**Prompt**

Build the POS page, product search by name and barcode, add to cart, adjust quantity, apply discounts, apply tax, and checkout. On checkout, save the sale and sale items to IndexedDB immediately, generate an invoice number, and reduce product stock accordingly. Build a receipt view that appears right after checkout, showing invoice number, itemized list, totals, payment method and timestamp, with the option to print. This entire flow must work with zero internet connection.

---

### Phase 5, Sales History and Reports

**Goal:** give admins visibility into what has been sold and how the business is performing.

**Prompt**

Build the sales history page, listing past sales with filters by date and cashier, and a sale detail page showing the full breakdown of any past sale. Build the reports module covering daily sales (revenue, profit, transaction count), product reports (best sellers, slow movers, out of stock) and inventory reports (current inventory value, low stock products). All of this should read from IndexedDB, since we are still fully local at this stage.

---

### Phase 6, Sync Engine and Backend Connection

**Goal:** connect the local first app to the cloud, this is the phase that makes the whole offline first idea real.

**Prompt**

Build the Express API routes and controllers for products, inventory, sales, reports and sync, matching the documented API structure. Build the sync engine on the frontend that reads the pending sync queue and pushes actions to the server in the order they were created, whenever the app detects it is back online. Build the corresponding sync controller and service on the backend that receives these queued actions and applies them to Supabase. Handle basic conflict cases, for example if a sync fails partway through, it should retry rather than skip. Add a visible sync status indicator in the UI showing pending items and last successful sync time.

---

### Phase 7, User Management and Business Settings

**Goal:** let the admin manage cashiers and configure the business.

**Prompt**

Build the user settings page where the admin can create, edit and deactivate cashier accounts, with role enforcement so cashiers cannot reach this page. Build the business settings page, business name, currency, tax rate and receipt footer text, all of which should reflect immediately across the POS and receipt.

---

### Phase 8, Polish Pass

**Goal:** take the working app and make it feel like a real commercial product, not a prototype.

**Prompt**

Refine the UI across every page, consistent spacing, clear typography and a cohesive color system. Add hover and press animations on buttons, table rows and cards. Add toast notifications for key actions, sale completed, stock updated, sync completed, sync failed. Design proper empty states everywhere data can be missing, no products, no sales yet, no low stock alerts. Add a dark mode toggle that applies across the entire app, admin and cashier views. Make sure the POS screen in particular feels fast and satisfying to use, since that is the page cashiers will use all day.

---

## 10. Future Roadmap, Beyond the Core Build

**Phase 9, Business Features**
Customer accounts, supplier management, purchase orders.

**Phase 10, Advanced Features**
Multi store support, warehouse transfers, loyalty system.

**Phase 11, AI Features**
Sales forecasting, demand prediction, restock recommendations. Example outputs, "Rice stock will likely run out in 5 days" or "Soft drinks sales increased by 18 percent this week."

---

## 11. What This Repo Should Prove to Anyone Looking at It

- Real offline first architecture, not just a claim in the README
- Clean separation between local storage, sync logic and server code
- Proper React state and data architecture using IndexedDB and TanStack Query together
- A REST API that is simple, readable and well organized
- Documentation quality that shows you think about maintainability, not just working code
- A finished product that reads like something a real shop could actually use, not a tutorial clone

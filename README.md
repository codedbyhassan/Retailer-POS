# Retailer POS

Retailer POS is an offline-first point-of-sale and inventory management application built for small retail businesses. It is designed to help store teams manage products, process sales, track stock levels, and review daily performance without relying entirely on a constant internet connection.

The application combines a modern React front end with an Express-based backend and browser-based storage, making it practical for retail environments where uptime and reliability matter.

## Why This App Exists

Retail businesses need a simple tool that can:

- Process customer transactions quickly at the point of sale
- Keep product inventory accurate in real time
- Support business owners with reports and sales visibility
- Continue functioning when the connection is weak or temporarily unavailable

## Core Features

- Point-of-sale checkout flow with cart management
- Product catalog management with SKU, barcode, category, and pricing
- Inventory adjustments and stock monitoring
- Sales history and transaction review
- Reporting for daily revenue, margins, and store performance
- Offline-first local storage with sync support for later reconciliation
- Admin and cashier role separation

## How the App Works

### 1. User access and authentication

Users sign in through the authentication flow. The app supports separate roles for administrators and cashiers, with different access to dashboard and operational screens.

### 2. Point-of-sale experience

The POS screen allows staff to:

- Search products by name, SKU, or barcode
- Add items to the cart
- Adjust quantities
- Complete checkout
- Record the sale locally and update inventory automatically

### 3. Inventory and product management

Administrators can manage the catalog by creating, editing, archiving, and restocking products. Inventory changes are logged for audit purposes and help maintain accuracy across the store.

### 4. Reporting and visibility

The reporting area summarizes business activity, including revenue, sales count, stock value, and profit-related metrics so owners can monitor performance quickly.

### 5. Offline-first data handling

The app uses local browser storage to keep operations working even when the internet is unavailable. When the connection is restored, queued changes can be synchronized with the backend.

## Architecture Overview

The project is organized into two main layers:

- Frontend: React and TypeScript components under the `src/` directory
- Backend: Express routes and controllers under the `server/` directory

### Frontend

The frontend is responsible for:

- Rendering the user interface
- Managing authentication state
- Handling POS workflows
- Displaying inventory, sales, and reports
- Interacting with local storage and sync services

### Backend

The backend provides:

- API endpoints for authentication, inventory, products, sales, reports, settings, and sync
- Server-side storage logic for application data
- Support for persistence and synchronization workflows

### Storage Model

The app uses:

- IndexedDB for local offline-first persistence
- Server-backed data flow for synchronized state
- A sync queue to capture local changes until they are safely transmitted

## Tech Stack

- Frontend: React, TypeScript, Vite
- UI: Component-based interface with Lucide icons and utility-based styling
- Backend: Express.js
- Data layer: IndexedDB with local sync support
- Runtime: Node.js

## Project Structure

```text
src/
  components/        # Main application screens and UI panels
  hooks/             # Reusable React hooks for auth, sync, and UI state
  services/          # Local storage and synchronization logic
  types.ts           # Shared TypeScript interfaces

server/
  controllers/       # API handlers for app features
  routes/            # Express route definitions
  services/          # Business logic and integration points
  config/            # Server configuration and default data
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the local URL displayed in the terminal in your browser

### Demo Credentials

- Admin: `admin@retailer.com` / `admin123`
- Cashier: `cashier@retailer.com` / `cashier123`

## Build for Production

Create a production build with:

```bash
npm run build
```

The build output is generated in the `dist/` directory.

## Development Notes

- The application is designed to work in a browser environment with local persistence
- The offline experience is intentional and should be tested in low-connectivity scenarios
- Sync operations are handled through the application’s queued data flow

## License

This project is intended for internal business use and demonstration purposes.

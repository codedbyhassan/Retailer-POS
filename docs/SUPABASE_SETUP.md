# Supabase Integration Setup Guide

This guide walks you through setting up Supabase as the cloud backend for Retailer-POS, enabling seamless data synchronization across devices and secure multi-user access.

## Prerequisites

- Supabase account (free tier available at https://supabase.com)
- Retailer-POS project running locally or deployed
- Basic familiarity with PostgreSQL/SQL

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in to your account
2. Click **New Project**
3. Fill in project details:
   - **Name**: e.g., "Retailer-POS"
   - **Database Password**: Generate a secure password (save this!)
   - **Region**: Choose closest to your location
4. Wait for project initialization (2-3 minutes)
5. Navigate to **Project Settings** → **API** and copy:
   - **Project URL** (SUPABASE_URL)
   - **anon public key** (SUPABASE_ANON_KEY)
   - **service_role secret** (SUPABASE_SERVICE_ROLE_KEY)

## Step 2: Configure Environment Variables

### Frontend (.env or .env.local in root)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BARCODE_API_KEY=your-barcode-api-key  # Optional: from barcodelookup.com
```

### Backend (server/.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Create Database Schema

Run the following SQL in the Supabase SQL Editor to create all required tables:

```sql
-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  category VARCHAR(100),
  cost_price DECIMAL(10, 2),
  selling_price DECIMAL(10, 2) NOT NULL,
  quantity INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  image_id TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(archived);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  cashier_id TEXT NOT NULL,
  subtotal DECIMAL(10, 2),
  discount DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  tax_rate DECIMAL(5, 2),
  tax_amount DECIMAL(10, 2),
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2),
  product_name VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Inventory logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);

-- Sync queue table (for tracking what's been synced)
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempt_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);

-- Grant public access (no RLS for MVP - add later for production)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for MVP - restrict in production)
CREATE POLICY "Allow all products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all inventory_logs" ON inventory_logs FOR ALL USING (true) WITH CHECK (true);
```

## Step 4: Enable Realtime (Optional but Recommended)

1. Go to **Database** → **Realtime** in Supabase
2. Click **Enable Realtime** for these tables:
   - products
   - sales
   - inventory_logs

This enables live updates across devices when inventory changes.

## Step 5: Test Connection

Run this in the browser console to verify connection:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
);

const { data, error } = await supabase.from('products').select('*').limit(1);
console.log('Connection test:', error || 'Success!', data);
```

## Step 6: Deploy Changes

After setting up the schema, restart your app:

```bash
# Frontend
npm run dev

# Backend  
cd server && npm run dev
```

## Sync Conflict Resolution

If the same record is updated on two devices simultaneously:

1. **Client-side (IndexedDB)**: Keeps local version until server responds
2. **Server-side (Supabase)**: Uses `updated_at` timestamp, newer version wins
3. **Resolution**: Server sends back the canonical version, client reconciles

Example conflict:
- Device A updates Product#123 at 10:00
- Device B updates same product at 10:01
- Device B's change syncs first (10:01 > 10:00), becomes canonical
- Device A receives 10:01 version on next sync, updates local IndexedDB

## Rate Limiting & Sync Behavior

- **Sync interval**: 30 seconds (configurable in syncEngine.js)
- **Rate limits** (enforced server-side):
  - 50 sync requests/minute per user
  - 10 barcode lookups/minute per user
- **Offline mode**: All operations work offline, synced when reconnected
- **Retry logic**: Failed syncs retry with exponential backoff (max 5 attempts)

## Monitoring & Troubleshooting

### Check Sync Status
- Look for "Synced X ago" indicator on dashboard
- Check browser console for `[v0]` logs

### View Sync Errors
```javascript
// In browser console
const pending = await db.syncQueue.toArray();
pending.filter(p => p.status === 'failed');
```

### Clear Sync Queue (if stuck)
```javascript
// Only do this if absolutely necessary!
await db.syncQueue.clear();
```

### Verify Supabase Data
In Supabase dashboard:
1. Click **SQL Editor**
2. Run: `SELECT COUNT(*) FROM sales;`
3. Compare count with local IndexedDB

## Backup & Recovery

### Automatic Backups
Supabase performs daily backups (free tier keeps 7 days). Access in:
- Settings → Backups

### Manual Backup
```bash
# Export via pg_dump (requires pg_dump installed)
pg_dump postgresql://user:password@host/database > backup.sql
```

## Production Considerations

1. **Enable Row Level Security (RLS)** - Restrict data by user
2. **Set up Auth** - Use Supabase Auth for user management
3. **SSL Certificates** - All connections use SSL by default
4. **Connection Pooling** - Enable pgBouncer for high traffic
5. **Monitoring** - Set up alerts in Supabase dashboard

## Pricing

| Feature | Free Tier | Pricing |
|---------|-----------|---------|
| Database Storage | 500 MB | $0.25/MB over |
| Monthly Bandwidth | 5 GB | $0.09/GB over |
| Simultaneous Connections | 100 | Unlimited |
| Backups | 7 days | Paid plans |

Free tier is suitable for small retailers (< 100k transactions/month).

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Community**: https://discord.supabase.com
- **Issues**: GitHub Issues in retailer-pos repo

## Next Steps

1. After Supabase setup, restart the application
2. Test a sale transaction (should sync to Supabase)
3. Monitor sync status on dashboard
4. Set up automated backups in production

# Getting Started - Retailer POS

## Quick Start (Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.development.local`:
```env
VITE_API_URL=http://localhost:3000/api
DATABASE_URL=postgresql://user:password@host/database
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
NODE_ENV=development
LOG_LEVEL=debug
```

### 3. Initialize Database with Demo Users
```bash
npm run init:db
```

This creates:
- **Admin User**: `admin@retailer.com` / `admin123`
- **Cashier User**: `cashier@retailer.com` / `cashier123`
- **Sample Products**: 5 products for testing

### 4. Start Development Server

**Terminal 1 - Backend** (Port 3000):
```bash
npm run start:dev
```

**Terminal 2 - Frontend** (Port 5173):
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Signing In

### Login Credentials

After running `npm run init:db`, use these credentials:

**Admin Account**:
- Email: `admin@retailer.com`
- Password: `admin123`

**Cashier Account**:
- Email: `cashier@retailer.com`
- Password: `cashier123`

### What Can Each Role Do?

**Admin**:
- Access all features
- Manage products and inventory
- Create/edit/delete users
- View all reports
- Configure settings
- View admin dashboard

**Cashier**:
- Process sales (POS)
- View their own sales history
- Limited inventory view
- Cannot manage users or settings

---

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub:
```bash
git push origin main
```

2. Connect to Vercel:
   - Go to https://vercel.com
   - Import project from GitHub
   - Set environment variables (see below)
   - Deploy

3. Set Production Environment Variables:
   - `DATABASE_URL` - Your Neon PostgreSQL URL
   - `BETTER_AUTH_SECRET` - Min 32 character secret (use `openssl rand -base64 32`)
   - `NODE_ENV` - Set to `production`

4. Verify Deployment:
   - Visit your Vercel domain
   - Login with your credentials
   - Test POS and reporting features

---

## Create New Users

### Via CLI (Development)

Create a simple script `scripts/create-user.js`:

```javascript
import 'dotenv-expand/config.js';
import { db } from '../server/db/index.js';
import { users } from '../server/db/schema.js';
import { hashPassword } from '../server/utils/auth.js';
import crypto from 'crypto';

const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || 'cashier';
const name = process.argv[5] || email.split('@')[0];

if (!email || !password) {
  console.log('Usage: node scripts/create-user.js <email> <password> [role] [name]');
  process.exit(1);
}

async function createUser() {
  try {
    const hashedPassword = await hashPassword(password);
    const userId = `usr_${crypto.randomBytes(12).toString('hex')}`;
    
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      name,
      role: role === 'admin' ? 'admin' : 'cashier',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    console.log(`✅ User created: ${email} (${role})`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUser();
```

Usage:
```bash
node scripts/create-user.js john@store.com password123 cashier "John Doe"
node scripts/create-user.js manager@store.com securepass admin "Store Manager"
```

### Via Admin Dashboard (Production)

1. Login as Admin
2. Go to Admin Dashboard
3. Click "Manage Users"
4. Click "Add New User"
5. Enter email, password, name, and role
6. Click "Create User"

---

## Troubleshooting

### Login Fails

**Issue**: "Invalid email or password"

**Solutions**:
- Check email is exactly: `admin@retailer.com` or `cashier@retailer.com`
- Check password is: `admin123` or `cashier123`
- Run `npm run init:db` to create demo users
- Check database connection in server logs

### Backend Connection Error

**Issue**: Cannot reach API at localhost:3000

**Solutions**:
- Ensure backend is running: `npm run start:dev`
- Check VITE_API_URL in .env.development.local
- Check firewall/ports
- Look for errors in terminal running backend

### Database Connection Error

**Issue**: "Cannot connect to database"

**Solutions**:
- Verify DATABASE_URL is correct
- Test connection: `psql $DATABASE_URL`
- Ensure PostgreSQL is running
- Check firewall rules
- Run `npm run init:db` to initialize schema

### Session Keeps Expiring

**Issue**: Logged out after 15 minutes

**This is normal** - Access tokens expire after 15 minutes. The app automatically refreshes them using the refresh token. If you see this:
- Check browser console for errors
- Verify BETTER_AUTH_SECRET is set
- Check network tab for 401 responses

---

## Features Overview

### Point of Sale (POS)
- Search products by name, SKU, or barcode
- Add items to cart
- Adjust quantities
- Apply discounts (admin feature)
- Checkout with multiple payment methods
- Print receipt

### Inventory Management
- View product catalog
- Edit product details
- Adjust stock levels
- Set reorder alerts
- Track inventory history

### Sales & Reports
- View transaction history
- Filter by date, payment method
- Generate revenue reports
- Inventory valuation reports
- Daily summaries

### Admin Features
- User management (create, edit, deactivate)
- Product management
- System settings
- Activity logs
- Business configuration

### Offline Capabilities
- Works without internet
- Caches data locally in browser
- Auto-syncs when connection restored
- Queue management for offline transactions

---

## Need Help?

Check these files for more details:
- **README.md** - Full feature documentation
- **PRODUCTION.md** - Deployment checklist
- **DEPLOYMENT_SUMMARY.md** - Live deployment info
- **COMPLETION_REPORT.md** - Project summary

Questions? Check server logs:
```bash
tail -f logs/combined.log
```

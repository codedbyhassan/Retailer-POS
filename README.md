# Retailer POS - Production-Ready Point of Sale System

A modern, offline-first Point of Sale (POS) system built with React 19, TypeScript, Express.js, and PostgreSQL. Designed for retail businesses with enterprise-grade security, role-based access control, and comprehensive offline-first capabilities.

**Status**: ✅ Production Ready | **Version**: 2.0.0 | **Last Updated**: July 2026

## Key Highlights

🚀 **Production Migration Complete**
- Migrated from JSON file storage to PostgreSQL (Neon)
- Implemented bcrypt password hashing and JWT authentication
- Added Helmet security middleware, CORS, and rate limiting
- Comprehensive structured logging with Winston
- Graceful shutdown and global error handling

🎨 **Modern iOS-Style Material UI**
- Clean, intuitive navigation with Material Design principles
- Responsive design that works on desktop, tablet, and mobile
- Smooth animations and transitions with Framer Motion
- Real-time sync status and connection indicators

🔐 **Enterprise Security**
- JWT authentication with refresh token rotation
- Role-based access control (Admin/Cashier)
- Joi schema validation on all endpoints
- Helmet security headers (HSTS, CSP, X-Frame-Options)
- DDoS protection with rate limiting

## Core Features

### Point of Sale
✅ Fast checkout with cart management
✅ Multiple payment methods (Cash, Card, Mobile Money)
✅ Real-time inventory updates
✅ Receipt generation and printing
✅ Customer transaction history

### Product & Inventory Management
✅ Complete product catalog with SKU and barcode
✅ Dynamic pricing and cost tracking
✅ Stock level monitoring with reorder alerts
✅ Inventory adjustment logging for audit trail
✅ Product categorization and search

### Sales & Reports
✅ Comprehensive sales history with filtering
✅ Daily revenue and margin reports
✅ Inventory valuation reports
✅ Performance metrics and KPIs
✅ Exportable reports

### Offline & Sync
✅ Full offline functionality with IndexedDB
✅ Automatic sync when connection restored
✅ Sync queue with pending operation tracking
✅ Conflict resolution with server-authoritative strategy
✅ Real-time connection status indicator

### Admin Dashboard
✅ User management (create, edit, deactivate)
✅ Role-based permissions enforcement
✅ System settings configuration
✅ Audit logs and activity tracking
✅ Business settings management

## Tech Stack

### Frontend
```
React 19 + TypeScript
Vite (bundler & dev server)
Tailwind CSS (styling)
Framer Motion (animations)
Lucide React (icons)
IndexedDB (offline storage)
```

### Backend
```
Node.js + Express.js
PostgreSQL (via Neon)
Drizzle ORM (type-safe queries)
JWT (authentication)
Bcryptjs (password hashing)
Winston (logging)
Helmet (security)
```

### Database
```
PostgreSQL (Neon serverless)
Connection pooling with pg
Drizzle migrations support
ACID transaction support
```

## Project Structure

```
Retailer-POS/
├── src/                              # Frontend source
│   ├── components/
│   │   ├── LoginPage.tsx            # Authentication UI
│   │   ├── POSPage.tsx              # Main POS interface
│   │   ├── ProductsPage.tsx         # Product management
│   │   ├── InventoryPage.tsx        # Stock management
│   │   ├── SalesHistoryPage.tsx     # Transaction history
│   │   ├── ReportsPage.tsx          # Analytics
│   │   ├── AdminDashboard.tsx       # Admin panel
│   │   └── SettingsPage.tsx         # App settings
│   ├── hooks/
│   │   ├── useAuth.ts               # Auth state & login
│   │   ├── useCart.ts               # Shopping cart
│   │   ├── useOfflineStatus.ts      # Connection status
│   │   └── useSyncStatus.ts         # Sync tracking
│   ├── services/
│   │   ├── api.ts                   # API client (NEW)
│   │   ├── indexeddb/db.ts          # Local database
│   │   └── sync/syncEngine.ts       # Offline sync
│   ├── types.ts                     # TypeScript interfaces
│   ├── App.tsx                      # Root component (REBUILT)
│   └── main.tsx                     # Entry point
│
├── server/                           # Backend source
│   ├── index.js                     # Express app (UPDATED)
│   ├── db/
│   │   ├── index.js                # Drizzle setup
│   │   └── schema.js               # DB schema (NEW)
│   ├── routes/
│   │   ├── authRoutes.js           # Auth endpoints (UPDATED)
│   │   ├── productRoutes.js        # Products (UPDATED)
│   │   ├── inventoryRoutes.js
│   │   ├── salesRoutes.js
│   │   └── syncRoutes.js
│   ├── controllers/
│   │   ├── authController.js       # Auth logic (REWRITTEN)
│   │   ├── productController.js    # Product logic (UPDATED)
│   │   └── salesController.js
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification (UPDATED)
│   │   ├── securityMiddleware.js   # Security (NEW)
│   │   └── errorHandler.js
│   ├── utils/
│   │   ├── auth.js                 # Crypto utilities (NEW)
│   │   ├── logger.js               # Winston logging (UPDATED)
│   │   └── validators/productValidator.js (UPDATED)
│   └── scripts/
│       └── init-db.js              # DB initialization (NEW)
│
├── .env                             # Environment variables
├── .env.example                     # Template
├── .env.development.local           # Dev config (UPDATED)
├── package.json                     # Dependencies (UPDATED)
├── vite.config.ts                  # Vite config
├── tsconfig.json                   # TypeScript config
├── tailwind.config.ts              # Tailwind config
├── PRODUCTION.md                   # Production guide
├── PRODUCTION_READINESS_REPORT.md # Detailed report
├── MIGRATION_SUMMARY.md            # Migration details
└── README.md                       # This file
```

## Security Features

### Authentication & Authorization
- ✅ JWT tokens (15-minute access, 7-day refresh)
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Role-based access control (Admin/Cashier)
- ✅ Token refresh on 401 responses
- ✅ Session management with localStorage

### API Security
- ✅ Helmet security headers
- ✅ CORS with configurable origins
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ CSP (Content Security Policy)
- ✅ X-Frame-Options (Clickjacking protection)
- ✅ Rate limiting (100 req/15min general, 5 req/15min auth)
- ✅ Input validation with Joi schemas
- ✅ SQL injection prevention via Drizzle ORM

### Data Protection
- ✅ Server-side password hashing
- ✅ No sensitive data in logs
- ✅ Parameterized queries
- ✅ Per-user data scoping
- ✅ ACID transactions

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (Neon recommended)
- Git

### Quick Start

1. **Clone repository**
   ```bash
   git clone https://github.com/codedbyhassan/Retailer-POS.git
   cd Retailer-POS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.development.local
   ```

   Update `.env.development.local`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   DATABASE_URL=postgresql://user:password@host/dbname
   BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
   NODE_ENV=development
   LOG_LEVEL=debug
   ```

4. **Initialize database**
   ```bash
   npm run init:db
   ```

5. **Start development**

   Terminal 1 - Backend:
   ```bash
   npm run start:dev
   ```

   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

   Open `http://localhost:5173` in your browser

### Demo Credentials
- **Admin**: admin@retailer.com / admin123
- **Cashier**: cashier@retailer.com / cashier123

## API Endpoints

### Authentication
```
POST   /api/auth/login              # Login user
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/logout             # Logout
GET    /api/auth/me                 # Current user
```

### Products
```
GET    /api/products                # List products
POST   /api/products                # Create product
PUT    /api/products/:id            # Update product
```

### Sales
```
GET    /api/sales                   # Sales history
POST   /api/sales                   # Record sale
```

### Inventory
```
GET    /api/inventory               # Inventory logs
POST   /api/inventory/adjust        # Adjust stock
```

### Reports
```
GET    /api/reports/sales           # Sales report
GET    /api/reports/inventory       # Inventory report
```

### Admin
```
GET    /api/users                   # List users
POST   /api/users                   # Create user
PUT    /api/users/:id               # Update user
```

## Production Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Import project from GitHub
   - Set environment variables:
     - `DATABASE_URL` - Neon PostgreSQL URL
     - `BETTER_AUTH_SECRET` - Min 32 character secret
     - `NODE_ENV` - Set to `production`

3. **Deploy**
   - Vercel auto-deploys on push to main

### Database Setup (Neon)

1. Create Neon account at neon.tech
2. Create new PostgreSQL project
3. Copy connection string to `DATABASE_URL`
4. Run migrations through API

### Environment Variables (Production)
```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
NODE_ENV=production
LOG_LEVEL=error
ALLOWED_ORIGINS=https://yourdomain.com
PORT=3000
```

## Troubleshooting

### Connection Issues
```bash
# Test database connection
psql $DATABASE_URL

# Check if backend is running
curl http://localhost:3000/health
```

### Authentication Errors
- Clear localStorage: `localStorage.clear()`
- Check token expiration
- Verify BETTER_AUTH_SECRET is set
- Check browser console for JWT errors

### Sync Issues
- Verify backend is online
- Check /api/sync endpoint
- Review browser IndexedDB
- Check server logs: `tail -f logs/combined.log`

### Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm run clean
npm run build
```

## Performance Optimization

- ✅ Code splitting with Vite
- ✅ Lazy loading of routes
- ✅ Database connection pooling
- ✅ IndexedDB for local caching
- ✅ Gzip compression
- ✅ CSS minification with Tailwind

## Monitoring & Logging

### Log Files
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs
- Set `LOG_LEVEL` in .env to debug

### Health Check
```bash
curl http://localhost:3000/health
```

## Roadmap

- [ ] Multi-location support
- [ ] Inventory forecasting
- [ ] Customer loyalty programs
- [ ] Payment gateway integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Multi-currency support
- [ ] Barcode scanning optimization
- [ ] Email receipts
- [ ] API documentation (Swagger)

## Contributing

1. Create feature branch
2. Make changes
3. Commit with descriptive messages
4. Push and create Pull Request

## License

Proprietary - All rights reserved

## Support

For issues or questions:
- Email: support@retailer.com
- GitHub Issues: https://github.com/codedbyhassan/Retailer-POS/issues

## Changelog

### v2.0.0 - Production Migration (July 2026)
- ✅ Migrated database from JSON to PostgreSQL
- ✅ Implemented JWT authentication with bcrypt
- ✅ Added comprehensive security middleware
- ✅ Built new API client with token management
- ✅ Implemented structured logging with Winston
- ✅ Added role-based access control
- ✅ Rewrote frontend with iOS Material UI design
- ✅ Added Drizzle ORM for type-safe queries
- ✅ Implemented graceful shutdown handling
- ✅ Added database initialization script

### v1.0.0 - Initial Release
- Initial POS functionality
- Offline-first architecture
- IndexedDB local storage

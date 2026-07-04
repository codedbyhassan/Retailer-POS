# Retailer POS - Production Deployment Guide

## 🚀 Overview

This guide covers the migration from development to production for the Retailer POS application. The app now uses:

- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet headers, CORS, rate limiting, input validation
- **Logging**: Winston structured logging
- **Error Handling**: Comprehensive error handling with graceful shutdown

## 📋 Checklist Before Production

### Environment Setup

- [ ] Set `BETTER_AUTH_SECRET` to a secure 32+ character random string
- [ ] Set `NODE_ENV` to `production`
- [ ] Configure `ALLOWED_ORIGINS` for your production domain
- [ ] Ensure `DATABASE_URL` points to production PostgreSQL database
- [ ] Set `LOG_LEVEL` to `info` or `warn` in production

### Security

- [ ] HTTPS/TLS enabled on production domain
- [ ] Database credentials stored securely (never in code)
- [ ] API rate limiting configured
- [ ] CORS properly configured for your domain only
- [ ] Security headers (Helmet) enabled
- [ ] Input validation on all endpoints
- [ ] RBAC (role-based access control) enforced

### Database

- [ ] All tables created in production database
- [ ] Initial admin user created
- [ ] Backup strategy in place
- [ ] Database connection pooling configured

### Deployment

- [ ] Application builds without errors
- [ ] All environment variables set in production
- [ ] Graceful shutdown handling in place
- [ ] Monitoring and logging configured
- [ ] Error tracking (Sentry) configured

## 🔧 Setup Instructions

### 1. Environment Variables

Create a `.env` file in production with:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/retailerpos

# Authentication
BETTER_AUTH_SECRET=your-secure-random-32-char-string-here

# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Error tracking
SENTRY_DSN=your-sentry-dsn-here
```

### 2. Generate BETTER_AUTH_SECRET

```bash
openssl rand -base64 32
```

### 3. Initialize Database

The database schema is pre-created via Neon MCP. To seed demo data:

```bash
npm run init:db
```

This creates:
- Admin user: `admin@retailerpos.local` / `admin123`
- Cashier user: `cashier@retailerpos.local` / `cashier123`
- 5 demo products

**Important**: Change these credentials immediately in production!

### 4. Build and Deploy

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

## 🔐 Authentication Flow

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@retailerpos.local",
  "password": "admin123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_xxx",
    "name": "Admin User",
    "email": "admin@retailerpos.local",
    "role": "admin"
  }
}
```

### Using Access Token

Include the JWT in all subsequent requests:

```bash
GET /api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh Token

When access token expires, use refresh token:

```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login (no auth required)
- `POST /api/auth/refresh` - Refresh access token (no auth required)
- `POST /api/auth/logout` - Logout (auth required)
- `GET /api/auth/me` - Get current user (auth required)

### Users (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

### Products (Auth Required)
- `GET /api/products` - List products
- `POST /api/products` - Create product

### Other Modules
- `/api/inventory/*` - Inventory management
- `/api/sales/*` - Sales transactions
- `/api/reports/*` - Reporting
- `/api/sync/*` - Offline sync
- `/api/settings/*` - Settings

## 🔍 Health Check

```bash
curl https://yourdomain.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## 📝 Logging

Logs are written to:
- **Console**: In development and production
- **Files**: In `logs/` directory
  - `logs/error.log` - Error-level logs only
  - `logs/combined.log` - All logs

Log levels:
- `error` - Critical errors
- `warn` - Warnings
- `info` - General information
- `http` - HTTP requests
- `debug` - Debug information

Set `LOG_LEVEL` environment variable to control verbosity.

## ⚙️ Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP

Adjust in `server/middleware/securityMiddleware.js` if needed.

## 🛡️ Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Rotate secrets**: Change `BETTER_AUTH_SECRET` periodically
3. **Monitor logs**: Check logs for suspicious activity
4. **Keep dependencies updated**: Run `npm audit` regularly
5. **Use HTTPS**: Always use HTTPS in production
6. **Backup database**: Daily automated backups
7. **Test auth flows**: Verify role-based access works correctly

## 🚨 Troubleshooting

### Token Verification Errors
- Check `BETTER_AUTH_SECRET` matches between environments
- Ensure token is not expired (15 minutes for access tokens)
- Use refresh token to get new access token

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check database credentials
- Ensure database is accessible from server
- Check firewall/security groups

### Rate Limiting
- If you're getting "Too many requests", wait 15 minutes
- Check IP address being used (proxies may cause issues)
- Adjust rate limits in `server/middleware/securityMiddleware.js`

### CORS Errors
- Verify origin is in `ALLOWED_ORIGINS`
- Check browser console for specific error message
- Ensure credentials: true if needed

## 📞 Support

For issues or questions, check:
1. Application logs in `logs/combined.log`
2. Error responses from API
3. This documentation

## 🔄 Maintenance

### Update User Credentials
```javascript
// From database directly
UPDATE users SET password_hash='$2b$10$...' WHERE id='usr_xxx';
```

### Check Active Licenses
```javascript
SELECT * FROM users WHERE active = true;
```

### View Recent Logs
```bash
tail -f logs/combined.log
```

## 📦 Database Schema

See `server/db/schema.js` for complete schema definition.

Main tables:
- `users` - User accounts with password hashes
- `products` - Product inventory
- `sales` - Sales transactions
- `sale_items` - Items in each sale
- `inventory_logs` - Inventory change history
- `sync_logs` - Offline sync history

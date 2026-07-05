import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import barcodeRoutes from './routes/barcodeRoutes.js';
import { logger } from './utils/logger.js';
import { syncRateLimiter, barcodeRateLimiter } from './middleware/rateLimitMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sync', syncRateLimiter, syncRoutes);
app.use('/api/barcode', barcodeRateLimiter, barcodeRoutes);

app.use((err, _req, res, _next) => {
  logger('error', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  logger('info', `Retailer API running on port ${PORT}`);
});

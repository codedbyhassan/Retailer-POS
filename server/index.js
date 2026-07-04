import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import 'dotenv-expand/config.js';

// Routes imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Middleware imports
import logger, { requestLogger } from './utils/logger.js';
import {
  securityHeaders,
  corsMiddleware,
  apiLimiter,
  authLimiter,
  errorHandler,
  notFoundHandler,
} from './middleware/securityMiddleware.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Security middleware
  app.use(securityHeaders);
  app.use(corsMiddleware);

  // JSON and URL parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger middleware
  app.use(requestLogger);

  // Apply rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // Mount API routes
  app.use('/api', authRoutes); // handles /api/auth/*, /api/users/*, /api/register
  app.use('/api/products', productRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/settings', settingsRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount Vite development server when in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  // Graceful shutdown
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Full-stack Retailer POS running on port ${PORT}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});

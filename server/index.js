import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Routes imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Middleware / Utils imports
import { requestLogger } from './utils/logger.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger middleware
  app.use(requestLogger);

  // Mount API routes
  app.use('/api', authRoutes); // handles /api/auth/* and /api/users/*
  app.use('/api/products', productRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/settings', settingsRoutes);

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Full-stack Retailer app running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Failed to start server:', err);
});

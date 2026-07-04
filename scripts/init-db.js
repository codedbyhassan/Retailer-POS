import 'dotenv-expand/config.js';
import { db } from '../server/db/index.js';
import { users, products } from '../server/db/schema.js';
import { hashPassword } from '../server/utils/auth.js';
import crypto from 'crypto';

/**
 * Initialize database with demo data
 */
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Create demo admin user
    const adminId = `usr_${crypto.randomBytes(12).toString('hex')}`;
    const adminPassword = await hashPassword('admin123');

    await db.insert(users).values({
      id: adminId,
      name: 'Admin User',
      email: 'admin@retailer.com',
      password_hash: adminPassword,
      role: 'admin',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('✅ Admin user created');
    console.log('   Email: admin@retailer.com');
    console.log('   Password: admin123');

    // Create demo cashier user
    const cashierId = `usr_${crypto.randomBytes(12).toString('hex')}`;
    const cashierPassword = await hashPassword('cashier123');

    await db.insert(users).values({
      id: cashierId,
      name: 'Cashier User',
      email: 'cashier@retailer.com',
      password_hash: cashierPassword,
      role: 'cashier',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('✅ Cashier user created');
    console.log('   Email: cashier@retailer.com');
    console.log('   Password: cashier123');

    // Create demo products
    const demoProducts = [
      { name: 'Laptop', sku: 'LAPTOP-001', category: 'Electronics', price: 999.99, quantity_in_stock: 10 },
      { name: 'Mouse', sku: 'MOUSE-001', category: 'Accessories', price: 29.99, quantity_in_stock: 50 },
      { name: 'Keyboard', sku: 'KB-001', category: 'Accessories', price: 79.99, quantity_in_stock: 30 },
      { name: 'Monitor', sku: 'MON-001', category: 'Electronics', price: 299.99, quantity_in_stock: 5 },
      { name: 'USB Cable', sku: 'USB-001', category: 'Cables', price: 9.99, quantity_in_stock: 100 },
    ];

    for (const product of demoProducts) {
      const productId = `prod_${crypto.randomBytes(12).toString('hex')}`;
      await db.insert(products).values({
        id: productId,
        ...product,
        reorder_level: 5,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    console.log(`✅ Created ${demoProducts.length} demo products`);

    console.log('\n✨ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();

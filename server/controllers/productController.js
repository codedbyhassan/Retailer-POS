import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Get all products
 */
export const getProducts = async (req, res) => {
  try {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  } catch (error) {
    logger.error(`Error fetching products: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};

/**
 * Create a new product (admin only)
 */
export const createProduct = async (req, res) => {
  try {
    const { name, sku, category, price, quantity_in_stock, reorder_level } = req.validatedData;

    const productId = `prod_${crypto.randomBytes(12).toString('hex')}`;

    await db.insert(products).values({
      id: productId,
      name,
      sku,
      category,
      price,
      quantity_in_stock: quantity_in_stock || 0,
      reorder_level: reorder_level || 10,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const created = await db.select().from(products).where(eq(products.id, productId));
    logger.info(`Product created: ${productId}`);
    res.status(201).json(created[0]);
  } catch (error) {
    logger.error(`Error creating product: ${error.message}`);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

/**
 * Update product
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await db.update(products).set({ ...updates, updated_at: new Date() }).where(eq(products.id, id));

    const updated = await db.select().from(products).where(eq(products.id, id));
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info(`Product updated: ${id}`);
    res.json(updated[0]);
  } catch (error) {
    logger.error(`Error updating product: ${error.message}`);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

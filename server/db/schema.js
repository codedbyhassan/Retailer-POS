import {
  pgTable,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('cashier'), // admin, cashier, manager
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sessions table for JWT tokens
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  barcode: varchar('barcode', { length: 100 }),
  category: varchar('category', { length: 100 }),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(0),
  reorderLevel: integer('reorder_level').notNull().default(0),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sales table
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  items: text('items').notNull(), // JSON array of sale items
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  notes: text('notes'),
  synced: boolean('synced').notNull().default(false),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Inventory logs table
export const inventoryLogs = pgTable('inventory_logs', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'purchase', 'sale', 'adjustment'
  quantity: integer('quantity').notNull(),
  reference: text('reference'), // sale_id or note
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Sync logs table
export const syncLogs = pgTable('sync_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'success', 'failed'
  changes: text('changes'), // JSON of what changed
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Define relationships
export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  sales: many(sales),
  syncLogs: many(syncLogs),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const saleRelations = relations(sales, ({ one }) => ({
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
}));

export const inventoryLogRelations = relations(inventoryLogs, ({ one }) => ({
  product: one(products, {
    fields: [inventoryLogs.productId],
    references: [products.id],
  }),
}));

export const syncLogRelations = relations(syncLogs, ({ one }) => ({
  user: one(users, {
    fields: [syncLogs.userId],
    references: [users.id],
  }),
}));

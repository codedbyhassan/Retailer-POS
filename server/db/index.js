import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.js';

const { Pool } = pkg;

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export pool for direct access if needed
export { pool };

// Health check function
export async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('[DB] Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('[DB] Database connection failed:', error.message);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    await pool.end();
    console.log('[DB] Database connection closed');
  } catch (error) {
    console.error('[DB] Error closing database connection:', error.message);
  }
}

import { Pool, QueryResult } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('WARNING: DATABASE_URL not set. Set it in .env file.');
  console.warn('Expected format: postgresql://user:password@host:port/database');
} else {
  console.log('✓ DATABASE_URL is set');
  // Log the host being used (safe to log without password)
  const match = connectionString.match(/@([^/]+)/);
  if (match) {
    console.log('  Connecting to:', match[1]);
  }
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("render.com")
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper for querying (returns array)
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  try {
    const result: QueryResult<T> = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error("Query error:", error, text, params);
    throw error;
  }
}

// Helper for single row
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  try {
    const result: QueryResult<T> = await pool.query(text, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error("QueryOne error:", error, text, params);
    throw error;
  }
}

// Helper for insert/update/delete (returns row count)
export async function execute(text: string, params: any[] = []): Promise<number> {
  try {
    const result = await pool.query(text, params);
    return result.rowCount || 0;
  } catch (error) {
    console.error("Execute error:", error, text, params);
    throw error;
  }
}

// Test connection on startup
pool.on("error", (err) => {
  console.error("Unexpected error on idle client:", err);
});

export default pool;
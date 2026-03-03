import { Pool, QueryResult } from "pg";
import Database from "better-sqlite3";
import path from "path";

const connectionString = process.env.DATABASE_URL;
let usingSQLite = false;
let sqliteDb: any = null;

if (!connectionString) {
  console.warn('⚠️  DATABASE_URL not set. Using SQLite fallback for local development.');
  try {
    const dbPath = path.join(process.cwd(), 'festora.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    usingSQLite = true;
    console.log('✅ SQLite database created:', dbPath);
  } catch (err) {
    console.error('Failed to initialize SQLite:', err);
  }
} else {
  console.log('✓ DATABASE_URL is set');
  const match = connectionString.match(/@([^/]+)/);
  if (match) {
    console.log('  Connecting to:', match[1]);
  }
}

export const pool = connectionString ? new Pool({
  connectionString,
  ssl: connectionString?.includes("render.com")
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}) : null;

// Helper for querying (returns array)
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  try {
    if (usingSQLite && sqliteDb) {
      const stmt = sqliteDb.prepare(text);
      return stmt.all(...params) as T[];
    }
    const result: QueryResult<T> = await pool!.query(text, params);
    return result.rows;
  } catch (error) {
    console.error("Query error:", error, text, params);
    throw error;
  }
}

// Helper for single row
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  try {
    if (usingSQLite && sqliteDb) {
      const stmt = sqliteDb.prepare(text);
      return stmt.get(...params) as T || null;
    }
    const result: QueryResult<T> = await pool!.query(text, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error("QueryOne error:", error, text, params);
    throw error;
  }
}

// Helper for insert/update/delete (returns row count)
export async function execute(text: string, params: any[] = []): Promise<number> {
  try {
    if (usingSQLite && sqliteDb) {
      const stmt = sqliteDb.prepare(text);
      const result = stmt.run(...params);
      return result.changes || 0;
    }
    const result = await pool!.query(text, params);
    return result.rowCount || 0;
  } catch (error) {
    console.error("Execute error:", error, text, params);
    throw error;
  }
}

// Test connection on startup
if (pool) {
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client:", err);
  });
}

export default pool || sqliteDb;
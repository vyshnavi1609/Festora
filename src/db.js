"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.queryOne = queryOne;
exports.execute = execute;
const pg_1 = require("pg");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.warn('WARNING: DATABASE_URL not set. Set it in .env file.');
    console.warn('Expected format: postgresql://user:password@host:port/database');
}
else {
    console.log('✓ DATABASE_URL is set');
    // Log the host being used (safe to log without password)
    const match = connectionString.match(/@([^/]+)/);
    if (match) {
        console.log('  Connecting to:', match[1]);
    }
}
exports.pool = new pg_1.Pool({
    connectionString,
    ssl: connectionString?.includes("render.com")
        ? { rejectUnauthorized: false }
        : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// Helper for querying (returns array)
async function query(text, params = []) {
    try {
        const result = await exports.pool.query(text, params);
        return result.rows;
    }
    catch (error) {
        console.error("Query error:", error, text, params);
        throw error;
    }
}
// Helper for single row
async function queryOne(text, params = []) {
    try {
        const result = await exports.pool.query(text, params);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error("QueryOne error:", error, text, params);
        throw error;
    }
}
// Helper for insert/update/delete (returns row count)
async function execute(text, params = []) {
    try {
        const result = await exports.pool.query(text, params);
        return result.rowCount || 0;
    }
    catch (error) {
        console.error("Execute error:", error, text, params);
        throw error;
    }
}
// Test connection on startup
exports.pool.on("error", (err) => {
    console.error("Unexpected error on idle client:", err);
});
exports.default = exports.pool;

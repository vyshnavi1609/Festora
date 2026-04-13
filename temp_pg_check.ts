import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
  });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(res.rows);
  } catch (err) {
    console.error('pg error', err);
  } finally {
    await pool.end();
  }
}

main();

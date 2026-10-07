const { neon } = require('@neondatabase/serverless');

// Use Vercel Postgres / Neon Database URL
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://dummy:dummy@dummy.com/dummy');

// Automatically create tables on boot if they don't exist
const initializeTables = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS drafts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        problem TEXT,
        solution TEXT,
        components TEXT,
        results TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Database tables verified!");
  } catch (err) {
    console.error("Failed to initialize database tables. Is DATABASE_URL set?", err);
  }
};

if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  initializeTables();
}

module.exports = { sql };

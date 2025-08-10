
// Support both Cloudflare Hyperdrive and local Postgres
let pool;

function getPgConfig(env) {
  // Cloudflare Hyperdrive binding
  if (env && env.HYPERDRIVE && env.HYPERDRIVE.connectionString) {
    console.log('[db.js] Using Cloudflare Hyperdrive connection string');
    return { connectionString: env.HYPERDRIVE.connectionString };
  }
  // Local development: prefer DATABASE_URL, else use PG* vars
  if (process.env.DATABASE_URL) {
    console.log('[db.js] Using DATABASE_URL:', process.env.DATABASE_URL);
    return { connectionString: process.env.DATABASE_URL };
  }
  // Support individual PG* variables
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
    console.log('[db.js] Using individual PG* variables:', {
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT
    });
    return {
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
    };
  }
  console.log('[db.js] No database configuration found.');
  throw new Error('No database configuration found. Set HYPERDRIVE, DATABASE_URL, or PG* variables.');
}

exports.init = function(env) {
  if (!pool) {
    const { Pool } = require('pg');
    const pgConfig = getPgConfig(env);
    pool = new Pool(pgConfig);
  }
};

exports.query = function(text, params) {
  if (!pool) {
    throw new Error('Database not initialized. Call db.init() first.');
  }
  return pool.query(text, params);
};

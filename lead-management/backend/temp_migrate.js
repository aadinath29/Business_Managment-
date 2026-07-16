const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Admin@123',
  database: 'Business'
});

async function runMigration() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'database', 'migration_v9.sql'), 'utf8');
    await pool.query(sql);
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await pool.end();
  }
}

runMigration();

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('./src/database');

async function runMigration() {
  const sqlPath = path.join(__dirname, 'database', 'migration_v11.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  try {
    console.log('Running migration_v11.sql...');
    await db.query(sql);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

runMigration();

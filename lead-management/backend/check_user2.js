require('dotenv').config({ path: 'c:/Users/DELL/Desktop/Main_Business_Management/lead-management/backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  try {
    const user = await pool.query(`
      SELECT id, first_name, last_name, email FROM users WHERE first_name ILIKE '%Harsh%'
    `);
    console.log('Users matching Harsh:', user.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();

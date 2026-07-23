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
    const res = await pool.query(`
      SELECT u.id, u.first_name, r.role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.first_name ILIKE '%Harsh%'
    `);
    console.log('Harsh Role:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();

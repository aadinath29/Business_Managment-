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
      SELECT b.id, b.branch_name, b.manager_id, u.first_name, u.last_name 
      FROM branches b 
      LEFT JOIN users u ON b.manager_id = u.id
      WHERE b.id IN ('a1710e8c-3204-4dda-bffc-929c9cc22cc1', 'd3a62b2d-c688-4f9e-b04d-51c93873af57')
    `);
    console.log('Branches:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();

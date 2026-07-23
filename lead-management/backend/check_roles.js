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
    const roles = await pool.query('SELECT * FROM roles');
    console.log('Roles:', roles.rows);
    
    const harsh = await pool.query(`SELECT role_id FROM users WHERE id = '61c91173-e1d3-41da-a894-86311b3fbd9d'`);
    console.log('Harsh role_id:', harsh.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();

require('dotenv').config();
const { pool } = require('./src/database');

async function checkAdmin() {
  try {
    const res = await pool.query(`
      SELECT u.id, u.email, r.name as role 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'SUPER_ADMIN' OR u.email LIKE '%admin%'
    `);
    console.log("Admins:", res.rows);
  } catch (error) {
    console.error("SQL ERROR:", error);
  } finally {
    pool.end();
  }
}

checkAdmin();

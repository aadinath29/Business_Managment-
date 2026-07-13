require('dotenv').config();
const { pool } = require('./src/database');

async function testFilter() {
  try {
    const res = await pool.query(`SELECT u.email, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email='admin@antigravity.com'`);
    console.log("Admin User Role:", res.rows[0]);
  } catch (error) {
    console.error("SQL ERROR:", error);
  } finally {
    pool.end();
  }
}

testFilter();

require('dotenv').config();
const { pool } = require('./src/database');

async function checkUser() {
  try {
    const res = await pool.query("SELECT id, email, role, tenant_id, first_name, last_name FROM users WHERE first_name = 'System' OR email LIKE '%admin%'");
    console.log("Users:", res.rows);
  } catch (error) {
    console.error("SQL ERROR:", error);
  } finally {
    pool.end();
  }
}

checkUser();

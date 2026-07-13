require('dotenv').config();
const { pool } = require('./src/database');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    const res = await pool.query(`
      UPDATE users SET password_hash = $1 WHERE email = 'admin@antigravity.com'
    `, [hash]);
    console.log("Password updated", res.rowCount);
  } catch (error) {
    console.error("SQL ERROR:", error);
  } finally {
    pool.end();
  }
}

resetPassword();

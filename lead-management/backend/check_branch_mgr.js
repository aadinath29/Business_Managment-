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
      SELECT id, branch_name, manager_id FROM branches WHERE id = 'a1710e8c-3204-4dda-bffc-929c9cc22cc1'
    `);
    console.log('Branch:', res.rows[0]);

    if (res.rows[0] && res.rows[0].manager_id) {
      const mgr = await pool.query(`
        SELECT id, email, role FROM users WHERE id = $1
      `, [res.rows[0].manager_id]);
      console.log('Manager User:', mgr.rows[0]);
    }
    
    // Also let's find all branches managed by this user
    if (res.rows[0] && res.rows[0].manager_id) {
      const branches = await pool.query(`
        SELECT id, branch_name FROM branches WHERE manager_id = $1
      `, [res.rows[0].manager_id]);
      console.log('All branches for this manager:', branches.rows);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();

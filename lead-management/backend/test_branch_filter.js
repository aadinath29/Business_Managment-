require('dotenv').config();
const { pool } = require('./src/database');

async function testFilter() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log("users schema:", res.rows);
  } catch (error) {
    console.error(error);
  } finally {
    pool.end();
  }
}

testFilter();



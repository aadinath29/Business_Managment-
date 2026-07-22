const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Admin@123',
  database: 'Business'
});

async function test() {
  try {
    const res = await pool.query('SELECT b.tenant_id as branch_tenant, u.tenant_id as user_tenant FROM users u LEFT JOIN branches b ON b.manager_id = u.id WHERE u.email = \'alise@gmail.com\'');
    console.log(res.rows);
  } catch (err) {
      console.log(err);
  } finally {
    process.exit(0);
  }
}
test();

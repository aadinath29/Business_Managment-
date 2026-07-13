require('dotenv').config();
const db = require('./src/database');

const run = async () => {
  try {
    console.log('--- Database Audit ---');
    
    // 1. Check Roles
    const roles = await db.query('SELECT * FROM roles');
    console.log('\n--- Roles ---');
    console.table(roles.rows);

    // 2. Check Tenants
    const tenants = await db.query('SELECT * FROM tenants');
    console.log('\n--- Tenants ---');
    console.table(tenants.rows);

    // 3. Check Users
    const users = await db.query('SELECT id, email, first_name, last_name, password_hash, role_id, tenant_id, status, deleted_at FROM users');
    console.log('\n--- Users ---');
    console.table(users.rows.map(u => ({ ...u, password_hash: u.password_hash ? u.password_hash.substring(0, 20) + '...' : null })));

    // 4. Check login sessions
    const sessions = await db.query('SELECT * FROM login_sessions');
    console.log('\n--- Login Sessions ---');
    console.table(sessions.rows);

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    process.exit(0);
  }
};

run();

require('dotenv').config();
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lead_management',
});

async function run() {
  await client.connect();
  const u = await client.query(`SELECT id, tenant_id FROM users LIMIT 1`);
  if (u.rows.length === 0) return console.log("No users found");
  
  const token = jwt.sign(
    { id: u.rows[0].id, role: 'SUPER_ADMIN', tenantId: u.rows[0].tenant_id },
    process.env.JWT_SECRET || 'super_secret_access_token_lead_management_crm_2026'
  );
  
  try {
    console.log("Fetching /reports/branches...");
    const res = await fetch('http://localhost:5000/api/v1/reports/branches', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
  
  await client.end();
}

run().catch(console.error);

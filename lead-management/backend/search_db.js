require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lead_management',
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT routine_definition 
    FROM information_schema.routines 
    WHERE routine_definition LIKE '%b.name%'
  `);
  console.log("Functions with b.name:", res.rows);
  const views = await client.query(`
    SELECT view_definition 
    FROM information_schema.views 
    WHERE view_definition LIKE '%b.name%'
  `);
  console.log("Views with b.name:", views.rows);
  await client.end();
}

run().catch(console.error);
